/**
 * Hoffmann Video-Manager Home Assistant V1.0.4
 * No AI, no images, no user management, no external servers.
 * Uses authenticated Home Assistant WebSocket and a fresh media-source URL per play.
 */
class HoffmannVideoHAPanel extends HTMLElement {
  // Extensions are explicit: .nfo, subtitles and pictures never appear as films.
  static FORMAT_GROUPS = [
    {id:'avi', label:'AVI', extensions:['avi']},
    {id:'mpg', label:'MPG/MPEG', extensions:['mpg','mpeg','m2v']},
    {id:'mp4', label:'MP4/M4V', extensions:['mp4','m4v']},
    {id:'mkv', label:'MKV', extensions:['mkv']},
    {id:'ts', label:'TS', extensions:['ts']},
    {id:'m2ts', label:'M2TS/MTS', extensions:['m2ts','mts','m2t','trp','tp']},
    {id:'mov', label:'MOV', extensions:['mov']},
    {id:'wmv', label:'WMV', extensions:['wmv']},
    {id:'webm', label:'WEBM', extensions:['webm']},
    {id:'flv', label:'FLV', extensions:['flv']},
    {id:'vob', label:'VOB', extensions:['vob']},
    {id:'3gp', label:'3GP', extensions:['3gp']},
  ];
  static VIDEO_EXTENSIONS = new Set(HoffmannVideoHAPanel.FORMAT_GROUPS.flatMap(g=>g.extensions));
  static FORMAT_STORAGE_KEY = 'hoffmann_video_ha.selected_formats.v1';
  static extensionOf(movie) {
    const ext = String(movie.extension || String(movie.filename||'').split('.').pop()).trim().toLowerCase().replace(/^\./,'');
    return ext;
  }
  static groupForExtension(extension) {
    const ext=String(extension||'').toLowerCase().replace(/^\./,'');
    return HoffmannVideoHAPanel.FORMAT_GROUPS.find(g=>g.extensions.includes(ext))?.id || null;
  }
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._hass = null;
    this._ready = false;
    this._started = false;
    this._library = [];
    this._filtered = [];
    this._page = 0;
    this._pageSize = 70;
    this._genres = [];
    this._busy = false;
    this._lastRandomId = null;
    this._detailFilm = null;
    // Only a local display preference; the central media catalog remains untouched.
    this._selectedFormats = new Set(HoffmannVideoHAPanel.FORMAT_GROUPS.map(g=>g.id));
    try {
      const saved=JSON.parse(localStorage.getItem(HoffmannVideoHAPanel.FORMAT_STORAGE_KEY)||'null');
      if(Array.isArray(saved)) {
        const allowed=new Set(HoffmannVideoHAPanel.FORMAT_GROUPS.map(g=>g.id));
        this._selectedFormats=new Set(saved.filter(id=>allowed.has(id)));
      }
    } catch { /* Private browsing or storage may be unavailable. */ }
  }
  set hass(value) {
    this._hass = value;
    if (this.isConnected && this._ready && !this._started) {
      this._started = true;
      void this._load(false);
    }
  }
  get hass() { return this._hass; }
  connectedCallback() {
    if (!this._ready) this._init();
    if (this._hass && !this._started) {
      this._started = true;
      void this._load(false);
    }
  }
  disconnectedCallback() { this._stopPlayer(); }
  _init() {
    const s = this.shadowRoot;
    s.innerHTML = `
<style>
:host{display:block;height:100%;color:var(--primary-text-color,#202630);background:var(--primary-background-color,#fff);font:14px/1.45 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.55;cursor:wait}
main{max-width:1600px;margin:0 auto;padding:18px 20px 30px}
header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
h1{font-size:22px;line-height:1.25;margin:0;font-weight:650}.header-actions{display:flex;flex-wrap:wrap;gap:8px}.muted{color:var(--secondary-text-color,#707782)}.meta{font-size:12px;min-height:19px}
.toolbar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;padding:11px 0 14px}.toolbar input,.toolbar select{border:1px solid var(--divider-color,#d2d7dc);color:var(--primary-text-color,#1e2630);background:var(--card-background-color,#fff);border-radius:7px;padding:9px 11px;min-height:39px}
.toolbar input{flex:1 1 270px;min-width:150px}.toolbar select{flex:0 1 auto;max-width:220px}
.formatbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border-top:1px solid var(--divider-color,#d2d7dc);border-bottom:1px solid var(--divider-color,#d2d7dc);padding:9px 0;margin-bottom:9px}
.formatbar strong{font-size:13px;white-space:nowrap}.format-options{display:flex;gap:5px 12px;flex-wrap:wrap;align-items:center;flex:1 1 450px}
.format-option{display:inline-flex;gap:5px;align-items:center;font-size:12px;white-space:nowrap;cursor:pointer;user-select:none}
.format-option input{margin:0;accent-color:var(--primary-color,#1976d2);width:15px;height:15px;cursor:pointer}
.format-option .format-number{color:var(--secondary-text-color,#707782);font-size:11px}
.formatbar .button{min-height:29px;padding:4px 10px;font-size:12px}
.button{border:1px solid var(--divider-color,#c7ccd1);color:var(--primary-text-color,#1e2630);background:var(--card-background-color,#fff);border-radius:7px;padding:8px 11px;min-height:36px;white-space:nowrap}
.button:hover{background:var(--secondary-background-color,#eef1f4)}.primary{color:var(--text-primary-color,#fff);background:var(--primary-color,#1976d2);border-color:var(--primary-color,#1976d2)}.primary:hover{filter:brightness(.92);background:var(--primary-color,#1976d2)}
.count{padding:6px 0 11px;font-size:13px;color:var(--secondary-text-color,#66717e)}.status{min-height:23px;font-size:13px}.status.error{color:var(--error-color,#c62828)}
.table-wrap{border:1px solid var(--divider-color,#d8dfe5);border-radius:8px;overflow:auto;background:var(--card-background-color,#fff)}
table{width:100%;border-collapse:collapse;min-width:680px}th{text-align:left;font-size:12px;background:var(--secondary-background-color,#f1f4f6);padding:10px 12px;color:var(--secondary-text-color,#5e6775);font-weight:650;white-space:nowrap}
td{border-top:1px solid var(--divider-color,#e4e7ec);padding:8px 12px;vertical-align:middle}tbody tr:hover{background:var(--secondary-background-color,#f6f8fa)}
.name{font-weight:600}.sub{font-size:11px;color:var(--secondary-text-color,#717b88);white-space:normal;overflow-wrap:anywhere}.nowrap{white-space:nowrap}.actions{display:flex;gap:5px;justify-content:end}.actions button{padding:6px 9px;min-height:32px}.tiny{font-size:11px}
.paging{display:flex;justify-content:center;align-items:center;gap:14px;padding:16px 0}.paging button{min-width:90px}.empty{padding:30px;text-align:center;color:var(--secondary-text-color,#66717e)}
dialog{background:var(--card-background-color,#fff);color:var(--primary-text-color,#202630);border:1px solid var(--divider-color,#ccc);border-radius:10px;max-width:min(720px,calc(100vw - 24px));width:650px;max-height:85vh;overflow:auto;box-shadow:0 10px 50px #0004;padding:20px}dialog::backdrop{background:#0009}
dialog h2{font-size:20px;margin:0 30px 13px 0}.detail{display:grid;grid-template-columns:125px minmax(0,1fr);gap:8px 14px;margin:12px 0}.detail dt{font-weight:650;color:var(--secondary-text-color,#67707c)}.detail dd{margin:0;overflow-wrap:anywhere}.plot{white-space:pre-wrap;line-height:1.55}.detail-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}
a{color:var(--primary-color,#1976d2)}
.overlay{position:fixed;inset:0;z-index:1000;background:#000e;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 12px 25px;gap:12px;color:#fff}
.overlay[hidden], [hidden]{display:none!important}.playerbar{width:min(1200px,96vw);display:flex;justify-content:space-between;align-items:center;gap:10px}.playerbar strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
video{display:block;width:min(1200px,96vw);max-height:calc(100vh - 130px);background:#000}.overlay button{color:#fff;background:#333;border:1px solid #777;border-radius:7px;padding:8px 13px}.playerror{font-size:13px;text-align:center;color:#ffe6c0;max-width:900px}
@media(max-width:750px){table{min-width:0}main{padding:12px 9px 25px}h1{font-size:19px}th,td{padding:8px}.toolbar{gap:6px}.toolbar input{flex-basis:100%}.actions button{font-size:12px}.hide-sm{display:none}}
</style>
<main>
 <header><div><h1>Hoffmann Video-Manager</h1><div class="meta muted">Version 1.0.4 · Home Assistant · Filme aus „Meine Medien“ · NFO-Zusatzdateien</div></div>
 <div class="header-actions"><button type="button" id="random" class="button" disabled title="Zufallsfilm aus den aktuellen Such- und Filterergebnissen auswählen">🎲 Zufallsfilm</button><button type="button" id="scan" class="button">↻ Filme neu einlesen</button></div></header>
 <div id="status" class="status muted" role="status">Katalog wird geladen …</div>
 <div class="toolbar">
  <input type="search" id="search" aria-label="Film suchen" placeholder="Film suchen (Titel, Jahr, Genre, Darsteller, Ordner) …" autocomplete="off">
  <select id="genre" aria-label="Genre"><option value="">Alle Genres</option></select>
  <select id="seen" aria-label="Gesehen"><option value="">Alle Filme</option><option value="unseen">Noch nicht gesehen</option><option value="seen">Schon gesehen</option><option value="favorites">Favoriten</option><option value="nfo">Mit NFO</option><option value="no-nfo">Ohne NFO</option></select>
  <select id="rating" aria-label="Mindestbewertung" title="Filme nach Mindestbewertung filtern"><option value="">Alle Bewertungen</option><option value="rated">Mit Bewertung</option><option value="unrated">Ohne Bewertung</option><option value="5">Ab 5,0 Punkten</option><option value="6">Ab 6,0 Punkten</option><option value="6.5">Ab 6,5 Punkten</option><option value="7">Ab 7,0 Punkten</option><option value="7.5">Ab 7,5 Punkten</option><option value="8">Ab 8,0 Punkten</option><option value="8.5">Ab 8,5 Punkten</option><option value="9">Ab 9,0 Punkten</option><option value="9.5">Ab 9,5 Punkten</option></select>
  <select id="ratingSource" aria-label="Bewertungsquelle" title="KI-Schätzungen von echten IMDb-Bewertungen unterscheiden"><option value="">Alle Bewertungsquellen</option><option value="imdb">Nur IMDb-Bewertungen</option><option value="no-ai">Ohne KI-Schätzungen</option></select>
  <select id="duration" aria-label="Maximale Laufzeit" title="Nur Filme mit bekannter Laufzeit anzeigen, wenn ein Minutenlimit gewählt ist"><option value="">Alle Laufzeiten</option><option value="45">Bis 45 Minuten</option><option value="60">Bis 60 Minuten</option><option value="75">Bis 75 Minuten</option><option value="90">Bis 90 Minuten</option><option value="120">Bis 120 Minuten</option><option value="over90">Über 90 Minuten</option><option value="unknown">Laufzeit unbekannt</option></select>
  <select id="sort" aria-label="Sortieren"><option value="title">Titel A–Z</option><option value="year-desc">Jahr absteigend</option><option value="year-asc">Jahr aufsteigend</option><option value="folder">Ordner</option><option value="rating-desc">Bewertung absteigend</option><option value="duration-asc">Laufzeit aufsteigend</option></select>
 </div>
 <div class="formatbar" aria-label="Videoformate filtern">
   <strong>Dateiformate:</strong>
   <div id="formats" class="format-options" role="group" aria-label="Videoformate auswählen"></div>
   <button type="button" id="formatsAll" class="button" title="Alle Videoformate anzeigen">Alle</button>
 </div>
 <div id="count" class="count"></div>
 <div class="table-wrap"><table><thead><tr><th>Film</th><th>Jahr</th><th class="hide-sm">Genre</th><th>Bewertung</th><th class="hide-sm">Laufzeit</th><th class="hide-sm">Ordner</th><th style="text-align:right">Aktion</th></tr></thead><tbody id="rows"></tbody></table><div id="empty" class="empty" hidden>Keine Filme gefunden.</div></div>
 <div class="paging" id="paging"><button type="button" id="prev" class="button">← Zurück</button><span id="pageinfo"></span><button type="button" id="next" class="button">Weiter →</button></div>
</main>
<dialog id="details"><h2 id="detailTitle"></h2><dl class="detail" id="detailFields"></dl><div class="plot" id="detailPlot"></div><div class="detail-foot"><a id="imdbLink" target="_blank" rel="noopener noreferrer" hidden>IMDb öffnen</a><button type="button" class="button primary" id="detailPlay">▶ Abspielen</button><button type="button" class="button" id="detailClose">Schließen</button></div></dialog>
<div id="overlay" class="overlay" hidden><div class="playerbar"><strong id="playerTitle"></strong><button type="button" id="playerClose">✕ Schließen</button></div><video id="player" controls playsinline preload="metadata"></video><div id="playerror" class="playerror"></div></div>`;
    this._ready = true;
    this.$ = (id) => s.getElementById(id);
    this.$('scan').addEventListener('click',()=>void this._load(true));
    this.$('search').addEventListener('input',()=>this._applyFilters());
    this.$('genre').addEventListener('change',()=>this._applyFilters());
    this.$('seen').addEventListener('change',()=>this._applyFilters());
    this.$('rating').addEventListener('change',()=>{
      // Source filtering cannot apply to movies without any rating.
      this.$('ratingSource').disabled=this.$('rating').value==='unrated';
      this._applyFilters();
    });
    this.$('ratingSource').addEventListener('change',()=>this._applyFilters());
    this.$('sort').addEventListener('change',()=>this._applyFilters());
    this.$('duration').addEventListener('change',()=>this._applyFilters());
    this.$('random').addEventListener('click',()=>this._pickRandomFilm());
    this.$('formatsAll').addEventListener('click',()=>{
      this._selectedFormats=new Set(HoffmannVideoHAPanel.FORMAT_GROUPS.map(g=>g.id));
      this._saveFormatSelection();this._renderFormatFilters();this._applyFilters();
    });
    this.$('prev').addEventListener('click',()=>{this._page=Math.max(0,this._page-1);this._renderRows();});
    this.$('next').addEventListener('click',()=>{this._page++;this._renderRows();});
    this.$('detailClose').addEventListener('click',()=>this.$('details').close());
    this.$('detailPlay').addEventListener('click',()=>{const selected=this._detailFilm;this.$('details').close();if(selected)void this._play(selected);});
    this.$('playerClose').addEventListener('click',()=>this._stopPlayer());
    this.$('overlay').addEventListener('click',(e)=>{if(e.target===this.$('overlay'))this._stopPlayer();});
    this.$('player').addEventListener('error',()=>{if(!this.$('overlay').hidden)this.$('playerror').textContent='Dieses Videoformat wird von diesem Browser eventuell nicht unterstützt. Prüfe, ob derselbe Film unter Home Assistant → Medien abgespielt wird.';});
    this.$('player').addEventListener('loadeddata',()=>this.$('playerror').textContent='');
    this._escHandler=e=>{if(e.key==='Escape'&&!this.$('overlay').hidden)this._stopPlayer();};
    window.addEventListener('keydown',this._escHandler);
  }
  async _load(refresh) {
    if(!this._hass||this._busy)return;
    this._busy=true;
    const btn=this.$('scan');btn.disabled=true;
    this._setStatus(refresh?'Lese Filmordner und NFO-Dateien neu ein …':'Lade zentralen Filmkatalog …');
    try {
      const data=await this._hass.connection.sendMessagePromise({type:'hoffmann_video_ha/library',refresh:Boolean(refresh)});
      if(!Array.isArray(data.movies))throw Error('Die Serverantwort enthält keine Filmliste.');
      // Keep the table video-only even if an older cache or upstream API returns sidecars.
      const minBytes=Number(data.min_video_bytes)||0;
      this._library=data.movies.filter(m=>
        HoffmannVideoHAPanel.VIDEO_EXTENSIONS.has(HoffmannVideoHAPanel.extensionOf(m))
        && !String(m.filename||'').startsWith('.')
        && (m.size_bytes == null || m.size_bytes >= minBytes));
      this._genres=[...new Set(this._library.flatMap(m=>Array.isArray(m.genres)?m.genres:[]))]
        .filter(Boolean).sort((a,b)=>a.localeCompare(b,'de'));
      const genre=this.$('genre');const previous=genre.value;
      genre.replaceChildren(new Option('Alle Genres',''));
      for(const name of this._genres)genre.add(new Option(name,name));
      if(this._genres.includes(previous))genre.value=previous;
      this._renderFormatFilters();
      const when=data.scanned_at ? new Date(data.scanned_at).toLocaleString('de-DE') : 'unbekannt';
      const details=[];
      if(data.skipped_small)details.push(`${data.skipped_small} unter 1 MB ausgeblendet`);
      if(data.skipped_hidden)details.push(`${data.skipped_hidden} versteckte Begleitdateien ignoriert`);
      if(data.removed_count)details.push(`${data.removed_count} alte Katalogeinträge entfernt`);
      if(data.errors?.length)details.push(`Hinweise: ${data.errors.slice(0,2).join(' | ')}`);
      this._setStatus(`${this._library.length} Videos · NFO: ${data.nfo_count} · Katalog vom ${when}${details.length ? ' · '+details.join(' · ') : ''}`);
      this._applyFilters();
    } catch(err) {
      this._setStatus(`Katalog konnte nicht geladen werden: ${err?.message||String(err)}. Medienpfad in configuration.yaml prüfen.`,true);
    } finally {btn.disabled=false;this._busy=false;}
  }
  _setStatus(message,error=false){const el=this.$('status');el.textContent=message;el.className=error?'status error':'status muted';}
  _saveFormatSelection(){
    try { localStorage.setItem(HoffmannVideoHAPanel.FORMAT_STORAGE_KEY,JSON.stringify([...this._selectedFormats])); }
    catch { /* In private mode the selection remains valid for this page. */ }
  }
  _renderFormatFilters(){
    const holder=this.$('formats');holder.replaceChildren();
    const counts=new Map(HoffmannVideoHAPanel.FORMAT_GROUPS.map(g=>[g.id,0]));
    for(const movie of this._library){
      const id=HoffmannVideoHAPanel.groupForExtension(HoffmannVideoHAPanel.extensionOf(movie));
      if(id)counts.set(id,(counts.get(id)||0)+1);
    }
    // Keep commonly requested formats visible even when no films of that type were found.
    const basic=new Set(['avi','mpg','mp4','mkv','ts','mov']);
    for(const group of HoffmannVideoHAPanel.FORMAT_GROUPS){
      const count=counts.get(group.id)||0;
      if(!count&&!basic.has(group.id))continue;
      const label=this._node('label','format-option');
      const checkbox=document.createElement('input');checkbox.type='checkbox';
      checkbox.checked=this._selectedFormats.has(group.id);
      checkbox.setAttribute('aria-label',`${group.label} anzeigen (${count} Filme)`);
      checkbox.addEventListener('change',()=>{
        if(checkbox.checked)this._selectedFormats.add(group.id);
        else this._selectedFormats.delete(group.id);
        this._saveFormatSelection();this._applyFilters();
      });
      label.append(checkbox,this._node('span','',group.label),this._node('span','format-number',`(${count})`));
      holder.append(label);
    }
  }
  _applyFilters(){
    const q=this.$('search').value.trim().toLocaleLowerCase('de');
    const g=this.$('genre').value, seen=this.$('seen').value, sort=this.$('sort').value;
    const ratingFilter=this.$('rating').value, ratingSourceFilter=this.$('ratingSource').value;
    const durationFilter=this.$('duration').value;
    this._filtered=this._library.filter(m=>{
      const formatId=HoffmannVideoHAPanel.groupForExtension(HoffmannVideoHAPanel.extensionOf(m));
      if(!formatId||!this._selectedFormats.has(formatId))return false;
      if(q&&![m.title,m.original_title,m.year,m.genre,m.director,m.actors,m.filename,m.folder].join(' ').toLocaleLowerCase('de').includes(q))return false;
      if(g&&!(m.genres||[]).includes(g))return false;
      if(seen==='seen'&&!(m.playcount>0||m.seen_date))return false;
      if(seen==='unseen'&&(m.playcount>0||m.seen_date))return false;
      if(seen==='favorites'&&!m.favorite)return false;
      if(seen==='nfo'&&!m.has_nfo)return false;
      if(seen==='no-nfo'&&m.has_nfo)return false;
      if(!HoffmannVideoHAPanel.matchesDuration(m,durationFilter))return false;
      const value=HoffmannVideoHAPanel.ratingValue(m);
      if(ratingFilter==='rated'&&value===null)return false;
      if(ratingFilter==='unrated')return value===null;
      if(ratingFilter!==''&&ratingFilter!=='rated'&&value!==null&&value<Number(ratingFilter))return false;
      if(ratingFilter!==''&&ratingFilter!=='rated'&&value===null)return false;
      // A source filter is only relevant when a rating exists.
      if(value!==null){
        if(ratingSourceFilter==='imdb' && (m.rating_estimated||String(m.rating_source||'').trim().toLowerCase()!=='imdb'))return false;
        if(ratingSourceFilter==='no-ai' && (m.rating_estimated||String(m.rating_source||'').toLowerCase().includes('schätzung')))return false;
      } else if(ratingSourceFilter==='imdb')return false;
      return true;
    });
    const cmp=(a,b)=>String(a||'').localeCompare(String(b||''),'de',{numeric:true,sensitivity:'base'});
    this._filtered.sort((a,b)=>{
      switch(sort){
        case 'year-desc':return (b.year||0)-(a.year||0)||cmp(a.title,b.title);
        case 'year-asc':return (a.year||9999)-(b.year||9999)||cmp(a.title,b.title);
        case 'folder':return cmp(a.folder,b.folder)||cmp(a.title,b.title);
        case 'rating-desc':return (HoffmannVideoHAPanel.ratingValue(b)||0)-(HoffmannVideoHAPanel.ratingValue(a)||0)||cmp(a.title,b.title);
        case 'duration-asc':return (HoffmannVideoHAPanel.durationSeconds(a)||Infinity)-(HoffmannVideoHAPanel.durationSeconds(b)||Infinity)||cmp(a.title,b.title);
        default:return cmp(a.title,b.title);
      }
    });
    this._page=0;this._renderRows();
  }
  _node(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined&&txt!==null)el.textContent=String(txt);return el;}
  _renderRows(){
    const rows=this.$('rows');rows.replaceChildren();
    const start=this._page*this._pageSize,items=this._filtered.slice(start,start+this._pageSize);
    const fragment=document.createDocumentFragment();
    for(const m of items){
      const tr=this._node('tr');
      const titleCell=this._node('td');titleCell.append(this._node('div','name',m.title||m.filename));
      const hint=[HoffmannVideoHAPanel.extensionOf(m).toUpperCase(),m.favorite?'★ Favorit':'',m.playcount>0?'Gesehen':''].filter(Boolean).join(' · ');
      if(hint)titleCell.append(this._node('div','sub',hint));tr.append(titleCell);
      tr.append(this._node('td','nowrap',m.year||'–'));
      const genreCell=this._node('td','hide-sm',m.genre||'–');tr.append(genreCell);
      const ratingCell=this._node('td','nowrap',this._ratingLabel(m));
      ratingCell.title=this._ratingDescription(m);
      tr.append(ratingCell);
      const length=m.duration_seconds?`${Math.ceil(m.duration_seconds/60)} min`:'–';tr.append(this._node('td','hide-sm nowrap',length));
      const folderCell=this._node('td','hide-sm');folderCell.append(this._node('div','sub',m.folder||'Hauptordner'));tr.append(folderCell);
      const actionCell=this._node('td');const actionWrap=this._node('div','actions');
      const detail=this._node('button','button tiny','Info');detail.type='button';detail.title='Filminformationen anzeigen';detail.addEventListener('click',()=>this._showDetails(m));
      const play=this._node('button','button primary tiny','▶ Abspielen');play.type='button';play.addEventListener('click',()=>void this._play(m));
      actionWrap.append(detail,play);actionCell.append(actionWrap);tr.append(actionCell);fragment.append(tr);
    }
    rows.append(fragment);
    this.$('empty').hidden=this._filtered.length>0;
    this.$('count').textContent=`${this._filtered.length.toLocaleString('de-DE')} von ${this._library.length.toLocaleString('de-DE')} Filmen`;
    this.$('random').disabled=this._filtered.length===0;
    const pages=Math.max(1,Math.ceil(this._filtered.length/this._pageSize));
    this.$('paging').hidden=pages===1;
    this.$('pageinfo').textContent=`Seite ${this._page+1} von ${pages}`;
    this.$('prev').disabled=this._page===0;
    this.$('next').disabled=this._page>=pages-1;
  }
  static durationSeconds(m){
    // Unknown, invalid or zero duration must never pass a 'bis X Minuten' filter.
    const value=Number(m?.duration_seconds);
    return Number.isFinite(value)&&value>0?value:0;
  }
  static matchesDuration(movie,filter){
    const seconds=HoffmannVideoHAPanel.durationSeconds(movie);
    if(!filter)return true;
    if(filter==='unknown')return seconds===0;
    if(filter==='over90')return seconds>90*60;
    const minutes=Number(filter);
    return Number.isFinite(minutes)&&minutes>0&&seconds>0&&seconds<=minutes*60;
  }
  _pickRandomFilm(){
    // _filtered covers ALL pages and respects genre, rating, formats, search, duration.
    const choices=this._filtered;
    if(!choices.length){this._setStatus('Für die aktuellen Filter gibt es keinen Zufallsfilm.',true);return;}
    let index=Math.floor(Math.random()*choices.length);
    if(choices.length>1&&choices[index].id===this._lastRandomId){
      index=(index+1+Math.floor(Math.random()*(choices.length-1)))%choices.length;
    }
    const movie=choices[index];
    this._lastRandomId=movie.id;
    this._showDetails(movie);
  }
  static ratingValue(m){
    if(m.rating===null||m.rating===undefined||m.rating==='')return null;
    const v=Number(String(m.rating).replace(',','.'));
    return Number.isFinite(v)&&v>0&&v<=10?v:null;
  }
  _ratingLabel(m){
    const v=HoffmannVideoHAPanel.ratingValue(m);
    if(v===null)return '–';
    const formatted=v.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1});
    if(m.rating_estimated||String(m.rating_source||'').toLowerCase().includes('schätzung'))return `≈ ${formatted} (KI)`;
    return `${formatted} / 10`;
  }
  _ratingDescription(m){
    if(this._ratingLabel(m)==='–')return 'Keine Bewertung in NFO vorhanden';
    const source=String(m.rating_source||'NFO');
    return source==='IMDb'?'IMDb-Bewertung aus lokaler NFO (möglicherweise nicht aktuell)':`Bewertungsquelle: ${source}`;
  }
  _showDetails(m){
    this._detailFilm=m;
    this.$('detailTitle').textContent=m.title||m.filename;
    const dl=this.$('detailFields');dl.replaceChildren();
    const fields=[['Originaltitel',m.original_title],['Titelquelle',m.title_source||(m.has_nfo?'NFO':'Dateiname')],['Jahr',m.year],['Genre',m.genre],['Regie',m.director],['Darsteller',m.actors],['Laufzeit',m.duration_seconds?`${Math.ceil(m.duration_seconds/60)} Minuten`:null],['IMDb-ID',m.imdb_id],['Wikidata',m.wikidata_id],['Bewertung',this._ratingLabel(m)==='–'?null:this._ratingLabel(m)],['Bewertungsquelle',m.rating_source||null],['Eigene Bewertung',m.own_rating],['Gesehen',m.seen_date||((m.playcount>0)?'Ja':null)],['Datei',m.filename],['Ordner',m.folder||'Hauptordner'],['Zusatzdatei',m.has_nfo?'NFO vorhanden':'Keine NFO']];
    for(const [label,value] of fields){if(value===null||value===undefined||value==='')continue;dl.append(this._node('dt','',label),this._node('dd','',value));}
    this.$('detailPlot').textContent=m.plot||'';
    const imdb=this.$('imdbLink');
    if(/^tt\d{7,12}$/.test(m.imdb_id||'')){imdb.href=`https://www.imdb.com/title/${m.imdb_id}/`;imdb.hidden=false;}
    else{imdb.removeAttribute('href');imdb.hidden=true;}
    this.$('details').showModal();
  }
  async _play(m){
    this._setStatus(`Hole gültigen Wiedergabelink: ${m.title} …`);
    try{
      if(!this._hass)throw Error('Keine Home-Assistant-Verbindung');
      const result=await this._hass.connection.sendMessagePromise({type:'media_source/resolve_media',media_content_id:m.media_source_id});
      if(!result||!result.url)throw Error('Home Assistant hat keinen Wiedergabelink geliefert.');
      // Never store authSig URLs. Only use this fresh one for this playback instance.
      const url=new URL(result.url,window.location.href);
      if(url.origin!==window.location.origin)throw Error('Die Medienadresse liegt außerhalb der angemeldeten Home-Assistant-Adresse.');
      this._stopPlayer();
      this.$('overlay').hidden=false;
      this.$('playerTitle').textContent=m.title;
      this.$('playerror').textContent='';
      const player=this.$('player');
      player.src=url.href;
      player.load();
      try{await player.play();}catch{ /* Browsers may require a second click */ }
      this._setStatus(`Wiedergabe: ${m.title}`);
    }catch(err){
      this._setStatus(`Abspielen fehlgeschlagen: ${err?.message||String(err)}. Film bitte zum Vergleich direkt unter Home Assistant → Medien öffnen.`,true);
    }
  }
  _stopPlayer(){
    if(!this._ready)return;
    const player=this.$('player');
    player.pause();player.removeAttribute('src');player.load();
    this.$('overlay').hidden=true;
    this.$('playerror').textContent='';
  }
}
if(!customElements.get('hoffmann-video-ha-panel'))customElements.define('hoffmann-video-ha-panel',HoffmannVideoHAPanel);
