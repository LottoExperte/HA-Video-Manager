"""Verify visible titles prefer the desktop Video-Manager NFO metadata."""
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
from tempfile import TemporaryDirectory

def make_video(path):
    with path.open('wb') as f:
        f.truncate(1_000_001)

p = Path(__file__).resolve().parents[1] / "custom_components" / "hoffmann_video_ha" / "scanner.py"
spec = spec_from_file_location("ha_scanner_titles", p)
scanner = module_from_spec(spec)
spec.loader.exec_module(scanner)

with TemporaryDirectory() as tmp:
    base = Path(tmp)
    folder = base / "Trickfilme"
    folder.mkdir()
    video = folder / "Der-König-der-Löwen-Zeichentrickfilm-USA-1994-.mkv"
    make_video(video)
    nfo = folder / "Der-König-der-Löwen-Zeichentrickfilm-USA-1994-.nfo"
    nfo.write_text('<movie><title>Der König der Löwen</title><year>1994</year></movie>', encoding="utf-8")
    one = scanner.scan_library(str(base), "Videorecorder/Backup/Video")
    assert one["movies"][0]["title"] == "Der König der Löwen"
    assert one["movies"][0]["title_source"] == "NFO"
    assert one["movies"][0]["filename"] == video.name
    assert one["nfo_count"] == 1

    # Same film, but sidecar uses spaces instead of hyphens and underscores.
    nfo.rename(folder / "Der König der Löwen Zeichentrickfilm USA 1994.nfo")
    two = scanner.scan_library(str(base), "Videorecorder/Backup/Video")
    assert two["movies"][0]["title"] == "Der König der Löwen", two

    # NFO uses an unrelated filename, but includes a precise hint exported by
    # the desktop video-manager. A second video must not pick up this NFO.
    other = folder / "Anderer-Film-2001.mp4"
    make_video(other)
    hint_nfo = next(folder.glob('*.nfo'))
    hint_nfo.rename(folder / "Metadaten-1.nfo")
    (folder / "Metadaten-1.nfo").write_text(f'<movie><title>Der König der Löwen</title><hoffmann_video_manager><filename>{video.name}</filename></hoffmann_video_manager></movie>', encoding="utf-8")
    three = scanner.scan_library(str(base), "Videorecorder/Backup/Video")
    items = {item["filename"]: item for item in three["movies"]}
    assert items[video.name]["title"] == "Der König der Löwen", three
    assert items[other.name]["title"] == "Anderer Film", three
    assert items[other.name]["title_source"] == "Dateiname"
    assert three["nfo_count"] == 1

    # Other title fields can still be useful in non-Hoffmann NFO files.
    (folder / "Metadaten-1.nfo").write_text(f'<movie><originaltitle>The Lion King</originaltitle><hoffmann_video_manager><filename>{video.name}</filename></hoffmann_video_manager></movie>', encoding='utf-8')
    four = scanner.scan_library(str(base), "Videorecorder/Backup/Video")
    assert next(x for x in four["movies"] if x["filename"] == video.name)["title"] == "The Lion King"

print('OK: prioritizes real film title from sidecar, punctuation and filename hint match, safe fallback')
