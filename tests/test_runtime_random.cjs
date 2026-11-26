// Regression: time thresholds, combining filters and picking from all pages.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('custom_components/hoffmann_video_ha/frontend/panel.js','utf8');
const Panel=vm.runInNewContext(source+'\nHoffmannVideoHAPanel',{HTMLElement:class{},customElements:{get(){return false;},define(){}}});
for(const [seconds,filter,expected] of [
  [0,'0-30',false],[null,'0-30',false],[-50,'0-30',false],['', '0-30',false],['garbage','0-30',false],
  [1,'0-30',true],[30*60,'0-30',true],[30*60+1,'0-30',false],
  [30*60,'30-60',false],[30*60+1,'30-60',true],[60*60,'30-60',true],[60*60+1,'30-60',false],
  [60*60,'60-90',false],[60*60+1,'60-90',true],[90*60,'60-90',true],[90*60+1,'60-90',false],
  [90*60,'90-180',false],[90*60+1,'90-180',true],[180*60,'90-180',true],[180*60+1,'90-180',false],
  [180*60,'over180',false],[180*60+1,'over180',true],
  [0,'unknown',true],[3599,'unknown',false],[0,'',true],[60*120,'',true],
  [3600,'something-else',false],
]){
  assert.equal(Panel.matchesDuration({duration_seconds:seconds},filter),expected,`seconds=${seconds}, filter=${filter}`);
}
assert.match(source,/id="duration"/);
for(const value of ['0-30','30-60','60-90','90-180','over180','unknown']){
  assert.ok(source.includes(`<option value="${value}">`),`Laufzeitoption fehlt: ${value}`);
}
assert.match(source,/id="random"/);
assert.match(source,/id="detailPlay"/);
assert.match(source,/Version 1\.0\.5/);
const p=Object.create(Panel.prototype);
p._selectedFormats=new Set(Panel.FORMAT_GROUPS.map(g=>g.id));
p._library=[
  {id:'a',filename:'Kurz.mkv',title:'Kurz',duration_seconds:44*60,genres:['Familie'],rating:8,rating_source:'IMDb'},
  {id:'b',filename:'Genau90.MOV',title:'Genau 90',duration_seconds:90*60,genres:['Familie'],rating:7.8,rating_source:'IMDb'},
  {id:'c',filename:'ZuLang.TS',title:'Zu lang',duration_seconds:90*60+1,genres:['Familie'],rating:9,rating_source:'IMDb'},
  {id:'d',filename:'Unbekannt.mp4',title:'Unbekannt',duration_seconds:0,genres:['Familie'],rating:9,rating_source:'IMDb'},
  {id:'e',filename:'AnderesGenre.avi',title:'Anderes',duration_seconds:3600,genres:['Horror'],rating:9,rating_source:'IMDb'},
  {id:'f',filename:'NiedrigeWertung.mkv',title:'Niedrig',duration_seconds:3000,genres:['Familie'],rating:4,rating_source:'IMDb'},
];
const controls={search:'',genre:'',seen:'',rating:'',ratingSource:'',duration:'',sort:'title'};
p.$=key=>({value:controls[key]??''});
p._renderRows=()=>{};
p._lastRandomId=null;
const titles=()=>Array.from(p._filtered,x=>x.title);
p._applyFilters();assert.equal(titles().length,6);
controls.duration='60-90';p._applyFilters();assert.deepEqual(titles(),['Genau 90']);
controls.genre='Familie';p._applyFilters();assert.deepEqual(titles(),['Genau 90']);
controls.rating='7';p._applyFilters();assert.deepEqual(titles(),['Genau 90']);
let choice;
p._showDetails=m=>{choice=m;};p._setStatus=()=>{};
for(let i=0;i<20;i++){
  const previous=choice?.id;
  p._pickRandomFilm();
  assert.ok(['b'].includes(choice.id));
  if(previous && p._filtered.length>1)assert.notEqual(choice.id,previous,'No repeats if at least two films match');
}
controls.rating='';controls.genre='Familie';controls.duration='';p._applyFilters();assert.equal(titles().length,5);
for(let i=0;i<20;i++){const previous=choice?.id;p._pickRandomFilm();if(previous)assert.notEqual(choice.id,previous,'Kein unmittelbarer Zufalls-Treffer bei mehreren Filmen');}
controls.genre='';controls.duration='0-30';p._applyFilters();assert.equal(titles().length,0);
controls.duration='unknown';p._applyFilters();assert.deepEqual(titles(),['Unbekannt']);
controls.rating='10';p._applyFilters();assert.equal(titles().length,0);
choice=null;p._pickRandomFilm();assert.equal(choice,null);
console.log('OK: Laufzeit-Intervalle mit präzisen Grenzen, unbekannte Laufzeiten ausgeschlossen, kombinierte Filter, Zufall aus aktueller Menge');
