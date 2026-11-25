// Regression: time thresholds, combining filters and picking from all pages.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('custom_components/hoffmann_video_ha/frontend/panel.js','utf8');
const Panel=vm.runInNewContext(source+'\nHoffmannVideoHAPanel',{HTMLElement:class{},customElements:{get(){return false;},define(){}}});
for(const [seconds,filter,expected] of [
  [0,'90',false],[null,'90',false],[-50,'90',false],['', '90',false],['garbage','90',false],
  [1,'90',true],[60*45,'45',true],[60*90,'90',true],[60*90+1,'90',false],
  [60*90+1,'over90',true],[60*90,'over90',false],
  [0,'unknown',true],[3599,'unknown',false],[0,'',true],[60*120,'120',true],
]){
  assert.equal(Panel.matchesDuration({duration_seconds:seconds},filter),expected,`seconds=${seconds}, filter=${filter}`);
}
assert.match(source,/id="duration"/);
assert.match(source,/Bis 90 Minuten/);
assert.match(source,/id="random"/);
assert.match(source,/id="detailPlay"/);
assert.match(source,/Version 1\.0\.4/);
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
controls.duration='90';p._applyFilters();assert.deepEqual(titles(),['Anderes','Genau 90','Kurz','Niedrig']);
controls.genre='Familie';p._applyFilters();assert.deepEqual(titles(),['Genau 90','Kurz','Niedrig']);
controls.rating='7';p._applyFilters();assert.deepEqual(titles(),['Genau 90','Kurz']);
let choice;
p._showDetails=m=>{choice=m;};p._setStatus=()=>{};
for(let i=0;i<20;i++){
  const previous=choice?.id;
  p._pickRandomFilm();
  assert.ok(['a','b'].includes(choice.id));
  if(previous)assert.notEqual(choice.id,previous,'No repeats if at least two films match');
}
controls.duration='unknown';p._applyFilters();assert.deepEqual(titles(),['Unbekannt']);
controls.rating='10';p._applyFilters();assert.equal(titles().length,0);
choice=null;p._pickRandomFilm();assert.equal(choice,null);
console.log('OK: Laufzeit 90:00 inklusive, unbekannte Laufzeiten ausgeschlossen, kombinierte Filter, Zufall aus aktueller Menge');
