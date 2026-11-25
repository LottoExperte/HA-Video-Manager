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
    assert b['media_source_id']=='media-source://media_source/local/Videorecorder/Backup/Video/Trickfilme/Der-König-der-Löwen-Zeichentrickfilm-USA-1994-.mkv',b['media_source_id']
    assert not scanner.read_nfo(root / 'Spielfilme' / 'bad.nfo')
    for n in range(150):
        (root / 'Trickfilme' / f'Testfilm-{n:03d}-2020.mp4').touch()
    result=scanner.scan_library(str(root),'Videorecorder/Backup/Video')
    assert result['count']==152
    assert result['nfo_count']==1
print('OK: NFO-Felder, IMDb-ID, Unicode-Pfad, Fallback-Titel, DTD-Sperre, 152 Videodateien')
