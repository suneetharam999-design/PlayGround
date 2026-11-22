import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas=document.querySelector('#world');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9d776f);
scene.fog=new THREE.FogExp2(0x526266,.0018);
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,900);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const hemi=new THREE.HemisphereLight(0xffd5bd,0x293d3d,2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffbb95,3.0);sun.position.set(-110,145,-70);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-230;sun.shadow.camera.right=230;sun.shadow.camera.top=230;sun.shadow.camera.bottom=-230;sun.shadow.bias=-.00015;scene.add(sun);
const fill=new THREE.DirectionalLight(0x8be4dd,1.3);fill.position.set(100,50,100);scene.add(fill);
const mat=(color,rough=.8,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const groundMat=mat(0x68706b), roadMat=mat(0x30383a), sidewalkMat=mat(0x938b7f), trimMat=mat(0xc8b399), windowMat=new THREE.MeshStandardMaterial({color:0x9dcac0,emissive:0x17433f,emissiveIntensity:.55,roughness:.48}), warmWindow=new THREE.MeshStandardMaterial({color:0xf4c184,emissive:0x78441e,emissiveIntensity:.65,roughness:.5});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
const water=new THREE.Mesh(new THREE.PlaneGeometry(1100,1100),new THREE.MeshStandardMaterial({color:0x284d52,roughness:.25,metalness:.18}));water.rotation.x=-Math.PI/2;water.position.y=-.2;water.position.z=470;scene.add(water);
const citySize=396, streetStep=44, streetWidth=11;
// A fine shoulder beneath each boulevard gives the streets a real curb edge.
function box(parent,x,y,z,w,h,d,material,shadow=false){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
for(let v=-176;v<=176;v+=streetStep){box(scene,v,-.015,0,streetWidth+.8,.08,citySize,sidewalkMat);box(scene,0,-.015,v,citySize,.08,streetWidth+.8,sidewalkMat);box(scene,v,.04,0,streetWidth,.1,citySize,roadMat);box(scene,0,.04,v,citySize,.1,streetWidth,roadMat);}
// Dashed lane paint and restrained crosswalks make the street grid legible from the air.
const paintMat=new THREE.MeshBasicMaterial({color:0xd9c8a9,transparent:true,opacity:.57});
for(let v=-176;v<=176;v+=streetStep){for(let z=-194;z<194;z+=10){box(scene,v,.102,z,.12,.012,4.2,paintMat);box(scene,z,.102,v,4.2,.012,.12,paintMat);}}
const buildingMats=[0xb7937e,0x9f8277,0xa69b85,0x828d88,0xc0a78d,0x777e7b,0x9b8b94,0x798a87].map(c=>mat(c,.86));
const buildingColliders=[];
let seed=43;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function building(x,z,w,d,h,idx){const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);const material=buildingMats[idx%buildingMats.length];
  box(group,0,h/2+.1,0,w,h,d,material,true);
  box(group,0,.25,0,w+.45,.42,d+.45,trimMat);
  const roof=mat([0x626e6b,0x7d7770,0x67696a][idx%3]);box(group,0,h+.23,0,w*.83,.2,d*.83,roof);
  // lit window bands on both street-facing sides
  const rows=Math.max(2,Math.floor(h/3.3)), cols=Math.max(2,Math.floor(w/3.1));
  for(let r=0;r<rows;r++){
    const yy=1.15+r*2.7;if(yy>h-.5)break;
    for(let c=0;c<cols;c++){
      if(rand()<.18)continue;const xx=-w/2+1.25+c*(w-2.5)/Math.max(1,cols-1);const wm=rand()<.26?warmWindow:windowMat;
      const win1=new THREE.Mesh(new THREE.PlaneGeometry(.72,.95),wm);win1.position.set(xx,yy,d/2+.006);group.add(win1);
      const win2=new THREE.Mesh(new THREE.PlaneGeometry(.72,.95),wm);win2.position.set(xx,yy,-d/2-.006);win2.rotation.y=Math.PI;group.add(win2);
    }
  }
  // rooftop water tank / signage on selected blocks
  if(idx%4===0){const tank=new THREE.Mesh(new THREE.CylinderGeometry(.8,1,1.7,8),mat(0x626b68,.7,.2));tank.position.set(w*.22,h+1,0);group.add(tank);}
  if(idx%5===1){const sign=box(group,0,h*.66,d/2+.12,w*.54,.5,.18,mat(0xe38a74,.5,.3));sign.material.emissive=new THREE.Color(0x752d2b);sign.material.emissiveIntensity=.9;}
  buildingColliders.push({x,z,w:w*.53,d:d*.53,h});
}
let bi=0;
for(let gx=-4;gx<4;gx++)for(let gz=-4;gz<4;gz++){
 const cx=(gx+.5)*streetStep,cz=(gz+.5)*streetStep;
 const blockW=streetStep-streetWidth-3,blockD=streetStep-streetWidth-3;
 const bw=11+rand()*9,bd=12+rand()*10,bh=9+rand()*39;
 building(cx+(rand()-.5)*5,cz+(rand()-.5)*4,bw,bd,bh,bi++);
 if(rand()>.36){const w2=8+rand()*6,d2=9+rand()*8;building(cx+(rand()>.5?1:-1)*blockW*.31,cz+(rand()-.5)*8,w2,d2,7+rand()*20,bi++);}
}
// Palm silhouettes at the warm waterfront blocks.
const palmMat=mat(0x72594b),leafMat=mat(0x44685d);
function palm(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.25,5,7),palmMat);trunk.position.y=2.5;trunk.rotation.z=-.08;trunk.castShadow=true;g.add(trunk);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=new THREE.Mesh(new THREE.ConeGeometry(.38,3.2,5),leafMat);leaf.position.set(Math.sin(a)*1.1,4.8,Math.cos(a)*1.1);leaf.rotation.z=Math.cos(a)*.95;leaf.rotation.x=Math.sin(a)*.95;leaf.rotation.y=a;g.add(leaf);}}
for(const p of [[-176,130],[-132,130],[-88,130],[-44,130],[0,130],[44,130],[88,130],[132,130],[176,130],[-165,174],[-98,174],[-22,174],[55,174],[126,174]])palm(...p);
// Decorative street lamps, warm points with slender poles.
const lampMat=mat(0x41494a,.65,.25), lampGlow=new THREE.MeshStandardMaterial({color:0xffd09a,emissive:0xff9d55,emissiveIntensity:2});
for(let x=-154;x<=154;x+=44){for(const z of [-165,165]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,5,6),lampMat);pole.position.set(x,2.5,z);scene.add(pole);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),lampGlow);head.position.set(x,5,z);scene.add(head);}}
// Build a detailed low-slung two-door player car.
function makeCar(color=0xd8554d){const root=new THREE.Group();const paint=new THREE.MeshStandardMaterial({color,roughness:.28,metalness:.55});const dark=mat(0x171c1e,.48,.2);const glass=new THREE.MeshStandardMaterial({color:0x4d7778,roughness:.12,metalness:.45,transparent:true,opacity:.84});
 box(root,0,.45,0,2.08,.48,4.35,paint,true);box(root,0,.77,-.28,1.95,.28,3.72,paint,true);
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.58,.74,2.02),paint);cabin.position.set(0,1.12,-.22);cabin.castShadow=true;root.add(cabin);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(1.51,.1,1.63),paint);roof.position.set(0,1.52,-.22);root.add(roof);
 const windshield=new THREE.Mesh(new THREE.BoxGeometry(1.49,.47,.045),glass);windshield.position.set(0,1.16,.83);windshield.rotation.x=-.22;root.add(windshield);
 const rearGlass=new THREE.Mesh(new THREE.BoxGeometry(1.45,.42,.045),glass);rearGlass.position.set(0,1.17,-1.27);rearGlass.rotation.x=.25;root.add(rearGlass);
 for(const x of [-1,1]){for(const z of [-1.4,1.37]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.27,14),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.39,z);wheel.castShadow=true;root.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.285,12),mat(0xabb7b0,.35,.8));hub.rotation.z=Math.PI/2;hub.position.set(x,.39,z);root.add(hub);}}
 const headMat=new THREE.MeshStandardMaterial({color:0xfff0ce,emissive:0xffc66b,emissiveIntensity:2});for(const x of [-.68,.68]){const light=new THREE.Mesh(new THREE.BoxGeometry(.48,.16,.07),headMat);light.position.set(x,.68,2.19);root.add(light);const tail=new THREE.Mesh(new THREE.BoxGeometry(.46,.13,.06),new THREE.MeshStandardMaterial({color:0xff4541,emissive:0xaa0805,emissiveIntensity:1}));tail.position.set(x,.68,-2.19);root.add(tail);}
 const bumper=box(root,0,.39,2.22,1.88,.13,.13,dark);const grille=box(root,0,.52,2.2,.58,.17,.04,dark);root.userData.wheels=[];root.traverse(o=>{if(o.geometry&&o.geometry.type==='CylinderGeometry'&&o.position.y<.5)root.userData.wheels.push(o);});return root;}
const player=makeCar();player.position.set(0,0,0);scene.add(player);
const bots=[];const botColors=[0x4b9b8c,0xdaa75d,0x7796bd,0xce7965,0xa3ada4,0x9d70a0,0xe4c577,0x5395a2];
for(let i=0;i<8;i++){const car=makeCar(botColors[i]);scene.add(car);bots.push({mesh:car,x:-154+rand()*308,z:-154+rand()*308,axis:i%2?'x':'z',dir:i%4<2?1:-1,speed:5+rand()*5,phase:rand()*8});}
// Destination glow: bright marker and a lightly animated vertical beacon.
const target=new THREE.Group();target.position.set(88,.1,88);scene.add(target);
const ringMat=new THREE.MeshBasicMaterial({color:0xff766f,transparent:true,opacity:.85,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.TorusGeometry(4,.13,8,36),ringMat);ring.rotation.x=Math.PI/2;ring.position.y=.2;target.add(ring);
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.7,9,12,1,true),new THREE.MeshBasicMaterial({color:0xff806f,transparent:true,opacity:.18,side:THREE.DoubleSide}));beam.position.y=4.5;target.add(beam);
const beacon=new THREE.Mesh(new THREE.SphereGeometry(.48,12,10),new THREE.MeshBasicMaterial({color:0xffc5a1}));beacon.position.y=8.8;target.add(beacon);
// Distant silhouette buildings fill the horizon behind the playable district.
for(let i=0;i<45;i++){const a=i/45*Math.PI*2,r=280+rand()*30,h=18+rand()*54;const b=new THREE.Mesh(new THREE.BoxGeometry(8+rand()*11,h,8+rand()*12),buildingMats[i%buildingMats.length]);b.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);scene.add(b);}

const state={x:0,z:0,yaw:0,speed:0,cash:8250,complete:false,paused:false,phone:false,job:0};const controls={accelerate:false,brake:false,left:false,right:false,handbrake:false};const keys={KeyW:'accelerate',ArrowUp:'accelerate',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'handbrake'};
const $=s=>document.querySelector(s);const speedEl=$('#speed'),speedLine=$('#speedLine'),distanceEl=$('#distance'),progressEl=$('#progressBar');
function showToast(message){const t=$('#toast');$('#toastText').textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2300);}
function showGeneric(message){const t=$('#genericToast');$('#genericToastText').textContent=message;t.classList.add('show');clearTimeout(showGeneric.timer);showGeneric.timer=setTimeout(()=>t.classList.remove('show'),2200);}
function togglePhone(force){state.phone=force===undefined?!state.phone:force;$('#phone').classList.toggle('open',state.phone);$('#phone').setAttribute('aria-hidden',String(!state.phone));}
function togglePause(force){state.paused=force===undefined?!state.paused:force;$('#pausedOverlay').classList.toggle('show',state.paused);}
$('#phoneToggle').onclick=()=>togglePhone();$('#pauseBtn').onclick=()=>togglePause(true);$('#resumeBtn').onclick=()=>togglePause(false);
$('#soundBtn').onclick=e=>{e.currentTarget.classList.toggle('muted');e.currentTarget.style.opacity=e.currentTarget.classList.contains('muted')?'.48':'1';showGeneric(e.currentTarget.classList.contains('muted')?'Radio muted':'Radio on · VICE CITY FM');};
$('#inviteBtn').onclick=()=>showGeneric('Crew invite sent to your friends');
$('#nextJob').onclick=()=>{$('#jobComplete').classList.remove('show');state.complete=false;state.job++;state.x=0;state.z=0;state.yaw=0;state.speed=0;player.position.set(0,0,0);player.rotation.y=0;target.position.set(state.job%2? -88:.0,.1,state.job%2?88:-88);$('#jobTitle').textContent=state.job%2?'Night Shift':'The Long Way';$('#jobDescription').textContent=state.job%2?'One more run. Take the coast road.':'Keep moving. The next drop is waiting.';$('#jobState').textContent='IN PROGRESS';$('#reward').textContent=state.job%2?'$3,150':'$2,800';showToast('Dispatch sent a new location');};
window.addEventListener('keydown',e=>{if(keys[e.code]){controls[keys[e.code]]=true;e.preventDefault();}if(e.code==='KeyF')togglePhone();if(e.code==='Escape'){if(state.phone)togglePhone(false);else togglePause();}});
window.addEventListener('keyup',e=>{if(keys[e.code])controls[keys[e.code]]=false;});
document.querySelectorAll('[data-control]').forEach(button=>{const key=button.dataset.control;const down=e=>{e.preventDefault();controls[key]=true;button.classList.add('active');button.setPointerCapture?.(e.pointerId);};const up=e=>{e.preventDefault();controls[key]=false;button.classList.remove('active');};button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);});
// Native phone-style app views.
const appContent=$('#appContent'),phoneHome=$('#phoneHome'),phoneAppView=$('#phoneAppView');
function openApp(which){phoneHome.classList.add('hidden');phoneAppView.classList.add('active');let markup='';if(which==='map'){markup='<div class="app-view-title">City map</div><p class="app-view-sub">Your route through the night.</p><canvas class="app-map-canvas" id="phoneMap" width="230" height="220"></canvas><button class="phone-action" id="mapRoute">ROUTE TO THE DROP ↗</button>';}
if(which==='jobs'){markup='<div class="app-view-title">Available work</div><p class="app-view-sub">Make a little money. Keep moving.</p><div class="app-job-card"><small>DELIVERY · 4 MIN</small><b>The Drop</b><p>Package pickup is done. Take it to Ocean Drive, 8th Street.</p><small>REWARD&nbsp; · &nbsp;$2,400</small></div><button class="phone-action" id="acceptJob">TRACK ACTIVE JOB</button>';}
if(which==='crew'){markup='<div class="app-view-title">Your people</div><p class="app-view-sub">Friends nearby in Vice City.</p><div class="app-roster"><span class="avatar ava-coral">M</span><div><b>miasunset</b><small>Driving · 0.2 mi away</small></div></div><div class="app-roster"><span class="avatar ava-teal">J</span><div><b>juno.wav</b><small>On foot · 0.4 mi away</small></div></div><div class="app-roster"><span class="avatar ava-gold">R</span><div><b>Rico_305</b><small>Driving · 0.6 mi away</small></div></div><button class="phone-action" id="crewInvite">INVITE A FRIEND</button>';}
if(which==='camera'){markup='<div class="app-view-title">Snapmatic</div><p class="app-view-sub">A little piece of the night.</p><div class="app-job-card" style="height:165px;display:grid;place-items:center;background:linear-gradient(145deg,#dc967e,#697c77 45%,#253b40)"><span style="font-size:38px">◉</span></div><button class="phone-action" id="takePhoto">TAKE A SNAP</button>';}
appContent.innerHTML=markup;if(which==='map'){const c=$('#phoneMap');drawMap(c);}if($('#mapRoute'))$('#mapRoute').onclick=()=>{togglePhone(false);showToast('Route set · Ocean Drive');};if($('#acceptJob'))$('#acceptJob').onclick=()=>{togglePhone(false);showToast('The Drop is already active');};if($('#crewInvite'))$('#crewInvite').onclick=()=>showGeneric('Crew invite sent');if($('#takePhoto'))$('#takePhoto').onclick=()=>showGeneric('Snap saved to your gallery');}
document.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>openApp(b.dataset.app));$('#backHome').onclick=()=>{phoneAppView.classList.remove('active');phoneHome.classList.remove('hidden');};

function drawMap(c){if(!c)return;const ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#213536';ctx.fillRect(0,0,w,h);
// map coordinate mapping keeps downtown centered and shows the waterfront at the top
const mx=x=>w/2+x/420*w,my=z=>h/2-z/420*h;ctx.strokeStyle='#596767';ctx.lineWidth=7;
for(let q=-176;q<=176;q+=44){ctx.beginPath();ctx.moveTo(mx(q),my(-205));ctx.lineTo(mx(q),my(205));ctx.stroke();ctx.beginPath();ctx.moveTo(mx(-205),my(q));ctx.lineTo(mx(205),my(q));ctx.stroke();}
ctx.strokeStyle='#8c8d7a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,my(145));ctx.lineTo(w,my(145));ctx.stroke();
ctx.setLineDash([4,4]);ctx.strokeStyle='#e7a987';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mx(state.x),my(state.z));ctx.lineTo(mx(state.x),my(target.position.z));ctx.lineTo(mx(target.position.x),my(target.position.z));ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle='#ff8278';ctx.beginPath();ctx.arc(mx(target.position.x),my(target.position.z),5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffd2a9';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mx(target.position.x),my(target.position.z),8,0,Math.PI*2);ctx.stroke();
ctx.save();ctx.translate(mx(state.x),my(state.z));ctx.rotate(-state.yaw);ctx.fillStyle='#a7f2ce';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.restore();
for(const b of bots){ctx.fillStyle='#f0bd73';ctx.beginPath();ctx.arc(mx(b.x),my(b.z),2.3,0,Math.PI*2);ctx.fill();}}
const mini=$('#mapCanvas');
function updateHUD(){const km=Math.round(Math.abs(state.speed)*3.6);speedEl.textContent=String(km).padStart(3,'0');speedLine.style.width=`${Math.min(100,km/180*100)}%`;$('#gear').textContent=state.speed<-.5?'R':'D';const dx=target.position.x-state.x,dz=target.position.z-state.z,dist=Math.hypot(dx,dz);distanceEl.innerHTML=`${Math.max(.1,dist/155).toFixed(1)} <small>MI</small>`;progressEl.style.width=`${Math.min(100,Math.max(0,1-dist/Math.hypot(target.position.x,target.position.z)*100))}%`;$('#pauseCash').textContent='$'+state.cash.toLocaleString();drawMap(mini);if(state.phone&&$('#phoneMap'))drawMap($('#phoneMap'));}
function hitBuilding(x,z){return buildingColliders.some(b=>Math.abs(x-b.x)<b.w&&Math.abs(z-b.z)<b.d);}
const clock=new THREE.Clock();let elapsed=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
if(!state.paused){const accel=controls.accelerate?17:0,braking=controls.brake;state.speed+=accel*dt;if(braking){if(state.speed>1)state.speed-=23*dt;else state.speed-=10*dt;}if(controls.handbrake)state.speed*=Math.max(0,1-3.8*dt);state.speed=THREE.MathUtils.clamp(state.speed,-8,36);if(!controls.accelerate&&!braking)state.speed*=Math.max(0,1-1.05*dt);
const steer=(controls.left?1:0)-(controls.right?1:0);if(Math.abs(state.speed)>.15)state.yaw+=steer*1.65*(.22+Math.min(1,Math.abs(state.speed)/13))*Math.sign(state.speed)*dt;
const nx=state.x+Math.sin(state.yaw)*state.speed*dt,nz=state.z+Math.cos(state.yaw)*state.speed*dt;if(!hitBuilding(nx,nz)){state.x=nx;state.z=nz;}else{state.speed*=-.2;showToast('Careful — watch the buildings');}
state.x=THREE.MathUtils.clamp(state.x,-192,192);state.z=THREE.MathUtils.clamp(state.z,-192,192);
for(const b of bots){b.phase+=dt*b.speed/8;if(b.axis==='x'){b.x+=b.dir*b.speed*dt;if(b.x>186)b.x=-186;if(b.x< -186)b.x=186;b.z=Math.round(b.z/44)*44+Math.sin(b.phase)*.35;b.mesh.position.set(b.x,0,b.z);b.mesh.rotation.y=b.dir>0?Math.PI/2:-Math.PI/2;}else{b.z+=b.dir*b.speed*dt;if(b.z>186)b.z=-186;if(b.z< -186)b.z=186;b.x=Math.round(b.x/44)*44+Math.sin(b.phase)*.35;b.mesh.position.set(b.x,0,b.z);b.mesh.rotation.y=b.dir>0?0:Math.PI;}for(const wheel of b.mesh.userData.wheels)wheel.rotation.x+=dt*b.speed;}
player.position.set(state.x,0,state.z);player.rotation.y=state.yaw;for(const wheel of player.userData.wheels)wheel.rotation.x+=Math.abs(state.speed)*dt;
target.rotation.y+=dt*.35;ring.scale.setScalar(1+Math.sin(elapsed*2.4)*.08);beacon.position.y=8.8+Math.sin(elapsed*2)*.3;
const chase= new THREE.Vector3(state.x-Math.sin(state.yaw)*8,5.1,state.z-Math.cos(state.yaw)*8);camera.position.lerp(chase,1-Math.exp(-4.3*dt));const look=new THREE.Vector3(state.x+Math.sin(state.yaw)*5,1.25,state.z+Math.cos(state.yaw)*5);camera.lookAt(look);
const dist=Math.hypot(state.x-target.position.x,state.z-target.position.z);if(!state.complete&&dist<8){state.complete=true;state.speed=0;state.cash+=2400;$('#jobComplete').classList.add('show');$('#jobState').textContent='DELIVERED';}
if(Math.floor(elapsed)%12===0&&Math.floor(elapsed)!==animate.lastClock){animate.lastClock=Math.floor(elapsed);const mins=(48+Math.floor(elapsed/15))%60,hrs=(9+Math.floor((48+Math.floor(elapsed/15))/60))%12||12;$('#clock').textContent=`${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;}
}
updateHUD();renderer.render(scene,camera);}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
