"""Scanner regression: dotfiles, tiny videos, vanished movies and unreadable shares."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from tempfile import TemporaryDirectory

p=Path(__file__).resolve().parents[1] / "custom_components/hoffmann_video_ha/scanner.py"
spec=spec_from_file_location("ha_scanner_cleanup",p)
scanner=module_from_spec(spec)
spec.loader.exec_module(scanner)

with TemporaryDirectory() as temp:
    root=Path(temp)/"Video"
    (root/"Trickfilme").mkdir(parents=True)
    def media(name,size):
        file=root/"Trickfilme"/name
        with file.open('wb') as stream: stream.truncate(size)
        return file
    # Real film and its title, metadata from a same-name NFO.
    movie=media("Alles steht Kopf.mpg", 1_000_000)
    (root/"Trickfilme"/"Alles steht Kopf.nfo").write_text('<movie><title>Alles steht Kopf</title><year>2015</year></movie>',encoding='utf-8')
    # Typical AppleDouble resource forks sometimes have movie extensions.
    media("._Alles steht Kopf.mpg", 2_000_000)
    media("._Däumeline.mpg", 4096)
    media("Nur Trailer.mp4",999_999)
    media("Grenzfall.MOV",1_000_000)
    media("Fehlend.TS",0)
    (root/".hidden").mkdir()
    with (root/".hidden"/"Hidden.mkv").open('wb') as stream: stream.truncate(2_000_000)
    (root/"Trickfilme"/"._Alles steht Kopf.nfo").write_text('<movie><title>FALSCH</title></movie>',encoding='utf-8')
    result=scanner.scan_library(str(root), "Videorecorder/Backup/Video")
    assert result["count"]==2,result
    assert result["skipped_small"]==2,result
    assert result["skipped_hidden"]==2,result
    assert result["nfo_count"]==1,result
    assert {film['filename'] for film in result['movies']}=={'Alles steht Kopf.mpg','Grenzfall.MOV'}
    assert next(x for x in result['movies'] if x['filename']=='Alles steht Kopf.mpg')['title']=='Alles steht Kopf'
    assert result['min_video_bytes']==1_000_000

    # The next scan shows files removed/renamed on the disk are absent from the returned catalog.
    movie.unlink()
    after=scanner.scan_library(str(root),"Videorecorder/Backup/Video")
    assert after['count']==1 and all(m['filename']!='Alles steht Kopf.mpg' for m in after['movies'])
    assert (root/"Trickfilme"/"Alles steht Kopf.nfo").exists(),"Never modify/remove NFOs"
    assert (root/"Trickfilme"/"._Alles steht Kopf.mpg").exists(),"Never remove originals"

    # Optional size cutoff can be disabled for very short intentional videos.
    with_all=scanner.scan_library(str(root),"Videorecorder/Backup/Video",min_video_bytes=0)
    assert {m['filename'] for m in with_all['movies']}=={'Nur Trailer.mp4','Grenzfall.MOV','Fehlend.TS'}
    try:
        scanner.scan_library(str(root/"nicht-da"),"Videorecorder/Backup/Video")
        raise AssertionError('Missing root must fail instead of wiping catalog')
    except FileNotFoundError:
        pass

print('OK: hidden AppleDouble, 1 MB threshold, rescan prunes missing entries, NFOs untouched')
