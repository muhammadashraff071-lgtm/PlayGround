import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#102831');
scene.fog = new THREE.FogExp2('#102831', 0.00155);
const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, .1, 1500);
scene.add(new THREE.HemisphereLight(0xb9e8e4, 0x18251d, 2.05));
const moon = new THREE.DirectionalLight(0xd1e8ff, 2.5); moon.position.set(-180, 260, 100); scene.add(moon);
const fill = new THREE.DirectionalLight(0x5effde, .8); fill.position.set(100, 70, -150); scene.add(fill);
const world = new THREE.Group(); scene.add(world);

const RX = 220, RZ = 152, ROAD = 16, TAU = Math.PI * 2;
const mat = (color, roughness=.8, metalness=0, extra={}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const asphalt = mat('#26363a', .94), grass = mat('#183b34', 1), shoulder = mat('#d7d0bc', .9), lime = mat('#d8ff3f', .38), white = mat('#f4f1df', .72), dark = mat('#111d22', .45), glass = mat('#152d34', .27, .45, { emissive:'#061316', emissiveIntensity:.3 });
const roadPoint = (t, side=0, y=0) => new THREE.Vector3((RX+side)*Math.cos(t), y, (RZ+side)*Math.sin(t));
const tangentAt = t => new THREE.Vector3(-RX*Math.sin(t),0,RZ*Math.cos(t)).normalize();
const normalAt = t => new THREE.Vector3(Math.cos(t),0,Math.sin(t));
function ribbon(inner, outer, material, y=0, steps=420){
  const verts=[], idx=[];
  for(let i=0;i<=steps;i++){const t=i/steps*TAU; const a=roadPoint(t,inner,y),b=roadPoint(t,outer,y);verts.push(a.x,a.y,a.z,b.x,b.y,b.z);}
  for(let i=0;i<steps;i++){let k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;world.add(mesh);return mesh;
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000,2000), grass); ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;world.add(ground);
ribbon(-ROAD/2-2,ROAD/2+2,shoulder,-.04); ribbon(-ROAD/2,ROAD/2,asphalt,0);
ribbon(-ROAD/2, -ROAD/2+.24, lime,.025); ribbon(ROAD/2-.24, ROAD/2, lime,.025);
// Broken center line and red-white kerbs
for(let i=0;i<110;i++){
  const t=i/110*TAU;
  if(i%2===0){const p=roadPoint(t,0,.035), q=roadPoint(t+.027,0,.035); const m=new THREE.Mesh(new THREE.BoxGeometry(.23,.035,p.distanceTo(q)),white);m.position.copy(p).add(q).multiplyScalar(.5);m.rotation.y=-t;world.add(m);}
  for(const s of [-1,1]){const p=roadPoint(t,s*(ROAD/2-.55),.055);const curb=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,.48),i%2?white:mat('#ef573f'));curb.position.copy(p);curb.rotation.y=-t;world.add(curb);}
}
// Start/finish gantry and line
const startAngle=0; const sp=roadPoint(startAngle,0,0);
for(const side of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.8,11,.8),dark);post.position.copy(roadPoint(0,side*12,5.5));world.add(post);const glow=new THREE.PointLight(0x7affda,14,55);glow.position.copy(post.position).add(new THREE.Vector3(0,4,0));world.add(glow);}
const beam=new THREE.Mesh(new THREE.BoxGeometry(27,1.3,1),mat('#101c21',.35,.4));beam.position.set(sp.x,11,sp.z);world.add(beam);
for(let i=0;i<12;i++){const tile=new THREE.Mesh(new THREE.BoxGeometry(2.1,.08,1.05),i%2?dark:white);tile.position.set(sp.x-11+i*2,11.72,sp.z);world.add(tile);}
const sign=new THREE.Mesh(new THREE.BoxGeometry(8,1.8,.35),mat('#d8ff3f',.4,0,{emissive:'#789500',emissiveIntensity:.7}));sign.position.set(sp.x,9.3,sp.z);world.add(sign);

// Coastal nighttime landscape: dunes, sculpted palms, light towers, and distant resort blocks
const trunkMat=mat('#624f37'), leafMat=mat('#286c59'), leafBright=mat('#3d9271'), buildingMats=['#1b303a','#243c43','#30454a','#18313b'].map(c=>mat(c));
function addPalm(x,z,scale=1){const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.55,7,7),trunkMat);trunk.position.y=3.5;trunk.rotation.z=-.08;group.add(trunk);for(let j=0;j<7;j++){const a=j/7*TAU;const frond=new THREE.Mesh(new THREE.ConeGeometry(.42,6.7,5),j%2?leafMat:leafBright);frond.position.set(Math.sin(a)*2,6.9+Math.cos(a)*.5,Math.cos(a)*2);frond.rotation.z=Math.cos(a)*.65;frond.rotation.x=Math.sin(a)*.45;frond.rotation.y=a;frond.scale.y=.35;group.add(frond);}world.add(group);}
function addLamp(t,side){const p=roadPoint(t,side*13,0);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,9,6),dark);pole.position.copy(p).add(new THREE.Vector3(0,4.5,0));world.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(2.6,.18,.2),dark);arm.position.copy(p).add(new THREE.Vector3(side*-1.1,8.7,0));world.add(arm);const bulb=new THREE.PointLight(0x8cf7df,25,36,2);bulb.position.copy(p).add(new THREE.Vector3(side*-2,8.25,0));world.add(bulb);const orb=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),mat('#c5ffdd',.2,0,{emissive:'#9affd6',emissiveIntensity:3}));orb.position.copy(bulb.position);world.add(orb);}
for(let i=0;i<44;i++){const t=i/44*TAU;const a=roadPoint(t,23+Math.random()*14);addPalm(a.x,a.z,.8+Math.random()*.55);if(i%2===0)addLamp(t, i%4===0?-1:1);}
for(let i=0;i<125;i++){const a=Math.random()*TAU, r=270+Math.random()*450;const x=Math.cos(a)*r,z=Math.sin(a)*r;const h=10+Math.random()*35,w=8+Math.random()*22;const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),buildingMats[i%buildingMats.length]);b.position.set(x,h/2-1,z);world.add(b);for(let k=0;k<Math.floor(h/5);k++){const win=new THREE.Mesh(new THREE.BoxGeometry(.25,.55,w*.65),mat(k%3?'#dca95e':'#64c8be',.4,0,{emissive:k%3?'#915d24':'#14655e',emissiveIntensity:.8}));win.position.set(x-w/2-.14,1+k*4,z);world.add(win);}}
// distant mountain silhouettes
for(let i=0;i<32;i++){const a=i/32*TAU,r=520,h=35+Math.random()*90;const hill=new THREE.Mesh(new THREE.ConeGeometry(60+Math.random()*55,h,5),mat(i%2?'#203b3d':'#1a3339'));hill.position.set(Math.cos(a)*r,h/2-4,Math.sin(a)*r);hill.rotation.y=Math.random()*2;world.add(hill);}

// Procedural low-poly racing cars. Local forward is +Z.
function makeCar(color, stripe, player=false){const root=new THREE.Group();const paint=mat(color,.31,.52), stripeM=mat(stripe,.32,.4,{emissive:stripe,emissiveIntensity:.18});
 const body=new THREE.Mesh(new THREE.BoxGeometry(2.22,.72,4.15),paint);body.position.y=.79;root.add(body);
 const nose=new THREE.Mesh(new THREE.BoxGeometry(1.92,.34,1.45),paint);nose.position.set(0,.66,2.38);root.add(nose);
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.48,.78,1.76),glass);cabin.position.set(0,1.43,.15);root.add(cabin);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(1.35,.13,1.35),paint);roof.position.set(0,1.84,.12);root.add(roof);
 const bonnet=new THREE.Mesh(new THREE.BoxGeometry(.23,.045,1.4),stripeM);bonnet.position.set(0,1.16,2.05);root.add(bonnet);
 const spoiler=new THREE.Mesh(new THREE.BoxGeometry(2.15,.16,.34),paint);spoiler.position.set(0,1.5,-2.05);root.add(spoiler);for(const x of [-.8,.8]){const support=new THREE.Mesh(new THREE.BoxGeometry(.12,.48,.12),dark);support.position.set(x,1.27,-1.95);root.add(support);}
 const wheelM=mat('#080d10',.92), hub=mat('#9ca9a2',.3,.8);for(const x of [-1.12,1.12])for(const z of [-1.35,1.35]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.27,12),wheelM);w.rotation.z=Math.PI/2;w.position.set(x,.48,z);root.add(w);const h=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.29,10),hub);h.rotation.z=Math.PI/2;h.position.copy(w.position);root.add(h);}
 for(const x of [-.73,.73]){const light=new THREE.Mesh(new THREE.BoxGeometry(.38,.17,.08),mat('#ff3d57',.2,0,{emissive:'#ff163c',emissiveIntensity:2}));light.position.set(x,.94,-2.1);root.add(light);const head=new THREE.Mesh(new THREE.BoxGeometry(.48,.16,.08),mat('#e9fff0',.18,0,{emissive:'#d9fff1',emissiveIntensity:2.5}));head.position.set(x,.8,3.04);root.add(head);}
 if(player){const under=new THREE.PointLight(0x59fff1,2.8,9);under.position.set(0,.2,0);root.add(under);}
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return root;}
const player=makeCar('#dd4d32','#f3f0e5',true);world.add(player);
const rivals=[{color:'#e4b83a',stripe:'#222d32',t:1.75,lane:-4.2,speed:.00025},{color:'#54a5c8',stripe:'#e8f4e9',t:3.75,lane:4.1,speed:.000235},{color:'#a46bd0',stripe:'#e7d8ff',t:5.25,lane:-3.9,speed:.00022}].map(r=>{r.mesh=makeCar(r.color,r.stripe);world.add(r.mesh);return r;});
function orientCar(mesh,t,lane){const p=roadPoint(t,lane,.05),tan=tangentAt(t);mesh.position.copy(p);mesh.rotation.y=Math.atan2(tan.x,tan.z);}

const keys=new Set(), touch={left:false,right:false,brake:false,accelerate:false,boost:false};let state='menu', elapsed=0, countdown=0, playerT=0, lateral=0, speed=0, boost=100, lap=1, totalAngle=0, lastTime=performance.now(), soundOn=true, raceFinished=false;
const $=s=>document.querySelector(s), menu=$('#menu'), hud=$('#raceHud'), countdownEl=$('#countdown'), toast=$('#toast');
function beginRace(){if(state==='countdown'||state==='race')return;state='countdown';elapsed=0;lap=1;playerT=0;lateral=0;speed=0;boost=100;totalAngle=0;raceFinished=false;for(const [i,r] of rivals.entries()){r.t=[1.75,3.75,5.25][i];r.lane=[-4.2,4.1,-3.9][i];}menu.classList.add('hidden');$('#result').hidden=true;hud.style.opacity='1';countdown=3;showCountdown();}
function showCountdown(){if(state!=='countdown')return;const n=Math.ceil(countdown);countdownEl.textContent=n>0?String(n):'GO!';if(countdown<=0){state='race';toast.textContent='GO!';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),700);setTimeout(()=>countdownEl.textContent='',450);}}
$('#startBtn').addEventListener('click',beginRace);$('#againBtn').addEventListener('click',beginRace);
function finishRace(){if(raceFinished)return;raceFinished=true;state='finished';const rank=place();$('#resultRank').textContent=String(rank).padStart(2,'0');$('#resultTitle').textContent=rank===1?'PODIUM FINISH':rank===2?'SECOND PLACE':'RACE COMPLETE';$('#resultCopy').textContent=rank===1?'The coast belongs to you.':rank===2?'A near-perfect run. Run it back.':'Find the racing line and take another shot.';$('#finalTime').textContent=formatTime(elapsed);$('#result').hidden=false;}
function place(){return 1+rivals.filter(r=>progress(r.t)<totalAngle).length;}
function progress(t){let d=t-playerT;while(d< -Math.PI)d+=TAU;while(d>Math.PI)d-=TAU;return totalAngle-d;}
function formatTime(ms){const s=ms/1000;return `${String(Math.floor(s/60)).padStart(2,'0')}:${(s%60).toFixed(2).padStart(5,'0')}`;}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if((e.key==='Enter'||e.key===' ')&&state==='menu')beginRace();});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
for(const button of document.querySelectorAll('.mobile-controls button')){const name=button.dataset.control;const down=e=>{e.preventDefault();touch[name]=true;button.classList.add('active');button.setPointerCapture?.(e.pointerId)};const up=e=>{e.preventDefault();touch[name]=false;button.classList.remove('active')};button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);}
$('#soundBtn').addEventListener('click',()=>{$('#soundBtn span').textContent=soundOn?'SOUND OFF':'SOUND ON';soundOn=!soundOn;});
function held(...names){return names.some(n=>keys.has(n))}const accel=()=>held('w','arrowup')||touch.accelerate, brake=()=>held('s','arrowdown')||touch.brake, left=()=>held('a','arrowleft')||touch.left, right=()=>held('d','arrowright')||touch.right, nitro=()=>held(' ')||touch.boost;
let camTarget=new THREE.Vector3(), lookTarget=new THREE.Vector3();
function update(dt){const step=Math.min(dt,40);if(state==='countdown'){countdown-=step/1000;if(countdown<0)countdown=0;showCountdown();}
 if(state==='race'){
  elapsed+=step;
  const accelerating=accel()||!brake();const boosting=nitro()&&boost>0&&speed>30;
  const max=boosting?126:92;const target=brake()?0:(accelerating?max:42);
  speed=THREE.MathUtils.damp(speed,target,brake()?4.8:1.2,step/1000);
  if(boosting)boost=Math.max(0,boost-step*.022);else boost=Math.min(100,boost+step*.006);
  const steer=(Number(right())-Number(left()));lateral+=steer*step*.010*(.42+speed/110);lateral=THREE.MathUtils.clamp(lateral,-7.2,7.2);
  if(Math.abs(lateral)>5.9)speed=Math.max(28,speed-step*.022);
  const angularSpeed=(speed/3600000)*TAU*1.72;playerT=(playerT+angularSpeed*step)%TAU;totalAngle+=angularSpeed*step;
  const completed=Math.floor(totalAngle/TAU);lap=Math.min(3,completed+1);if(completed>=3){finishRace();}
  for(const r of rivals){r.t=(r.t+r.speed*step)%TAU;const d=(r.t-playerT+TAU)%TAU;const near=d<.095||d>TAU-.04;if(near&&Math.abs(r.lane-lateral)<2.8){speed=Math.max(25,speed-step*.065);toast.textContent='CONTACT';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),320);}}
 }
 orientCar(player,playerT,lateral);
 for(const r of rivals)orientCar(r.mesh,r.t,r.lane);
 const p=player.position,tan=tangentAt(playerT),back=tan.clone().multiplyScalar(-17);const desired=p.clone().add(back).add(new THREE.Vector3(0,8.6,0));camera.position.lerp(desired,.075);lookTarget.copy(p).add(tan.clone().multiplyScalar(15)).add(new THREE.Vector3(0,1.7,0));camera.lookAt(lookTarget);
 const displaySpeed=Math.round(speed*2.15);$('#speed').textContent=String(displaySpeed).padStart(3,'0');$('#lap').textContent=String(lap).padStart(2,'0');$('#raceTime').textContent=formatTime(elapsed);$('#position').textContent=String(place());$('#boostBar').style.width=`${boost}%`;$('#boostText').textContent=`${Math.round(boost)}%`;$('#rpmBar').style.width=`${Math.min(100,22+speed*.76)}%`;
 const fov=57+(speed/180);camera.fov=THREE.MathUtils.damp(camera.fov,fov,.9,step/1000);camera.updateProjectionMatrix();
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);
playerT=0;orientCar(player,playerT,0);camera.position.set(0,18,-20);camera.lookAt(0,0,0);
function frame(now){const dt=now-lastTime;lastTime=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
