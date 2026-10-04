(()=>{
'use strict';

const SUPABASE_URL='https://fbyzaovfjnagwmvczxjs.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_kVGtNH6M4Z3qtPXDKO3j_w_-kk19zwd';
const STREET_STYLE='https://tiles.openfreemap.org/styles/fiord';

const START={lat:52.231823780917104,lng:20.9849785985799};
const WALK_SPEED=2.35;
const RUN_SPEED=5.25;
const INTERACT_RADIUS=26;
const MAX_STAMINA=100;

const state={
  lat:START.lat,
  lng:START.lng,
  bearing:0,
  keys:new Set(),
  running:false,
  stamina:MAX_STAMINA,
  stations:[],
  markers:[],
  nearest:null,
  lastTime:performance.now(),
  modalOpen:false
};

const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

const map=new maplibregl.Map({
  container:'map',
  style:STREET_STYLE,
  center:[state.lng,state.lat],
  zoom:17.5,
  pitch:52,
  bearing:0,
  attributionControl:false,
  dragPan:false,
  scrollZoom:true,
  dragRotate:true,
  touchZoomRotate:true,
  keyboard:false
});

map.addControl(new maplibregl.AttributionControl({compact:true}));

const el={
  player:document.getElementById('player'),
  staminaBar:document.getElementById('staminaBar'),
  staminaText:document.getElementById('staminaText'),
  speedValue:document.getElementById('speedValue'),
  speedLabel:document.getElementById('speedLabel'),
  stationCount:document.getElementById('stationCount'),
  hint:document.getElementById('interactionHint'),
  modal:document.getElementById('stationModal'),
  stationName:document.getElementById('stationName'),
  stationStatus:document.getElementById('stationStatus'),
  stationEquipment:document.getElementById('stationEquipment'),
  stationDistance:document.getElementById('stationDistance'),
  closeModal:document.getElementById('closeModal'),
  interactBtn:document.getElementById('interactBtn'),
  runBtn:document.getElementById('runBtn')
};

function normalizeStation(s){
  return {
    id:s.id,
    name:s.name||('Repair Station #'+s.id),
    lat:Number(s.lat),
    lng:Number(s.lng),
    status:s.status||'unknown',
    has_tools:Boolean(s.has_tools),
    has_rack:Boolean(s.has_rack),
    has_pump:Boolean(s.has_pump)
  };
}

async function loadStations(){
  try{
    const {data,error}=await db.from('stations')
      .select('id,name,lat,lng,has_tools,has_rack,has_pump,status,archived_at')
      .is('archived_at',null)
      .order('id',{ascending:true});
    if(error)throw error;
    state.stations=(data||[]).map(normalizeStation).filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lng));
  }catch(err){
    console.warn('Game: stations unavailable',err);
    state.stations=[];
  }
  el.stationCount.textContent=state.stations.length+' станций';
  renderStationMarkers();
}

function renderStationMarkers(){
  state.markers.forEach(m=>m.remove());
  state.markers=[];
  for(const station of state.stations){
    const node=document.createElement('div');
    node.className='station-marker';
    node.textContent='🔧';
    node.title=station.name;
    node.addEventListener('click',()=>openStation(station));
    const marker=new maplibregl.Marker({element:node,anchor:'center'})
      .setLngLat([station.lng,station.lat])
      .addTo(map);
    marker.__station=station;
    marker.__node=node;
    state.markers.push(marker);
  }
}

function metersPerDegreeLng(lat){
  return 111320*Math.cos(lat*Math.PI/180);
}

function distanceMeters(a,b){
  const R=6371000;
  const p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180;
  const dp=(b.lat-a.lat)*Math.PI/180;
  const dl=(b.lng-a.lng)*Math.PI/180;
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

function movementVector(){
  let x=0,y=0;
  if(state.keys.has('w')||state.keys.has('arrowup'))y+=1;
  if(state.keys.has('s')||state.keys.has('arrowdown'))y-=1;
  if(state.keys.has('a')||state.keys.has('arrowleft'))x-=1;
  if(state.keys.has('d')||state.keys.has('arrowright'))x+=1;
  const len=Math.hypot(x,y)||1;
  return {x:x/len,y:y/len,moving:Boolean(x||y)};
}

function updateNearest(){
  let best=null,bestD=Infinity;
  for(const s of state.stations){
    const d=distanceMeters(state,s);
    if(d<bestD){best=s;bestD=d;}
  }
  state.nearest=best&&bestD<=INTERACT_RADIUS?{station:best,distance:bestD}:null;
  el.hint.classList.toggle('hidden',!state.nearest||state.modalOpen);
  for(const marker of state.markers){
    const isNear=Boolean(state.nearest&&String(marker.__station.id)===String(state.nearest.station.id));
    marker.__node.classList.toggle('near',isNear);
  }
}

function equipmentList(s){
  const list=[];
  if(s.has_tools)list.push('🧰 Инструменты');
  if(s.has_rack)list.push('🚲 Стойка');
  if(s.has_pump)list.push('💨 Насос');
  return list.length?list:['Оснащение не указано'];
}

function statusText(status){
  if(status==='working')return '🟢 Станция отмечена как рабочая';
  if(status==='broken')return '🔴 Есть сообщение о неисправности';
  return '🟡 Состояние станции не подтверждено';
}

function openStation(station){
  const d=distanceMeters(state,station);
  el.stationName.textContent=station.name;
  el.stationStatus.textContent=statusText(station.status);
  el.stationEquipment.innerHTML=equipmentList(station).map(x=>'<span>'+x+'</span>').join('');
  el.stationDistance.textContent='Расстояние от персонажа: '+Math.round(d)+' м';
  el.modal.classList.remove('hidden');
  state.modalOpen=true;
  el.hint.classList.add('hidden');
}

function closeStation(){
  el.modal.classList.add('hidden');
  state.modalOpen=false;
}

function interact(){
  if(state.modalOpen){closeStation();return;}
  if(state.nearest)openStation(state.nearest.station);
}

function tick(now){
  const dt=Math.min((now-state.lastTime)/1000,.05);
  state.lastTime=now;

  const mv=movementVector();
  const wantsRun=(state.keys.has('shift')||state.running)&&state.stamina>1&&mv.moving;
  const speed=wantsRun?RUN_SPEED:WALK_SPEED;

  if(mv.moving&&!state.modalOpen){
    const meters=speed*dt;
    state.lat+=(mv.y*meters)/111320;
    state.lng+=(mv.x*meters)/metersPerDegreeLng(state.lat);
    state.bearing=Math.atan2(mv.x,mv.y)*180/Math.PI;
    state.stamina=Math.max(0,state.stamina-(wantsRun?18:1.5)*dt);
  }else{
    state.stamina=Math.min(MAX_STAMINA,state.stamina+15*dt);
  }

  if(!wantsRun)state.stamina=Math.min(MAX_STAMINA,state.stamina+7*dt);

  el.player.classList.toggle('moving',mv.moving&&!state.modalOpen);
  el.player.classList.toggle('running',wantsRun&&!state.modalOpen);
  el.player.style.transform='rotate('+state.bearing+'deg)';
  el.staminaBar.style.width=state.stamina.toFixed(1)+'%';
  el.staminaText.textContent=Math.round(state.stamina)+'%';
  el.speedValue.textContent=(mv.moving&&!state.modalOpen?(speed*3.6):0).toFixed(1)+' км/ч';
  el.speedLabel.textContent=wantsRun?'БЕГ':'ХОДЬБА';

  map.jumpTo({center:[state.lng,state.lat]});
  updateNearest();
  requestAnimationFrame(tick);
}

function keyName(e){return String(e.key||'').toLowerCase();}

window.addEventListener('keydown',e=>{
  const k=keyName(e);
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e'].includes(k))e.preventDefault();
  if(k==='e'&&!e.repeat){interact();return;}
  state.keys.add(k);
});
window.addEventListener('keyup',e=>state.keys.delete(keyName(e)));
window.addEventListener('blur',()=>state.keys.clear());

el.closeModal.addEventListener('click',closeStation);
el.modal.addEventListener('click',e=>{if(e.target===el.modal)closeStation();});
el.interactBtn.addEventListener('click',interact);

for(const btn of document.querySelectorAll('[data-key]')){
  const k=btn.dataset.key.toLowerCase();
  const down=e=>{e.preventDefault();state.keys.add(k);};
  const up=e=>{e.preventDefault();state.keys.delete(k);};
  btn.addEventListener('pointerdown',down);
  btn.addEventListener('pointerup',up);
  btn.addEventListener('pointercancel',up);
  btn.addEventListener('pointerleave',up);
}
el.runBtn.addEventListener('pointerdown',e=>{e.preventDefault();state.running=true;});
for(const ev of ['pointerup','pointercancel','pointerleave'])el.runBtn.addEventListener(ev,e=>{e.preventDefault();state.running=false;});

map.on('load',async()=>{
  await loadStations();
  requestAnimationFrame(tick);
});

})();