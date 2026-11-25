"""Run locally: python tests/test_scanner.py"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from tempfile import TemporaryDirectory

module_path = Path(__file__).resolve().parents[1] / 'custom_components' / 'hoffmann_video_ha' / 'scanner.py'
spec = spec_from_file_location('scanner', module_path)
scanner = module_from_spec(spec)
spec.loader.exec_module(scanner)

with TemporaryDirectory() as directory:
    root = Path(directory) / 'Videorecorder' / 'Backup' / 'Video'
    (root / 'Trickfilme').mkdir(parents=True)
    (root / 'Spielfilme').mkdir()
    (root / 'Trickfilme' / 'Der-König-der-Löwen-Zeichentrickfilm-USA-1994-.mkv').write_bytes(b'not-a-real-video')
    (root / 'Trickfilme' / 'Der-König-der-Löwen-Zeichentrickfilm-USA-1994-.nfo').write_text('''<?xml version="1.0" encoding="UTF-8"?>
<movie><title>Der König der Löwen</title><originaltitle>The Lion King</originaltitle><year>1994</year>
<plot>Simba wird König.</plot><runtime>88</runtime><genre>Zeichentrick</genre><genre>Abenteuer</genre>
<director>Roger Allers</director><actor><name>James Earl Jones</name></actor>
<uniqueid type="imdb" default="true">tt0110357</uniqueid>
<uniqueid type="wikidata">Q36479</uniqueid>
<ratings><rating name="imdb" max="10"><value>8.5</value></rating></ratings>
<hoffmann_video_manager version="1"><own_rating>9</own_rating><favorite>true</favorite><seen_date>2026-11-25</seen_date><times>2</times><duration_seconds>5280</duration_seconds></hoffmann_video_manager></movie>''', encoding='utf-8')
    (root / 'Spielfilme' / 'After.the.Dark.2013.mkv').write_bytes(b'')
    (root / 'Spielfilme' / 'bad.nfo').write_text('<!DOCTYPE movie [<!ENTITY x SYSTEM "file:///etc/passwd">]><movie><title>&x;</title></movie>')
    result = scanner.scan_library(str(root),'Videorecorder/Backup/Video')
    assert result['count'] == 2, result
    assert result['nfo_count'] == 1, result
    a,b=sorted(result['movies'], key=lambda m:m['filename'])
    assert a['title'] == 'After the Dark' and a['year']==2013, a
    assert b['title']=='Der König der Löwen' and b['imdb_id']=='tt0110357', b
    assert b['favorite'] and b['playcount']==2 and b['duration_seconds']==5280, b
    assert b['rating'] == 8.5 and b['rating_source'] == 'IMDb' and b['rating_estimated'] is False, b
    assert b['media_source_id']=='media-source://media_source/local/Videorecorder/Backup/Video/Trickfilme/Der-König-der-Löwen-Zeichentrickfilm-USA-1994-.mkv',b['media_source_id']
    assert not scanner.read_nfo(root / 'Spielfilme' / 'bad.nfo')
    # Sidecars, images and subtitles must not be video entries.
    (root / 'Spielfilme' / 'After.the.Dark.2013.srt').write_text('1\n00:00:01,000 --> 00:00:02,000\nHallo')
    (root / 'Spielfilme' / 'After.the.Dark.2013.jpg').write_bytes(b'')
    (root / 'Spielfilme' / 'standalone.nfo').write_text('<movie><title>Kein Film</title></movie>')
    only_videos=scanner.scan_library(str(root),'Videorecorder/Backup/Video')
    assert only_videos['count'] == 2 and all(m['extension'] not in ('.nfo','.srt','.jpg') for m in only_videos['movies'])
    # No IMDb label for a local KI estimate.
    (root / 'Spielfilme' / 'After.the.Dark.2013.nfo').write_text('<movie><title>After the Dark</title><ratings><rating name="hoffmann-ki-estimate"><value>7,3</value></rating></ratings></movie>',encoding='utf-8')
    ai=scanner.scan_library(str(root),'Videorecorder/Backup/Video')
    r=next(m for m in ai['movies'] if m['filename']=='After.the.Dark.2013.mkv')
    assert r['rating']==7.3 and r['rating_source']=='KI-Schätzung' and r['rating_estimated'], r
    # Generic Kodi <rating> is not automatically an IMDb rating.
    (root / 'Spielfilme' / 'After.the.Dark.2013.nfo').write_text('<movie><title>After the Dark</title><rating>6.5</rating></movie>',encoding='utf-8')
    generic=scanner.read_nfo(root / 'Spielfilme' / 'After.the.Dark.2013.nfo')
    assert generic['rating']==6.5 and generic['rating_source']=='NFO' and not generic['rating_estimated'],generic
    # Explicit IMDb must take precedence over any estimated rating.
    (root / 'Spielfilme' / 'After.the.Dark.2013.nfo').write_text('<movie><title>After the Dark</title><ratings><rating name="hoffmann-ki-estimate"><value>7</value></rating><rating name="imdb"><value>8.2</value></rating></ratings></movie>',encoding='utf-8')
    imdb=scanner.read_nfo(root / 'Spielfilme' / 'After.the.Dark.2013.nfo')
    assert imdb['rating']==8.2 and imdb['rating_source']=='IMDb' and imdb['rating_estimated'] is False, imdb

    # TS-Aufnahmen (auch großgeschriebene Dateiendung) gehören in den Katalog.
    for name in ('Weihnachtsfilm-2008.ts', 'Fernsehaufnahme-2009.TS', 'Konzert-2010.m2ts', 'Reportage-2011.mts', 'TV-Film-2012.trp', 'Film-2013.tp', 'Film-2014.m2t', 'Film-2015.m2v', 'Geburtstag-2024.MOV'):
        (root / 'Trickfilme' / name).touch()
    transport = scanner.scan_library(str(root), 'Videorecorder/Backup/Video')
    assert transport['count'] == 11, transport
    for suffix in ('.ts', '.m2ts', '.mts', '.trp', '.tp', '.m2t', '.m2v', '.mov'):
        assert any(m['extension'] == suffix for m in transport['movies']), suffix
    assert all(m['extension'] not in ('.nfo', '.srt', '.jpg') for m in transport['movies'])

    for n in range(150):
        (root / 'Trickfilme' / f'Testfilm-{n:03d}-2020.mp4').touch()
    result=scanner.scan_library(str(root),'Videorecorder/Backup/Video')
    assert result['count']==161
    assert result['nfo_count']==2
print('OK: nur Videos, IMDb-/KI-/NFO-Bewertungen, IMDb-ID, Unicode-Pfad, DTD-Sperre, 161 Videodateien')
