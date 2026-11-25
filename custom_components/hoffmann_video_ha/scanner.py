"""Read-only Samba/media scan for Hoffmann Video-Manager HA.

No third-party network calls. NFO files are read, never modified.
The URL is a *media source identifier*, not a signed /media/local URL.
"""

from __future__ import annotations

import os
import re
import unicodedata
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

VIDEO_SUFFIXES = frozenset({
    ".mkv", ".mp4", ".m4v", ".mov", ".avi", ".wmv", ".webm",
    ".mpg", ".mpeg", ".m2v", ".ts", ".m2ts", ".mts", ".m2t", ".trp", ".tp",
    ".flv", ".vob", ".3gp",
})
MAX_NFO_BYTES = 2_000_000

# Explicit allowlist: sidecars (.nfo, subtitles, posters) are never video rows.

IMDB_PATTERN = re.compile(r"^tt\d{7,12}$")
WIKIDATA_PATTERN = re.compile(r"^Q\d+$")
YEAR_PATTERN = re.compile(r"(?<!\d)(?:19\d{2}|20\d{2})(?!\d)")


def _child_value(element: ET.Element | None, child: str) -> str:
    if element is None:
        return ""
    found = element.find(child)
    return "" if found is None else "".join(found.itertext()).strip()


def _children_values(element: ET.Element, child: str) -> list[str]:
    return [x for x in (_child_value(y, "name") if child == "actor" else "".join(y.itertext()).strip()
                      for y in element.findall(child)) if x]


def _numeric(value: str, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError, OverflowError):
        return default


def _rating_number(value: str) -> float | None:
    """Accept 7.4 and German 7,4; never treat text as a numeric rating."""
    text = (value or "").strip().replace(",", ".")
    try:
        number = float(text)
    except (ValueError, TypeError, OverflowError):
        return None
    if not (0 < number <= 10):
        return None
    return round(number, 1)


def _nfo_rating(root: ET.Element, extra: ET.Element | None) -> tuple[float | None, str, bool]:
    """Find IMDb rating before other ratings; never label an estimate as IMDb.

    Supports Kodi <ratings>, simple <rating>, and common additional sidecar tags.
    Only ratings explicitly tagged IMDb are attributed to IMDb.
    """
    ratings = root.find("ratings")
    tagged = []
    if ratings is not None:
        for item in ratings.findall("rating"):
            source = (item.get("name") or item.get("source") or "").strip().casefold()
            raw = _child_value(item, "value") or (item.text or "").strip()
            value = _rating_number(raw)
            if value is not None:
                tagged.append((source, value))

    # Confirmed IMDb rating always wins over estimated/local ratings.
    for source, value in tagged:
        if source in {"imdb", "imdb.com"}:
            return value, "IMDb", False
    for tag in ("imdb_rating", "imdbrating", "imdbscore", "imdb"):
        value = _rating_number(_child_value(root, tag) or _child_value(extra, tag))
        if value is not None:
            return value, "IMDb", False
    for source, value in tagged:
        if source in {"hoffmann-ki-estimate", "ki-schaetzung", "ai-estimate", "ai_estimate"}:
            return value, "KI-Schätzung", True
    # Standard Kodi single <rating> does not necessarily mean IMDb.
    for tag in ("rating", "score"):
        value = _rating_number(_child_value(root, tag))
        if value is not None:
            return value, "NFO", False
    if tagged:
        return tagged[0][1], tagged[0][0] or "NFO", False
    return None, "", False


def _file_key(name: str) -> str:
    """Normalize Unicode/case; Samba shares can report composed/decomposed names."""
    return unicodedata.normalize("NFC", name).casefold()


def _stem_key(name: str) -> str:
    """Match sidecars when only punctuation/spaces differ (if unambiguous)."""
    stem = Path(name).stem
    return "".join(ch for ch in _file_key(stem) if ch.isalnum())


def _name_from_filename(stem: str) -> tuple[str, int | None]:
    cleaned = re.sub(r"[._]+", " ", stem).replace("-", " ")
    year_found = YEAR_PATTERN.search(cleaned)
    year = int(year_found.group(0)) if year_found else None
    if year_found:
        cleaned = cleaned[: year_found.start()]
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -_.,")
    return (cleaned or stem, year)


def read_nfo(path: Path) -> dict[str, Any]:
    """Parse Kodi + Hoffmann NFO without DTD/entity resolution or large files."""
    if path.is_symlink() or not path.is_file():
        return {}
    if path.stat().st_size > MAX_NFO_BYTES or path.stat().st_size <= 0:
        return {}
    contents = path.read_bytes()
    if re.search(br"<\s*!(DOCTYPE|ENTITY)\b", contents, re.IGNORECASE):
        return {}
    try:
        root = ET.fromstring(contents)
    except ET.ParseError:
        return {}
    if root.tag not in {"movie", "episodedetails"}:
        return {}
    extra = root.find("hoffmann_video_manager")
    imdb_id = ""
    wiki_id = ""
    for node in root.findall("uniqueid"):
        value = "".join(node.itertext()).strip()
        if node.get("type", "").lower() == "imdb" and IMDB_PATTERN.fullmatch(value):
            imdb_id = value
        if node.get("type", "").lower() == "wikidata" and WIKIDATA_PATTERN.fullmatch(value):
            wiki_id = value
    if not imdb_id:
        candidate = _child_value(root, "imdbid") or _child_value(root, "id")
        if IMDB_PATTERN.fullmatch(candidate):
            imdb_id = candidate
    runtime_minutes = _numeric(_child_value(root, "runtime"))
    duration_seconds = _numeric(_child_value(extra, "duration_seconds")) or runtime_minutes * 60
    genre_list = _children_values(root, "genre")
    # Respect Kodi and Hoffmann multi-element genre representation
    genre_list = [g.strip() for item in genre_list for g in re.split(r"[,;|]+", item) if g.strip()]
    rating, rating_source, rating_estimated = _nfo_rating(root, extra)
    title = _child_value(root, "title") or _child_value(root, "originaltitle")
    if not title:
        return {}
    year = _numeric(_child_value(root, "year")) or None
    seen_date = _child_value(extra, "seen_date") or _child_value(root, "lastplayed")
    played = _numeric(_child_value(extra, "times") or _child_value(root, "playcount"))
    return {
        "title": title,
        # Optional hint written by the Hoffmann desktop Video-Manager.
        # Used solely to associate a sidecar with the correct media file.
        "filename_hint": _child_value(extra, "filename"),
        "original_title": _child_value(root, "originaltitle"),
        "year": year,
        "genre": ", ".join(dict.fromkeys(genre_list)),
        "genres": list(dict.fromkeys(genre_list)),
        "plot": _child_value(root, "plot"),
        "director": ", ".join(_children_values(root, "director")),
        "actors": ", ".join(_children_values(root, "actor")),
        "imdb_id": imdb_id,
        "wikidata_id": wiki_id,
        "duration_seconds": duration_seconds,
        "rating": rating,
        "rating_source": rating_source,
        "rating_estimated": rating_estimated,
        "own_rating": _child_value(extra, "own_rating"),
        "seen_date": seen_date,
        "playcount": played,
        "favorite": _child_value(extra, "favorite").lower() == "true",
        "season": _numeric(_child_value(root, "season")) if root.tag == "episodedetails" else None,
        "episode": _numeric(_child_value(root, "episode")) if root.tag == "episodedetails" else None,
        "type": "episode" if root.tag == "episodedetails" else "movie",
    }


def scan_library(root: str, source_prefix: str, max_files: int = 50000) -> dict[str, Any]:
    """Scan local HA-mounted media tree; media file bytes are never read."""
    library_root = Path(root).resolve()
    if not library_root.exists():
        raise FileNotFoundError(f"Medienordner nicht vorhanden: {root}")
    if not library_root.is_dir():
        raise NotADirectoryError(f"Medienpfad ist kein Verzeichnis: {root}")
    prefix = source_prefix.replace("\\", "/").strip("/")
    if any(part in ("", ".", "..") for part in prefix.split("/")):
        raise ValueError("Ungültiger media_source_prefix")
    films: list[dict[str, Any]] = []
    errors: list[str] = []
    nfo_count = 0
    video_count = 0
    for parent, dirs, filenames in os.walk(library_root, topdown=True, followlinks=False):
        dirs[:] = [d for d in sorted(dirs, key=str.casefold)
                   if not (Path(parent) / d).is_symlink() and not d.startswith(".")]
        video_filenames = sorted(
            (name for name in filenames if Path(name).suffix.casefold() in VIDEO_SUFFIXES),
            key=str.casefold,
        )
        nfo_filenames = sorted(
            (name for name in filenames if Path(name).suffix.casefold() == ".nfo"),
            key=str.casefold,
        )
        # Build an index once per folder. Unlike strict basename matching, this
        # also supports minor punctuation differences and the original filename
        # embedded in sidecars written by Hoffmann Video-Manager.
        nfo_by_name: dict[str, list[str]] = {}
        nfo_by_stem: dict[str, list[str]] = {}
        nfo_by_hint: dict[str, list[str]] = {}
        parsed_nfo: dict[str, dict[str, Any]] = {}
        for name in nfo_filenames:
            nfo_by_name.setdefault(_file_key(name), []).append(name)
            nfo_by_stem.setdefault(_stem_key(name), []).append(name)
            try:
                data = read_nfo(Path(parent) / name)
            except (OSError, UnicodeError, ValueError) as exc:
                data = {}
                if len(errors) < 8:
                    errors.append(f"NFO {name}: {exc}")
            parsed_nfo[name] = data
            if data.get("filename_hint"):
                hint = str(data["filename_hint"]).replace("\\", "/").rsplit("/", 1)[-1]
                nfo_by_hint.setdefault(_file_key(hint), []).append(name)
        unique_video = len(video_filenames) == 1
        unique_nfo = len(nfo_filenames) == 1
        for filename in video_filenames:
            path = Path(parent) / filename
            if path.suffix.casefold() not in VIDEO_SUFFIXES or path.is_symlink() or not path.is_file():
                continue
            video_count += 1
            if video_count > max_files:
                raise ValueError(f"Dateilimit ({max_files}) erreicht. max_files in configuration.yaml erhöhen.")
            relative = path.relative_to(library_root).as_posix()
            folder = path.parent.relative_to(library_root).as_posix()
            if folder == ".":
                folder = ""
            nfo_name = None
            for candidates in (
                nfo_by_name.get(_file_key(path.stem + ".nfo"), []),
                nfo_by_hint.get(_file_key(filename), []),
                nfo_by_stem.get(_stem_key(filename), []),
                nfo_by_name.get("movie.nfo", []) if unique_video else [],
                nfo_filenames if unique_video and unique_nfo else [],
            ):
                # Never guess among multiple NFO candidates for one film.
                if len(candidates) == 1 and parsed_nfo.get(candidates[0]):
                    nfo_name = candidates[0]
                    break
            nfo = parsed_nfo.get(nfo_name, {}) if nfo_name else {}
            if nfo:
                nfo_count += 1
            guessed_title, guessed_year = _name_from_filename(path.stem)
            media_path = "/".join(x for x in (prefix, relative) if x)
            films.append({
                "id": media_path,
                "media_source_id": f"media-source://media_source/local/{media_path}",
                "relative_path": relative,
                "filename": filename,
                "folder": folder,
                "title": nfo.get("title") or guessed_title,
                "title_source": "NFO" if nfo.get("title") else "Dateiname",
                "year": nfo.get("year") or guessed_year,
                "genre": nfo.get("genre", ""),
                "genres": nfo.get("genres", []),
                "plot": nfo.get("plot", ""),
                "director": nfo.get("director", ""),
                "actors": nfo.get("actors", ""),
                "imdb_id": nfo.get("imdb_id", ""),
                "wikidata_id": nfo.get("wikidata_id", ""),
                "original_title": nfo.get("original_title", ""),
                "duration_seconds": nfo.get("duration_seconds", 0),
                "rating": nfo.get("rating"),
                "rating_source": nfo.get("rating_source", ""),
                "rating_estimated": nfo.get("rating_estimated", False),
                "own_rating": nfo.get("own_rating", ""),
                "seen_date": nfo.get("seen_date", ""),
                "playcount": nfo.get("playcount", 0),
                "favorite": nfo.get("favorite", False),
                "season": nfo.get("season"),
                "episode": nfo.get("episode"),
                "type": nfo.get("type", "movie"),
                "has_nfo": bool(nfo),
                "extension": path.suffix.lower(),
            })
    return {"movies": films, "count": len(films), "nfo_count": nfo_count, "errors": errors}
