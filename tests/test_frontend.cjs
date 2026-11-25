// Minimal no-browser unit tests for rating labels and strict video extensions.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('custom_components/hoffmann_video_ha/frontend/panel.js', 'utf8');
const ctx = {
  HTMLElement: class {},
  customElements: { get(){ return false; }, define(){} },
};
const Panel = vm.runInNewContext(source+'\nHoffmannVideoHAPanel', ctx);
const p = Object.create(Panel.prototype);
assert.equal(p._ratingLabel({rating: 8.2, rating_source: 'IMDb'}), '8,2 / 10');
assert.equal(p._ratingLabel({rating: 6.2, rating_source:'KI-Schätzung',rating_estimated:true}), '≈ 6,2 (KI)');
assert.equal(p._ratingLabel({rating: null}), '–');
assert.equal(p._ratingDescription({rating: 8.2, rating_source:'IMDb'}).includes('IMDb'), true);
assert.equal(Panel.VIDEO_EXTENSIONS.has('mkv'), true);
assert.equal(Panel.VIDEO_EXTENSIONS.has('nfo'), false);
assert.equal(Panel.VIDEO_EXTENSIONS.has('srt'), false);
assert.equal(Panel.VIDEO_EXTENSIONS.has('ts'), true);
assert.equal(Panel.VIDEO_EXTENSIONS.has('mov'), true);
assert.equal(Panel.VIDEO_EXTENSIONS.has('nfo'), false);
assert.equal(Panel.VIDEO_EXTENSIONS.has('m2ts'), true);
assert.equal(Panel.VIDEO_EXTENSIONS.has('trp'), true);
assert.equal(Panel.extensionOf({filename:'Weihnachten-2001.TS'}), 'ts');
assert.equal(Panel.extensionOf({filename:'Ferienfilm-2024.MOV'}), 'mov');
assert.equal(Panel.groupForExtension('.mov'), 'mov');
assert.match(source,/const basic=new Set\(\['avi','mpg','mp4','mkv','ts','mov'\]\)/);
assert.match(source,/Version 1\.0\.1/);
assert.equal(Panel.extensionOf({extension:'.TS',filename:'Weihnachten-2001.mkv'}), 'ts');
assert.equal(Panel.groupForExtension('.ts'), 'ts');
assert.equal(Panel.groupForExtension('mpeg'), 'mpg');
assert.equal(Panel.groupForExtension('m4v'), 'mp4');
assert.equal(Panel.groupForExtension('nfo'), null);
assert.equal(Panel.groupForExtension('srt'), null);
const fake = Object.create(Panel.prototype);
fake._selectedFormats=new Set(['ts','mp4']);
fake._library=[
 {filename:'Film1.TS',title:'Film1',genres:[]},
 {filename:'Film2.mkv',title:'Film2',genres:[]},
 {filename:'Film3.mp4',title:'Film3',genres:[]},
 {filename:'Film4.MOV',title:'Film4',genres:[]},
];
fake.$ = key => ({value: key==='sort' ? 'title' : ''});
fake._renderRows=()=>{};
fake._applyFilters();
assert.deepEqual(Array.from(fake._filtered.map(m=>m.filename)),['Film1.TS','Film3.mp4']);
fake._selectedFormats.delete('ts');fake._applyFilters();
assert.deepEqual(Array.from(fake._filtered.map(m=>m.filename)),['Film3.mp4']);
fake._selectedFormats.add('mov');fake._applyFilters();
assert.deepEqual(Array.from(fake._filtered.map(m=>m.filename)),['Film3.mp4','Film4.MOV']);
console.log('OK: Ratings, nur Videoformate, TS-/MOV-Scan, Format-Checkbox-Filter');
