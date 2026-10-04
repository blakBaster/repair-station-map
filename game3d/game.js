import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const SUPABASE_URL='https://fbyzaovfjnagwmvczxjs.supabase.co';
const SUPABASE_KEY='sb_publishable_kVGtNH6M4Z3qtPXDKO3j_w_-kk19zwd';
const ORIGIN={lat:52.231823780917104,lng:20.9849785985799};

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9cc7dc);
scene.fog=new THREE.Fog(0x9cc7dc,140,420);

const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,1000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xdbeafe,0x334155,2.2);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff3d2,3.2);
sun.position.set(80,120,40);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;
scene.add(sun);

const world=new THREE.Group();scene.add(world);

const groundMat=new THREE.MeshStandardMaterial({color:0x7a8d6b,roughness:1});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(700,700),groundMat);
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;world.add(ground);

const roadMat=new THREE.MeshStandardMaterial({color:0x2f343b,roughness:.95});
const sidewalkMat=new THREE.MeshStandardMaterial({color:0x9ca3af,roughness:1});
for(let i=-4;i<=4;i++){
  const r1=new THREE.Mesh(new THREE.BoxGeometry(700,.08,14),roadMat);r1.position.set(0,.04,i*70);world.add(r1);
  const r2=new THREE.Mesh(new THREE.BoxGeometry(14,.08,700),roadMat);r2.position.set(i*70,.04,0);world.add(r2);
  const s1a=new THREE.Mesh(new THREE.BoxGeometry(700,.12,4),sidewalkMat);s1a.position.set(0,.08,i*70-9);world.add(s1a);
  const s1b=s1a.clone();s1b.position.z=i*70+9;world.add(s1b);
  const s2a=new THREE.Mesh(new THREE.BoxGeometry(4,.12,700),sidewalkMat);s2a.position.set(i*70-9,.08,0);world.add(s2a);
  const s2b=s2a.clone();s2b.position.x=i*70+9;world.add(s2b);
}

function rand(x,z){
  const s=Math.sin(x*12.9898+z*78.233)*43758.5453;
  return s-Math.floor(s);
}
const buildingColors=[0xb8b1a5,0xc9c0b2,0xa8adb6,0xd4c7b5,0x9aa2ad];
for(let gx=-4;gx<4;gx++)for(let gz=-4;gz<4;gz++){
  const cx=gx*70+35,cz=gz*70+35;
  const lots=[[-18,-18],[18,-18],[-18,18],[18,18]];
  for(const [ox,oz] of lots){
    if(Math.abs(cx+ox)<30&&Math.abs(cz+oz)<30)continue;
    const w=22+rand(gx+ox,gz+oz)*10;
    const d=22+rand(gz+oz,gx+ox)*10;
    const h=12+rand(gx*3+ox,gz*7+oz)*42;
    const mat=new THREE.MeshStandardMaterial({color:buildingColors[Math.floor(rand(ox+gx,oz+gz)*buildingColors.length)],roughness:.9});
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    b.position.set(cx+ox,h/2,cz+oz);b.castShadow=true;b.receiveShadow=true;world.add(b);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.5,1.2,d*.5),new THREE.MeshStandardMaterial({color:0x4b5563}));
    roof.position.set(b.position.x,h+.6,b.position.z);roof.castShadow=true;world.add(roof);
  }
}

const plaza=new THREE.Mesh(new THREE.CylinderGeometry(26,26,.15,48),new THREE.MeshStandardMaterial({color:0xc7c2b6,roughness:1}));
plaza.position.y=.08;plaza.receiveShadow=true;world.add(plaza);

function makeTree(x,z){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.45,.6,4,8),new THREE.MeshStandardMaterial({color:0x6b4f32}));
  trunk.position.y=2;trunk.castShadow=true;g.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(2.4,10,8),new THREE.MeshStandardMaterial({color:0x3f7d44,roughness:1}));
  crown.position.y=5;crown.castShadow=true;g.add(crown);
  g.position.set(x,0,z);world.add(g);
}
for(let i=0;i<35;i++){const a=i/35*Math.PI*2;makeTree(Math.cos(a)*34,Math.sin(a)*34)}

function makePlayer(){
  const g=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xf0c5a4});
  const shirt=new THREE.MeshStandardMaterial({color:0x2563eb});
  const dark=new THREE.MeshStandardMaterial({color:0x111827});
  const head=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),skin);head.position.y=1.85;head.castShadow=true;g.add(head);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.75,5,10),shirt);body.position.y=1.15;body.castShadow=true;g.add(body);
  const legL=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.65,4,8),dark);legL.position.set(-.2,.42,0);legL.castShadow=true;g.add(legL);
  const legR=legL.clone();legR.position.x=.2;g.add(legR);
  g.userData={legL,legR,walkT:0};return g;
}
const player=makePlayer();scene.add(player);
player.position.set(0,0,0);

const stationGroup=new THREE.Group();scene.add(stationGroup);
const stationObjects=[];

function metersFromOrigin(lat,lng){
  const x=(lng-ORIGIN.lng)*111320*Math.cos(ORIGIN.lat*Math.PI/180);
  const z=-(lat-ORIGIN.lat)*111320;
  return {x,z};
}
function makeStation(station){
  const p=metersFromOrigin(station.lat,station.lng);
  if(Math.hypot(p.x,p.z)>320)return;
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,.24,20),new THREE.MeshStandardMaterial({color:0x334155}));
  base.position.y=.12;base.castShadow=true;g.add(base);
  const post=new THREE.Mesh(new THREE.BoxGeometry(.7,2.8,.7),new THREE.MeshStandardMaterial({color:0xf59e0b}));
  post.position.y=1.6;post.castShadow=true;g.add(post);
  const sign=new THREE.Mesh(new THREE.BoxGeometry(2.2,.9,.24),new THREE.MeshStandardMaterial({color:0x111827}));
  sign.position.set(0,2.85,0);sign.castShadow=true;g.add(sign);
  const wrench=new THREE.Mesh(new THREE.TorusGeometry(.34,.09,8,18,Math.PI*1.4),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x333333}));
  wrench.rotation.z=-.5;wrench.position.set(0,2.85,.16);g.add(wrench);
  g.position.set(p.x,0,p.z);g.userData.station=station;stationGroup.add(g);stationObjects.push(g);
}

async function loadStations(){
  try{
    const url=SUPABASE_URL+'/rest/v1/stations?select=id,name,lat,lng,has_tools,has_rack,has_pump,status,archived_at&archived_at=is.null&order=id.asc';
    const res=await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    data.filter(s=>Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng))).forEach(s=>makeStation({...s,lat:Number(s.lat),lng:Number(s.lng)}));
    document.getElementById('status').textContent='3D мир · '+stationObjects.length+' станций рядом';
  }catch(e){
    console.warn(e);document.getElementById('status').textContent='3D мир · станции недоступны';
  }
}

const keys=new Set();
let yaw=0,pitch=-.25;
let isPointerLocked=false;
document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(['w','a','s','d','shift','e'].includes(k))e.preventDefault();
  if(k==='e'&&!e.repeat)interact();
  keys.add(k);
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange',()=>isPointerLocked=document.pointerLockElement===renderer.domElement);
document.addEventListener('mousemove',e=>{
  if(!isPointerLocked)return;
  yaw-=e.movementX*.0022;
  pitch-=e.movementY*.0018;
  pitch=Math.max(-.65,Math.min(.3,pitch));
});

let nearest=null;
const stationHint=document.getElementById('stationHint');
const panel=document.getElementById('stationPanel');
document.getElementById('closePanel').onclick=()=>panel.classList.add('hidden');

function stationStatus(s){
  return s.status==='working'?'🟢 Рабочая':s.status==='broken'?'🔴 Есть неисправность':'🟡 Статус не подтверждён';
}
function interact(){
  if(!panel.classList.contains('hidden')){panel.classList.add('hidden');return}
  if(!nearest)return;
  const s=nearest.userData.station;
  document.getElementById('stationName').textContent=s.name||('Repair Station #'+s.id);
  document.getElementById('stationStatus').textContent=stationStatus(s);
  const chips=[];if(s.has_tools)chips.push('🧰 Инструменты');if(s.has_rack)chips.push('🚲 Стойка');if(s.has_pump)chips.push('💨 Насос');
  document.getElementById('stationEquipment').innerHTML=(chips.length?chips:['Оснащение не указано']).map(x=>'<span>'+x+'</span>').join('');
  panel.classList.remove('hidden');
}

const velocity=new THREE.Vector3();
const dir=new THREE.Vector3();
const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);

  let f=0,r=0;
  if(keys.has('w'))f+=1;if(keys.has('s'))f-=1;if(keys.has('d'))r+=1;if(keys.has('a'))r-=1;
  const moving=f||r;
  const speed=keys.has('shift')?9.5:5.2;

  dir.set(r,0,-f);
  if(dir.lengthSq()>0){
    dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
    velocity.lerp(dir.multiplyScalar(speed),1-Math.pow(.001,dt));
    player.position.addScaledVector(velocity,dt);
    const targetAngle=Math.atan2(velocity.x,velocity.z);
    player.rotation.y=targetAngle;
    const ud=player.userData;ud.walkT+=dt*(keys.has('shift')?12:8);
    ud.legL.rotation.x=Math.sin(ud.walkT)*.65;
    ud.legR.rotation.x=-Math.sin(ud.walkT)*.65;
  }else{
    velocity.lerp(new THREE.Vector3(),1-Math.pow(.0002,dt));
    player.userData.legL.rotation.x*=.8;player.userData.legR.rotation.x*=.8;
  }

  player.position.x=Math.max(-330,Math.min(330,player.position.x));
  player.position.z=Math.max(-330,Math.min(330,player.position.z));

  const camDist=8.5,camHeight=4.2;
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const camOffset=new THREE.Vector3(Math.sin(yaw)*camDist*cp,camHeight+sp*camDist,-Math.cos(yaw)*camDist*cp);
  const desired=player.position.clone().add(camOffset);
  camera.position.lerp(desired,1-Math.pow(.00005,dt));
  camera.lookAt(player.position.x,player.position.y+1.3,player.position.z);

  nearest=null;let best=Infinity;
  for(const s of stationObjects){
    const d=s.position.distanceTo(player.position);
    if(d<best){best=d;nearest=s}
  }
  const close=nearest&&best<4.2;
  stationHint.classList.toggle('hidden',!close);
  if(!close)nearest=null;

  renderer.render(scene,camera);
}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
loadStations();
animate();