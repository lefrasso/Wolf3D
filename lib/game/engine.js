import * as T from 'three';
import { CELL, WEAPONS } from './levels.js';
import {createGame,update,interact,changeWeapon,targetInteraction,nextLevel,serialize,deserialize,SAVE_KEY,clamp,notify} from './simulation.js';
import {box,cylinder,ball,material,makeEnemy,makeWeapon,makePickup,signTexture} from './models.js';
import {GameAudio} from './audio.js';
import {normalizeLanguage,translate,translateMessage} from './i18n.js';

const DEFAULTS={quality:'high',sensitivity:1,volume:.55,sound:true,music:false,bob:true,fov:78};
export const SETTINGS_KEY='wolf3d-hd:settings:v1';
function disposeTree(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}

export class WolfEngine {
  constructor(canvas,onUpdate,onError,language='es'){
    this.language=normalizeLanguage(language);
    this.canvas=canvas;this.onUpdate=onUpdate;this.onError=onError;this.disposed=false;this.keys=new Set();this.input={forward:0,strafe:0,fire:false};this.audio=new GameAudio();this.settings={...DEFAULTS};
    try{const v=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');this.settings={...DEFAULTS,...v};}catch{}
    this.settings.quality=['low','medium','high'].includes(this.settings.quality)?this.settings.quality:'high';this.settings.fov=clamp(Number(this.settings.fov)||78,60,100);this.settings.volume=clamp(Number(this.settings.volume)||0,0,1);this.settings.sensitivity=clamp(Number(this.settings.sensitivity)||1,.3,2.5);
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.32;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.autoClear=false;
    this.camera=new T.PerspectiveCamera(this.settings.fov,1,.08,150);this.camera.rotation.order='YXZ';
    this.weaponScene=new T.Scene();this.weaponCamera=new T.PerspectiveCamera(60,1,.01,5);this.weaponScene.add(new T.HemisphereLight('#e8eeed','#434329',2.2));const wl=new T.DirectionalLight('#ffc891',3);wl.position.set(-2,4,1);this.weaponScene.add(wl);
    this.weaponRoot=new T.Group();this.weaponRoot.position.set(.14,-.29,-.37);this.weaponScene.add(this.weaponRoot);
    this.hasSave=false;try{this.hasSave=!!deserialize(localStorage.getItem(SAVE_KEY)||'');}catch{}
    this.g=createGame();this.g.status='menu';this.minimap=true;this.mapOpen=false;this.lastStatus='menu';this.lastShot=0;this.recoil=0;this.elapsed=0;this.uiTime=0;this.accumulator=0;this.lastFrame=0;this.fps=60;this.autoSave=0;this.stepClock=0;this.titleMotion=0;
    this.textures={};const loader=new T.TextureLoader();for(const [key,url]of [['wall','/textures/stone-wall.png'],['floor','/textures/stone-floor.png']]){const tex=loader.load(url,()=>this.emit(),undefined,()=>this.onError?.('errors.texture'));tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());this.textures[key]=tex;}
    this.buildWorld();this.setWeapon(1);this.configure(this.settings);this.attach();this.resize();this.emit();this.raf=requestAnimationFrame(t=>this.frame(t));
  }
  buildWorld(){
    if(this.scene){disposeTree(this.scene);this.worldTextures?.forEach(t=>t.dispose());}
    this.worldTextures=[];this.scene=new T.Scene();const l=this.g.level;this.scene.background=new T.Color(l.fog);this.scene.fog=new T.FogExp2(l.fog,.023);
    this.scene.add(new T.HemisphereLight('#c8d4e0','#45423a',1.55));const moon=new T.DirectionalLight('#a9becd',1.3);moon.position.set(8,20,12);this.scene.add(moon);
    const wall=material(l.tint,{map:this.textures.wall,bumpMap:this.textures.wall,bumpScale:.22,roughness:.94});
    const floorTex=this.textures.floor.clone();floorTex.repeat.set(27,27);floorTex.needsUpdate=true;this.worldTextures.push(floorTex);
    const floor=material('#a0a2a0',{map:floorTex,bumpMap:floorTex,bumpScale:.08,roughness:.88});
    const ground=new T.Mesh(new T.PlaneGeometry(81,81),floor);ground.rotation.x=-Math.PI/2;ground.position.set(40.5,0,40.5);ground.receiveShadow=true;this.scene.add(ground);
    const ceiling=new T.Mesh(new T.PlaneGeometry(81,81),material('#3c4240',{map:floorTex,roughness:1}));ceiling.rotation.x=Math.PI/2;ceiling.position.set(40.5,4.55,40.5);this.scene.add(ceiling);
    const cells=[];for(let z=0;z<27;z++)for(let x=0;x<27;x++)if(l.grid[z][x]==='#')cells.push([x,z]);
    const walls=new T.InstancedMesh(new T.BoxGeometry(3,4.6,3),wall,cells.length),trim=new T.InstancedMesh(new T.BoxGeometry(3.08,.2,3.08),material('#626c68',{map:this.textures.wall}),cells.length*2),matrix=new T.Matrix4();
    cells.forEach(([x,z],i)=>{matrix.makeTranslation((x+.5)*3,2.3,(z+.5)*3);walls.setMatrixAt(i,matrix);matrix.makeTranslation((x+.5)*3,.2,(z+.5)*3);trim.setMatrixAt(i*2,matrix);matrix.makeTranslation((x+.5)*3,4.25,(z+.5)*3);trim.setMatrixAt(i*2+1,matrix);});walls.receiveShadow=true;walls.castShadow=true;trim.receiveShadow=true;this.scene.add(walls,trim);
    this.doorMeshes=new Map();const iron=material('#3d4849',{metalness:.72,roughness:.53}),edge=material('#626d69',{metalness:.6,roughness:.4});
    for(const d of l.doors){const group=new T.Group();group.position.set((d.x+.5)*3,0,(d.z+.5)*3);
      if(d.secret){box(group,3,4.6,3,wall,0,2.3,0);const hint=box(group,.035,.42,.48,material('#c1aa75'),d.axis==='x'?-1.51:0,1.7,d.axis==='z'?-1.51:0);if(d.axis==='z')hint.rotation.y=Math.PI/2;}
      else {const panel=box(group,d.axis==='x'?.25:2.78,3.85,d.axis==='x'?2.78:.25,iron,0,1.94,0);
        const stripe=material(d.key==='gold'?'#b69b58':d.key==='silver'?'#a3b6bc':'#696c56',{metalness:.4});
        for(const y of [.35,3.4])box(group,d.axis==='x'?.3:2.8,.15,d.axis==='x'?2.8:.3,stripe,0,y,0);
        for(const s of [-1,1]){box(group,d.axis==='x'?.31:.1,3.4,d.axis==='x'?.1:.31,edge,d.axis==='x'?0:s*1.1,1.9,d.axis==='x'?s*1.1:0);}
        const jamb=new T.Group();jamb.position.copy(group.position);box(jamb,d.axis==='x'?.5:3.2,.55,d.axis==='x'?3.2:.5,edge,0,4.1,0);this.scene.add(jamb);
      }this.scene.add(group);this.doorMeshes.set(d.id,group);}
    // Warm pools of light lead from the starting chamber into the route.
    this.torches=[];const amber=material('#ffa54e',{emissive:'#ff922e',emissiveIntensity:2.7});
    for(const [x,z,dir] of [[2.08,4.5,0],[10.92,4.5,Math.PI],[2.08,9,0],[10.92,9,Math.PI],[16,2.08,-Math.PI/2],[23,2.08,-Math.PI/2],[24.92,8.5,Math.PI],[18,10.92,Math.PI/2],[16,15.08,-Math.PI/2],[23,15.08,-Math.PI/2],[24.92,22,Math.PI],[15.08,22,0],[2.08,17,0],[10.92,17,Math.PI],[2.08,23,0],[10.92,23,Math.PI]]){
      const lamp=new T.Group();lamp.position.set(x*3,2.7,z*3);lamp.rotation.y=dir;
      box(lamp,.12,.7,.25,iron);box(lamp,.55,.09,.14,iron,.25,-.18,0);const flame=cylinder(lamp,.05,.14,.43,amber,.48,.13,0,7);cylinder(lamp,.2,.13,.25,edge,.48,-.2,0);this.scene.add(lamp);
      const pos=new T.Vector3(x*3+Math.cos(dir)*.85,3,z*3-Math.sin(dir)*.85);this.torches.push({pos,flame});
    }
    this.lights=Array.from({length:8},()=>{const light=new T.PointLight('#ffc27b',28,15,1.8);this.scene.add(light);return light;});
    this.playerLight=new T.PointLight('#e7f3df',6,10,1.6);this.scene.add(this.playerLight);
    this.flashlight=new T.SpotLight('#f5e8bd',32,24,.9,.65,1.8);this.flashlight.shadow.mapSize.set(1024,1024);this.flashlight.shadow.bias=-.002;this.scene.add(this.flashlight,this.flashlight.target);
    this.enemyMeshes=new Map();l.enemies.forEach(e=>{const m=makeEnemy(e.type);m.position.set(e.x*3,0,e.z*3);this.scene.add(m);this.enemyMeshes.set(e.id,m);});
    this.pickups=new Map();l.items.forEach(i=>this.addPickup(i));
    // Original wall banners and architectural beams support the fortress theme.
    const bannerMat=material(l.index===1?'#424b39':'#713f35',{side:T.DoubleSide,roughness:1});
    for(const z of [7.5,18]){const banner=box(this.scene,.06,2.1,1.2,bannerMat,2.025*3,2.95,z*3);box(this.scene,.1,.09,1.55,edge,2.03*3,4.04,z*3);box(this.scene,.075,.46,.1,material('#c5b18b'),2.05*3,2.85,z*3);}
    const beam=material('#3b3430',{roughness:.9});for(const z of [3,6,9])box(this.scene,27,.33,.32,beam,19.5,4.34,z*3);
    const exit=new T.Group();exit.position.set(l.exit.x*3,0,l.exit.z*3);box(exit,1.8,.14,1.8,iron,0,.1,0);box(exit,1.6,2.8,.15,iron,0,1.5,-.7);
    const sig=signTexture(this.t(l.index===2?'sign.exit':'sign.elevator'),this.t(l.index===2?'app.operation':'sign.keys'));this.worldTextures.push(sig);this.exitSign=box(exit,1.5,.75,.02,new T.MeshStandardMaterial({map:sig,emissiveMap:sig,emissive:'#adcb81',emissiveIntensity:.8}),0,2.65,-.6);box(exit,.3,.5,.15,edge,.6,1.2,-.5);ball(exit,.06,material('#d9ff74',{emissive:'#a0d455',emissiveIntensity:2}),.6,1.25,-.4);this.scene.add(exit);
    // Subtle suspended dust, one draw call.
    const positions=new Float32Array(450);for(let i=0;i<450;i+=3){positions[i]=6+(i*7.13%69);positions[i+1]=.5+(i*1.27%3.4);positions[i+2]=6+(i*5.33%69);}const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(positions,3));this.dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#d7ceae',size:.035,transparent:true,opacity:.24,depthWrite:false}));this.scene.add(this.dust);
    this.lastShot=this.g.shotSerial;this.recoil=0;
  }
  t(key,params){return translate(this.language,key,params);}
  setLanguage(language){
    this.language=normalizeLanguage(language);
    // Refresh only lettering, preserving the current world and simulation state.
    if(this.exitSign){const mat=this.exitSign.material,old=mat.map;const last=this.g.level.index===2;
      const texture=signTexture(this.t(last?'sign.exit':'sign.elevator'),this.t(last?'app.operation':'sign.keys'));
      mat.map=mat.emissiveMap=texture;mat.needsUpdate=true;
      const i=this.worldTextures.indexOf(old);if(i>=0)this.worldTextures[i]=texture;else this.worldTextures.push(texture);old?.dispose();
    }
    this.emit();
  }
  addPickup(item){const mesh=makePickup(item.type);mesh.position.set(item.x*3,.65,item.z*3);mesh.visible=!item.taken;this.scene.add(mesh);this.pickups.set(item.id,mesh);}
  setWeapon(id){if(this.weapon){disposeTree(this.weapon);this.weaponRoot.remove(this.weapon);}this.weapon=makeWeapon(id);this.weaponRoot.add(this.weapon);this.weaponId=id;}
  configure(partial){Object.assign(this.settings,partial);this.audio.set(this.settings.volume,this.settings.sound);this.audio.music=this.settings.music;this.camera.fov=this.settings.fov;this.camera.updateProjectionMatrix();this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.settings.quality==='high'?1.6:this.settings.quality==='medium'?1.15:.8));this.renderer.shadowMap.enabled=this.settings.quality==='high';if(this.flashlight)this.flashlight.castShadow=this.settings.quality==='high';try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}this.resize();this.emit();}
  attach(){
    this.listeners=[];const on=(el,event,fn,opts)=>{el.addEventListener(event,fn,opts);this.listeners.push(()=>el.removeEventListener(event,fn,opts));};
    on(window,'resize',()=>this.resize());
    on(window,'keydown',e=>{
      if(e.code==='Escape'&&this.g.status==='playing'){e.preventDefault();this.pause();return;}
      if(this.g.status!=='playing')return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE','KeyM','Tab','KeyP','F5','F9'].includes(e.code))e.preventDefault();
      this.keys.add(e.code);if(e.repeat)return;if(e.code==='KeyE'||e.code==='Space')interact(this.g);if(e.code.startsWith('Digit'))changeWeapon(this.g,Number(e.code.slice(-1))-1);if(e.code==='KeyP')this.pause();if(e.code==='KeyM'||e.code==='Tab'){this.mapOpen=!this.mapOpen;this.emit();}if(e.code==='F5')this.save(true);if(e.code==='F9')this.continue();
    });
    on(window,'keyup',e=>this.keys.delete(e.code));
    on(document,'mousemove',e=>{if(this.g.status==='playing'&&(document.pointerLockElement===this.canvas||this.dragging))this.look(e.movementX);});
    on(this.canvas,'mousedown',e=>{if(this.g.status!=='playing')return;if(e.button===0){this.input.fire=true;this.lock();}if(e.button===2)this.dragging=true;});
    on(window,'mouseup',e=>{if(e.button===0)this.input.fire=false;if(e.button===2)this.dragging=false;});
    on(this.canvas,'contextmenu',e=>e.preventDefault());
    on(this.canvas,'wheel',e=>{if(this.g.status!=='playing')return;e.preventDefault();const a=this.g.player.owned,i=a.indexOf(this.g.player.weapon);changeWeapon(this.g,a[(i+(e.deltaY>0?1:-1)+a.length)%a.length]);},{passive:false});
    on(document,'pointerlockchange',()=>{const locked=document.pointerLockElement===this.canvas;if(this.wasLocked&&!locked&&this.g.status==='playing')this.pause(false);this.wasLocked=locked;this.emit();});
    on(window,'blur',()=>{if(this.g.status==='playing')this.pause();});on(document,'visibilitychange',()=>{if(document.hidden&&this.g.status==='playing')this.pause();});
    on(this.canvas,'webglcontextlost',e=>{e.preventDefault();this.pause();this.onError('errors.context');});
  }
  look(dx){this.g.player.yaw-=dx*.0021*this.settings.sensitivity;}
  lock(){if(matchMedia('(pointer: coarse)').matches)return;try{const p=this.canvas.requestPointerLock?.();p?.catch(()=>{if(this.g.status==='playing')notify(this.g,'message.mouseFallback');});}catch{notify(this.g,'message.mouseFallback');}}
  clearInput(){this.keys.clear();this.input={forward:0,strafe:0,fire:false};this.dragging=false;}
  async unlockAudio(){await this.audio.unlock();}
  start(difficulty='normal'){this.g=createGame(difficulty);this.clearInput();this.buildWorld();this.configure(this.settings);this.mapOpen=false;this.autoSave=0;this.save();this.unlockAudio();this.lock();this.emit();}
  continue(){let saved;try{saved=deserialize(localStorage.getItem(SAVE_KEY)||'');}catch{}if(!saved){notify(this.g,'message.noSave');this.emit();return false;}this.g=saved;this.buildWorld();this.clearInput();this.configure(this.settings);this.unlockAudio();this.lock();this.emit();return true;}
  pause(unlock=true){if(this.g.status!=='playing')return;this.g.status='paused';this.clearInput();if(unlock&&document.pointerLockElement)document.exitPointerLock();this.emit();}
  resume(){if(this.g.status!=='paused')return;this.g.status='playing';this.clearInput();this.unlockAudio();this.lock();this.emit();}
  menu(){if(this.g.status==='playing'||this.g.status==='paused')this.save();this.g.status='menu';this.clearInput();if(document.pointerLockElement)document.exitPointerLock();this.emit();}
  retry(){const totals={...this.g.totals};const p=this.g.player;if(p.lives<=1){this.start(this.g.difficulty);return;}this.g=createGame(this.g.difficulty,this.g.level.index,{lives:p.lives-1,score:Math.max(0,p.score-500)});this.g.totals=totals;this.buildWorld();this.configure(this.settings);this.clearInput();this.save();this.unlockAudio();this.lock();this.emit();}
  next(){this.g=nextLevel(this.g);if(this.g.status==='playing'){this.buildWorld();this.configure(this.settings);this.save();this.clearInput();this.unlockAudio();this.lock();}else{try{localStorage.removeItem(SAVE_KEY);this.hasSave=false;}catch{}}this.emit();}
  save(show=false){if(!['playing','paused'].includes(this.g.status))return false;try{localStorage.setItem(SAVE_KEY,serialize(this.g));this.hasSave=true;if(show)notify(this.g,'message.saved');this.emit();return true;}catch{notify(this.g,'message.saveFailed');this.emit();return false;}}
  use(){interact(this.g);this.emit();}
  resize(){const w=this.canvas.clientWidth||window.innerWidth,h=this.canvas.clientHeight||window.innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.weaponCamera.aspect=w/h;this.weaponCamera.updateProjectionMatrix();}
  emit(){if(this.disposed)return;const hasSave=this.hasSave;const g=this.g;this.onUpdate({status:g.status,player:{...g.player,owned:[...g.player.owned]},level:{index:g.level.index,name:this.t(`level.${g.level.index}.name`),label:this.t(`level.${g.level.index}.label`),location:this.t(`level.${g.level.index}.location`),briefing:this.t(`level.${g.level.index}.briefing`),kills:g.level.kills,secrets:g.level.secrets,treasures:g.level.treasures,time:g.level.time,totalEnemies:g.level.enemies.length,totalTreasures:g.level.items.filter(i=>i.type==='treasure').length},totals:{...g.totals},message:g.messageTime>0?translateMessage(this.language,g.message):'',target:this.t(targetInteraction(g)?.text),fps:Math.round(this.fps),settings:{...this.settings},hasSave,mapOpen:this.mapOpen,locked:document.pointerLockElement===this.canvas,hitSerial:g.hitSerial,damageSerial:g.damageSerial,shotSerial:g.shotSerial,difficulty:g.difficulty,boss:g.level.enemies.find(e=>e.type==='commander'&&e.hp>0&&e.alert>0)?.hp||0});}
  frame(ms){
    if(this.disposed)return;const dt=Math.min(.1,(ms-(this.lastFrame||ms))/1000);this.lastFrame=ms;this.elapsed+=dt;this.uiTime+=dt;this.fps=this.fps*.95+(dt>0?1/dt:60)*.05;
    const playing=this.g.status==='playing';if(playing){this.accumulator+=dt;const input={forward:(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+this.input.forward,strafe:(this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0)+this.input.strafe,turn:(this.keys.has('ArrowLeft')?1:0)-(this.keys.has('ArrowRight')?1:0),run:this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'),fire:this.input.fire||this.keys.has('ControlLeft')||this.keys.has('ControlRight')};
      let steps=0;while(this.accumulator>=1/60&&steps++<6){update(this.g,1/60,input);this.accumulator-=1/60;}
      if((input.forward||input.strafe)&&this.elapsed-this.stepClock>(input.run?.3:.44)){this.audio.step();this.stepClock=this.elapsed;}
      this.autoSave+=dt;if(this.autoSave>15){this.autoSave=0;this.save();}this.audio.ambience(this.elapsed);
    }else this.accumulator=0;
    for(const e of this.g.events)this.audio.play(e);this.g.events=[];
    if(this.g.status!==this.lastStatus){this.lastStatus=this.g.status;if(['dead','complete','victory'].includes(this.g.status)){this.clearInput();if(document.pointerLockElement)document.exitPointerLock();}this.emit();}
    this.render(dt);if(this.uiTime>.1){this.uiTime=0;this.emit();}this.raf=requestAnimationFrame(t=>this.frame(t));
  }
  render(dt){
    const g=this.g,p=g.player,menu=g.status==='menu';if(menu){this.titleMotion+=dt;this.camera.position.set(9.6,1.95,10.5);this.camera.rotation.set(-.035,-1.92+Math.sin(this.titleMotion*.12)*.13,0);}else{const moving=this.keys.has('KeyW')||this.keys.has('KeyS')||this.keys.has('KeyA')||this.keys.has('KeyD')||this.input.forward||this.input.strafe;const bob=this.settings.bob&&moving&&g.status==='playing'?Math.sin(this.elapsed*10)*.033:0;this.camera.position.set(p.x*CELL,1.78+bob,p.z*CELL);this.camera.rotation.set(0,p.yaw,0);}
    const c=this.camera.position;this.playerLight.position.set(c.x,c.y+.25,c.z);this.flashlight.position.copy(c);const forward=new T.Vector3();this.camera.getWorldDirection(forward);this.flashlight.target.position.copy(c).addScaledVector(forward,12);
    const nearby=[...this.torches].sort((a,b)=>a.pos.distanceToSquared(c)-b.pos.distanceToSquared(c));this.lights.forEach((light,i)=>{const t=nearby[i];light.position.copy(t.pos);light.intensity=(this.settings.quality==='low'?21:28)*(1+Math.sin(this.elapsed*8+i*12)*.05);});this.torches.forEach((t,i)=>t.flame.scale.y=1+Math.sin(this.elapsed*11+i)*.1);
    for(const d of g.level.doors){const m=this.doorMeshes.get(d.id);m.position.set((d.x+.5)*CELL,0,(d.z+.5)*CELL);if(d.axis==='x')m.position.z+=d.open*2.9;else m.position.x+=d.open*2.9;}
    for(const e of g.level.enemies){const m=this.enemyMeshes.get(e.id);m.position.set(e.x*CELL,e.hp<=0?.15:0,e.z*CELL);m.rotation.y=e.yaw;if(e.hp<=0){m.rotation.x=T.MathUtils.lerp(m.rotation.x,Math.PI/2,.12);m.userData.flash.visible=false;}else{m.userData.legs.forEach((leg,i)=>leg.rotation.x=e.state==='chase'?Math.sin(e.walk+i*Math.PI)*.4:0);m.userData.flash.visible=e.flash>0;m.userData.body.material.emissive.setHex(e.stun>0?0x572315:0x000000);}}
    for(const item of g.level.items){if(!this.pickups.has(item.id))this.addPickup(item);const m=this.pickups.get(item.id);m.visible=!item.taken;if(!item.taken){m.position.y=.7+Math.sin(this.elapsed*2+item.id)*.09;m.rotation.y=this.elapsed*.7;}}
    if(this.weaponId!==p.weapon)this.setWeapon(p.weapon);if(g.shotSerial!==this.lastShot){this.lastShot=g.shotSerial;this.recoil=1;}this.recoil=Math.max(0,this.recoil-dt*9);this.weapon.position.set(0,-this.recoil*.01,this.recoil*.065);this.weapon.rotation.x=this.recoil*.13;this.weapon.rotation.z=p.weapon===0?-this.recoil*.65:0;this.weapon.userData.flash.visible=this.recoil>.45&&p.weapon!==0;
    this.weaponRoot.position.x=.14+(this.settings.bob?Math.sin(this.elapsed*2.5)*.004:0);this.weaponRoot.position.y=-.29+(this.settings.bob?Math.sin(this.elapsed*5)*.004:0);this.playerLight.intensity=this.recoil>.6?19:6;
    this.dust.position.y=Math.sin(this.elapsed*.2)*.1;this.renderer.clear();this.renderer.render(this.scene,this.camera);if(!menu){this.renderer.clearDepth();this.renderer.render(this.weaponScene,this.weaponCamera);}
  }
  drawMap(canvas,full=false){const ctx=canvas?.getContext('2d');if(!ctx)return;const l=this.g.level,p=this.g.player,n=canvas.width,scale=n/27;ctx.clearRect(0,0,n,n);ctx.fillStyle='rgba(14,20,17,.93)';ctx.fillRect(0,0,n,n);const known=new Set(l.discovered);
    for(const code of known){const x=code%27,z=Math.floor(code/27);ctx.fillStyle=l.grid[z]?.[x]==='#'?'#546057':'#202f29';ctx.fillRect(x*scale,z*scale,scale+.5,scale+.5);}
    for(const d of l.doors)if(known.has(d.z*27+d.x)&&(!d.secret||d.found)){ctx.fillStyle=d.key==='gold'?'#d4b36c':d.key==='silver'?'#a0bfd1':'#91a880';ctx.globalAlpha=d.open>.8?.35:1;ctx.fillRect(d.x*scale+1,d.z*scale+1,scale-2,scale-2);}ctx.globalAlpha=1;
    if(full)for(const item of l.items)if(!item.taken&&known.has(Math.floor(item.z)*27+Math.floor(item.x))){ctx.fillStyle=item.type==='gold'?'#edc350':item.type==='silver'?'#bfdbea':'#839973';ctx.fillRect(item.x*scale-1.5,item.z*scale-1.5,3,3);}
    if(known.has(Math.floor(l.exit.z)*27+Math.floor(l.exit.x))){ctx.fillStyle='#d9ff74';ctx.fillRect((l.exit.x-.3)*scale,(l.exit.z-.3)*scale,.6*scale,.6*scale);}
    ctx.save();ctx.translate(p.x*scale,p.z*scale);ctx.rotate(-p.yaw);ctx.fillStyle='#d9ff74';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-4,4);ctx.lineTo(0,2);ctx.lineTo(4,4);ctx.closePath();ctx.fill();ctx.restore();
  }
  dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.listeners.forEach(fn=>fn());if(document.pointerLockElement===this.canvas)document.exitPointerLock();disposeTree(this.scene);disposeTree(this.weaponScene);this.worldTextures.forEach(t=>t.dispose());Object.values(this.textures).forEach(t=>t.dispose());this.audio.dispose();this.renderer.dispose();}
}
