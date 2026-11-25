"""Read runtime variants from NFO and preserve unknown durations."""
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
from tempfile import TemporaryDirectory

p=Path(__file__).resolve().parents[1]/'custom_components'/'hoffmann_video_ha'/'scanner.py'
spec=spec_from_file_location('ha_scanner_runtime',p)
scanner=module_from_spec(spec)
spec.loader.exec_module(scanner)
for txt,expected in [('90',90),('90 min',90),('90 minuten',90),('01:30:00',90),('01:30:01',90+1/60),('1h 30m',90),('88,5',88.5),('',0),('0',0),('90 min 25 sec',0)]:
    assert scanner._runtime_minutes(txt)==expected,(txt,scanner._runtime_minutes(txt),expected)
with TemporaryDirectory() as tmp:
    path=Path(tmp)/'test.nfo'
    path.write_text('<movie><title>A</title><runtime>01:30:00</runtime></movie>',encoding='utf-8')
    assert scanner.read_nfo(path)['duration_seconds']==5400
    path.write_text('<movie><title>B</title><runtime>01:30:01</runtime></movie>',encoding='utf-8')
    assert scanner.read_nfo(path)['duration_seconds']==5401
    path.write_text('<movie><title>C</title><runtime>1h 30m</runtime></movie>',encoding='utf-8')
    assert scanner.read_nfo(path)['duration_seconds']==5400
    path.write_text('<movie><title>D</title><runtime>120</runtime><hoffmann_video_manager><duration_seconds>3899</duration_seconds></hoffmann_video_manager></movie>',encoding='utf-8')
    assert scanner.read_nfo(path)['duration_seconds']==3899
    path.write_text('<movie><title>E</title><runtime>garbage</runtime></movie>',encoding='utf-8')
    assert scanner.read_nfo(path)['duration_seconds']==0
print('OK: Laufzeit-Kodierungen aus NFO; unbekannte Laufzeiten bleiben unbekannt')
