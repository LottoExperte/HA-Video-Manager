"""Hoffmann Video-Manager V1.0.5: fast read-only film index for HA media sources."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

import voluptuous as vol

from homeassistant.components import frontend, panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store

from .scanner import scan_library

DOMAIN = "hoffmann_video_ha"
LOGGER = logging.getLogger(__name__)
KEY_ROOT = "media_root"
KEY_PREFIX = "media_source_prefix"
KEY_MAX = "max_files"
KEY_MIN_BYTES = "min_video_bytes"
CATALOG_SCHEMA = 5  # Re-scan for hidden files and minimum video size

CONFIG_SCHEMA = vol.Schema({
    DOMAIN: vol.Schema({
        vol.Required(KEY_ROOT): cv.string,
        vol.Optional(KEY_PREFIX, default=""): cv.string,
        vol.Optional(KEY_MAX, default=50000): vol.All(vol.Coerce(int), vol.Range(min=100, max=100000)),
        vol.Optional(KEY_MIN_BYTES, default=1000000): vol.All(vol.Coerce(int), vol.Range(min=0, max=1000000000)),
    }),
}, extra=vol.ALLOW_EXTRA)


@websocket_api.websocket_command({
    vol.Required("type"): "hoffmann_video_ha/library",
    vol.Optional("refresh", default=False): bool,
})
@websocket_api.async_response
async def ws_library(hass, connection, msg) -> None:
    """Return central film catalog. WebSocket auth is handled by Home Assistant."""
    state = hass.data.get(DOMAIN)
    if not state:
        connection.send_error(msg["id"], "not_ready", "Video-Manager nicht eingerichtet")
        return
    async with state["lock"]:
        try:
            result = state.get("cache")
            if result is None and not msg["refresh"]:
                result = await state["store"].async_load()
                if result and result.get("catalog_schema") != CATALOG_SCHEMA:
                    result = None
                if result and result.get("media_root") != state["media_root"]:
                    result = None
                if result and result.get("source_prefix") != state["source_prefix"]:
                    result = None
                if result and result.get("min_video_bytes") != state["min_video_bytes"]:
                    result = None
            if result is None or msg["refresh"]:
                # Obtain the last successful catalog for a removal counter.
                # Re-scans REPLACE it; never merge old and new lists.
                previous = state.get("cache")
                if previous is None:
                    previous = await state["store"].async_load()
                old_ids = {m.get("id") for m in previous.get("movies", [])} if isinstance(previous, dict) else set()
                result = await hass.async_add_executor_job(
                    scan_library,
                    state["media_root"],
                    state["source_prefix"],
                    state["max_files"],
                    state["min_video_bytes"],
                )
                new_ids = {m.get("id") for m in result["movies"]}
                result["removed_count"] = len(old_ids - new_ids)
                result["catalog_schema"] = CATALOG_SCHEMA
                result["media_root"] = state["media_root"]
                result["source_prefix"] = state["source_prefix"]
                result["scanned_at"] = datetime.now(timezone.utc).isoformat()
                await state["store"].async_save(result)
            state["cache"] = result
            connection.send_result(msg["id"], result)
        except (OSError, ValueError) as exc:
            LOGGER.warning("Video-Manager scan failed: %s", exc)
            connection.send_error(msg["id"], "scan_failed", str(exc))
        except Exception:
            LOGGER.exception("Video-Manager: unerwarteter Scanfehler")
            connection.send_error(msg["id"], "scan_failed", "Unerwarteter Fehler; Home-Assistant-Protokoll prüfen")


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up panel + authenticated WS scan endpoint."""
    options = config.get(DOMAIN)
    if options is None:
        return True
    root_path = Path(options[KEY_ROOT]).expanduser()
    root = str(root_path)
    prefix = options[KEY_PREFIX].strip().replace("\\", "/").strip("/")
    if not prefix:
        try:
            prefix = root_path.relative_to("/media").as_posix()
        except ValueError:
            LOGGER.error("media_root muss unter /media liegen oder media_source_prefix ist erforderlich")
            return False
    if not prefix or any(part in (".", "..", "") for part in prefix.split("/")):
        LOGGER.error("Ungültiger media_source_prefix: %s", prefix)
        return False
    if not root_path.is_absolute():
        LOGGER.error("media_root benötigt einen absoluten Pfad, z. B. /media/Videorecorder/Backup/Video")
        return False

    hass.data[DOMAIN] = {
        "media_root": root,
        "source_prefix": prefix,
        "max_files": options[KEY_MAX],
        "min_video_bytes": options[KEY_MIN_BYTES],
        "lock": asyncio.Lock(),
        "store": Store(hass, 1, "hoffmann_video_ha_catalog"),
        "cache": None,
    }

    websocket_api.async_register_command(hass, ws_library)
    panel_file = Path(__file__).parent / "frontend" / "panel.js"
    await hass.http.async_register_static_paths([
        StaticPathConfig("/hoffmann_video_ha/panel.js", str(panel_file), False)
    ])
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="hoffmann-video-ha-panel",
        frontend_url_path="hoffmann-video",
        module_url="/hoffmann_video_ha/panel.js?v=1.0.5-laufzeit-intervalle",
        sidebar_title="Video-Manager",
        sidebar_icon="mdi:filmstrip",
        require_admin=False,
        config={},
        config_panel_domain=DOMAIN,
    )
    LOGGER.info("Hoffmann Video-Manager aktiviert: Medien=%s, Source-Präfix=%s", root, prefix)
    return True
