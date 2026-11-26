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
assert.match(source,/Version 1\.0\.5/);
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
// Regression tests for min rating, rated/unrated and explicit IMDb source, with all video formats visible.
const p2=Object.create(Panel.prototype);
p2._selectedFormats=new Set(Panel.FORMAT_GROUPS.map(g=>g.id));
p2._library=[
 {filename:'SehrGut.mkv',title:'SehrGut',genres:[],rating:8.5,rating_source:'IMDb'},
 {filename:'Gut.MP4',title:'Gut',genres:[],rating:7,rating_source:'NFO'},
 {filename:'Schaetzung.TS',title:'Schaetzung',genres:[],rating:9,rating_source:'KI-Schätzung',rating_estimated:true},
 {filename:'Schwach.MOV',title:'Schwach',genres:[],rating:5.2,rating_source:'IMDb'},
 {filename:'Keine.avi',title:'Keine',genres:[],rating:null,rating_source:''},
 {filename:'Ungueltig.mpeg',title:'Ungueltig',genres:[],rating:11,rating_source:'IMDb'},
];
const values={search:'',genre:'',seen:'',sort:'title',rating:'',ratingSource:''};
p2.$=key=>({value:values[key]??''});
p2._renderRows=()=>{};
const visible=()=>Array.from(p2._filtered.map(m=>m.title));
p2._applyFilters();
assert.deepEqual(visible(),['Gut','Keine','Schaetzung','Schwach','SehrGut','Ungueltig']);
values.rating='7';p2._applyFilters();
assert.deepEqual(visible(),['Gut','Schaetzung','SehrGut']);
values.ratingSource='imdb';p2._applyFilters();
assert.deepEqual(visible(),['SehrGut']);
values.ratingSource='no-ai';p2._applyFilters();
assert.deepEqual(visible(),['Gut','SehrGut']);
values.ratingSource='';values.rating='7.5';p2._applyFilters();
assert.deepEqual(visible(),['Schaetzung','SehrGut']);
values.rating='rated';p2._applyFilters();
assert.deepEqual(visible(),['Gut','Schaetzung','Schwach','SehrGut']);
values.rating='unrated';values.ratingSource='imdb';p2._applyFilters();
assert.deepEqual(visible(),['Keine','Ungueltig']);
values.rating='';values.ratingSource='imdb';p2._applyFilters();
assert.deepEqual(visible(),['Schwach','SehrGut']);
assert.equal(Panel.ratingValue({rating:'8,5'}),8.5);
assert.equal(Panel.ratingValue({rating:'0'}),null);
assert.equal(Panel.ratingValue({rating:undefined}),null);
assert.match(source,/id="rating"/);
assert.match(source,/id="ratingSource"/);
console.log('OK: Ratings, Videoformate, NFO, TS/MOV, Bewertungsschwellen, IMDb-Quellenfilter');
