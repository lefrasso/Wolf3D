import {makeLevel,WEAPONS,DIFFICULTIES,LEVELS} from './levels.js';
export const SAVE_KEY='wolf3d-hd:save:v1';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

export function createGame(difficulty='normal',level=0,carry=null) {
  return {version:1,status:'playing',difficulty,level:makeLevel(level),player:{...makeLevel(level).spawn,hp:100,ammo:40,weapon:1,owned:[0,1],gold:false,silver:false,lives:3,score:0,...carry},shotCooldown:0,shotSerial:0,hitSerial:0,damageSerial:0,message:'',messageTime:0,events:[],totals:{kills:0,treasures:0,secrets:0,time:0}};
}
export function notify(g,key,type='info',params={}) {const message=key&&typeof key==='object'?key:{key,params};g.message=message;g.messageTime=3;g.events.push({type,message});}
export function doorAt(l,x,z){return l.doors.find(d=>d.x===x&&d.z===z);}
export function isSolid(l,x,z){const ix=Math.floor(x),iz=Math.floor(z);const c=l.grid[iz]?.[ix];if(!c||c==='#')return true;if(c==='D'||c==='S')return (doorAt(l,ix,iz)?.open??0)<.88;return false;}
export function canStand(l,x,z,r=.19){return ![[x-r,z-r],[x+r,z-r],[x-r,z+r],[x+r,z+r],[x-r,z],[x+r,z],[x,z-r],[x,z+r]].some(([a,b])=>isSolid(l,a,b));}
export function move(l,p,dx,dz,r=.19,actors=[]){const free=(x,z)=>canStand(l,x,z,r)&&!actors.some(a=>a!==p&&a.hp>0&&Math.hypot(a.x-x,a.z-z)<r+.19);if(free(p.x+dx,p.z))p.x+=dx;if(free(p.x,p.z+dz))p.z+=dz;}
export function clearLine(l,x,z,tx,tz){const d=Math.hypot(tx-x,tz-z),steps=Math.max(1,Math.ceil(d/.1));for(let i=1;i<=steps;i++)if(isSolid(l,x+(tx-x)*i/steps,z+(tz-z)*i/steps))return false;return true;}

// Breadth-first search: small fixed grid, dynamic door topology, deterministic result.
export function findPath(l,sx,sz,tx,tz) {
  sx=Math.floor(sx);sz=Math.floor(sz);tx=Math.floor(tx);tz=Math.floor(tz);
  const queue=[[sx,sz]],seen=new Set([`${sx},${sz}`]),prev=new Map();let end=null;
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i];if(x===tx&&z===tz){end=[x,z];break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;if(!seen.has(key)&&!isSolid(l,nx+.5,nz+.5)){seen.add(key);prev.set(key,[x,z]);queue.push([nx,nz]);}}}
  if(!end)return [];const path=[];while(end[0]!==sx||end[1]!==sz){path.unshift({x:end[0]+.5,z:end[1]+.5});end=prev.get(end.join(','));if(!end)break;}return path;
}

export function targetInteraction(g){
  const {player:p,level:l}=g,fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
  const ds=l.doors.filter(d=>Math.hypot(d.x+.5-p.x,d.z+.5-p.z)<1.65&&((d.x+.5-p.x)*fx+(d.z+.5-p.z)*fz)>.15).sort((a,b)=>Math.hypot(a.x+.5-p.x,a.z+.5-p.z)-Math.hypot(b.x+.5-p.x,b.z+.5-p.z));
  if(ds.length){const d=ds[0];return {type:'door',door:d,text:d.secret&&!d.found?'interaction.inspect':d.key&&!p[d.key]?`interaction.${d.key}Required`:d.target?'interaction.closeDoor':'interaction.openDoor'};}
  if(Math.hypot(p.x-l.exit.x,p.z-l.exit.z)<1.45)return {type:'exit',text:l.index===2?'interaction.exit':'interaction.elevator'};
  return null;
}
export function interact(g){
  if(g.status!=='playing')return;const t=targetInteraction(g);if(!t)return;
  if(t.type==='exit'){
    if(!g.player.gold||!g.player.silver){notify(g,'message.bothKeys');return;}
    if(g.level.enemies.some(e=>e.type==='commander'&&e.hp>0)){notify(g,'message.bossAlive');return;}
    g.status='complete';g.player.score+=1000;g.events.push({type:'complete'});return;
  }
  const d=t.door;if(d.key&&!g.player[d.key]){notify(g,t.text,'locked');return;}
  if(d.secret){if(!d.found){d.found=true;g.level.secrets++;g.player.score+=500;notify(g,'message.secret','secret');}d.target=1;}
  else {d.target=d.target?0:1;g.events.push({type:'door'});}
}

export function shoot(g,random=Math.random){
  if(g.status!=='playing'||g.shotCooldown>0)return false;
  const p=g.player,w=WEAPONS[p.weapon];if(w.ammo&&p.ammo===0){g.shotCooldown=.4;notify(g,'message.noAmmo','empty');return false;}
  p.ammo-=w.ammo;g.shotCooldown=w.rate;g.shotSerial++;g.events.push({type:'shot',weapon:p.weapon});
  let hit=null,nearest=w.range;
  for(const e of g.level.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-p.x,e.z-p.z);if(d<(w.ammo?7:2)&&clearLine(g.level,p.x,p.z,e.x,e.z))e.alert=12;
    const a=Math.atan2(-(e.x-p.x),-(e.z-p.z));const width=e.type==='commander'?.29:.2;
    if(d<nearest&&Math.abs(angleDiff(a,p.yaw))<Math.atan2(width,d)+.028&&clearLine(g.level,p.x,p.z,e.x,e.z)){nearest=d;hit=e;}}
  if(hit){hit.hp-=w.damage*(.94+random()*.12);hit.alert=15;hit.stun=.17;g.hitSerial++;g.events.push({type:'hit'});
    if(hit.hp<=0){hit.hp=0;hit.state='dead';g.level.kills++;p.score+=hit.type==='commander'?2000:hit.type==='officer'?250:100;g.events.push({type:'kill'});g.level.items.push({id:1000+hit.id,type:'ammo',x:hit.x,z:hit.z,value:8,taken:false});}}
  return true;
}
export function changeWeapon(g,n){if(g.player.owned.includes(n)){g.player.weapon=n;g.shotCooldown=Math.max(.15,g.shotCooldown);}}
export function collect(g,item){
  const p=g.player;if(item.taken)return false;
  if(item.type==='health'){if(p.hp>=100)return false;p.hp=Math.min(100,p.hp+35);}
  else if(item.type==='ammo'){if(p.ammo>=199)return false;p.ammo=Math.min(199,p.ammo+(item.value||20));}
  else if(item.type==='gold'||item.type==='silver')p[item.type]=true;
  else if(item.type==='treasure'){p.score+=item.value||100;g.level.treasures++;}
  else {const n=item.type==='machinegun'?2:3;if(!p.owned.includes(n)){p.owned.push(n);p.weapon=n;}p.ammo=Math.min(199,p.ammo+30);}
  item.taken=true;notify(g,`pickup.${item.type}`,'pickup',{amount:item.value||100});return true;
}

export function update(g,dt,input={},random=Math.random){
  if(g.status!=='playing')return;dt=clamp(dt,0,.05);const p=g.player,l=g.level,diff=DIFFICULTIES[g.difficulty]||DIFFICULTIES.normal;
  l.time+=dt;g.shotCooldown=Math.max(0,g.shotCooldown-dt);g.messageTime=Math.max(0,g.messageTime-dt);
  p.yaw+=(input.turn||0)*dt*2;let f=input.forward||0,s=input.strafe||0,n=Math.max(1,Math.hypot(f,s));f/=n;s/=n;
  const speed=(input.run?2.65:1.75)*dt;
  move(l,p,(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*s)*speed,(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*s)*speed,.19,l.enemies);
  if(input.fire)shoot(g,random);
  for(const d of l.doors){if(d.target<d.open&&(Math.hypot(p.x-d.x-.5,p.z-d.z-.5)<.95||l.enemies.some(e=>e.hp>0&&Math.hypot(e.x-d.x-.5,e.z-d.z-.5)<.95)))d.target=1;d.open=clamp(d.open+Math.sign(d.target-d.open)*dt*.95,0,1);if(Math.abs(d.open-d.target)<.05)d.open=d.target;}
  for(const item of l.items)if(!item.taken&&Math.hypot(p.x-item.x,p.z-item.z)<.58)collect(g,item);
  for(const e of l.enemies){
    if(e.hp<=0)continue;e.cooldown-=dt;e.stun=Math.max(0,(e.stun||0)-dt);if(e.stun>0)continue;
    const dist=Math.hypot(p.x-e.x,p.z-e.z),los=dist<10&&clearLine(l,e.x,e.z,p.x,p.z);
    if(los)e.alert=14;else e.alert=Math.max(0,e.alert-dt);
    if(e.alert<=0){e.state='idle';continue;}e.yaw=Math.atan2(p.x-e.x,p.z-e.z);
    if(los&&dist<5.5){e.state='attack';if(e.cooldown<=0){e.cooldown=e.type==='commander'?.4:e.type==='officer'?.9:1.5;e.flash=.1;g.events.push({type:'enemyShot',distance:dist});if(random()<diff.accuracy*(1-dist*.055)){p.hp=Math.max(0,p.hp-Math.round((e.type==='commander'?11:9)*diff.damage));g.damageSerial++;g.events.push({type:'damage'});if(p.hp<=0){g.status='dead';g.events.push({type:'dead'});return;}}}}
    else {e.state='chase';e.repath-=dt;if(e.repath<=0){e.path=findPath(l,e.x,e.z,p.x,p.z);e.repath=.65;}
      const dest=e.path[0];if(dest){const dx=dest.x-e.x,dz=dest.z-e.z,d=Math.hypot(dx,dz);if(d<.12)e.path.shift();else {const v=(e.type==='officer'?1.1:.78)*diff.speed*dt;move(l,e,dx/d*v,dz/d*v,.2,[p,...l.enemies]);e.walk+=dt*8;}}}
    e.flash=Math.max(0,(e.flash||0)-dt);
  }
  // Reveal only visible nearby cells, leaving unexplored rooms hidden.
  const known=new Set(l.discovered);for(let z=Math.floor(p.z)-4;z<=Math.floor(p.z)+4;z++)for(let x=Math.floor(p.x)-4;x<=Math.floor(p.x)+4;x++)if(l.grid[z]?.[x]&&Math.hypot(x+.5-p.x,z+.5-p.z)<4.8){const dx=x+.5-p.x,dz=z+.5-p.z,len=Math.hypot(dx,dz)||1;if(clearLine(l,p.x,p.z,x+.5-dx/len*.55,z+.5-dz/len*.55))known.add(z*27+x);}
  l.discovered=Array.from(known);
}

export function nextLevel(g){const i=g.level.index+1;if(i>=LEVELS.length){g.status='victory';return g;}const n=createGame(g.difficulty,i,{hp:Math.max(60,g.player.hp),ammo:Math.max(30,g.player.ammo),weapon:g.player.weapon,owned:[...g.player.owned],score:g.player.score,lives:g.player.lives});n.totals={kills:g.totals.kills+g.level.kills,secrets:g.totals.secrets+g.level.secrets,treasures:g.totals.treasures+g.level.treasures,time:g.totals.time+g.level.time};return n;}
export function serialize(g){return JSON.stringify({...g,status:'playing',events:[],shotCooldown:0});}
export function deserialize(raw){
  try {const g=JSON.parse(raw);if(g.version!==1||!DIFFICULTIES[g.difficulty]||!Number.isInteger(g.level?.index)||g.level.index<0||g.level.index>=LEVELS.length)return null;
    const p=g.player;if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!Number.isFinite(p.yaw)||p.hp<=0||p.hp>100||!Array.isArray(p.owned)||!p.owned.includes(p.weapon)||p.owned.some(n=>!WEAPONS[n])||!Number.isFinite(p.ammo)||p.ammo<0||p.ammo>199||!Number.isFinite(p.score)||!Number.isFinite(p.lives)||p.lives<1||p.lives>3)return null;
    // A save contains only dynamic state; never trust a persisted world layout.
    const base=makeLevel(g.level.index),saved=g.level;
    for(const key of ['doors','enemies','items','discovered'])if(!Array.isArray(saved[key]))return null;
    if(saved.doors.length!==base.doors.length||saved.enemies.length!==base.enemies.length)return null;
    base.doors=base.doors.map((d,i)=>({...d,open:clamp(Number(saved.doors[i].open)||0,0,1),target:saved.doors[i].target?1:0,found:!!saved.doors[i].found}));
    base.enemies=base.enemies.map((e,i)=>{const q=saved.enemies[i];return {...e,x:Number.isFinite(q.x)&&q.x>0&&q.x<27?q.x:e.x,z:Number.isFinite(q.z)&&q.z>0&&q.z<27?q.z:e.z,hp:clamp(Number(q.hp)||0,0,e.hp),alert:0,state:q.hp<=0?'dead':'idle'};});
    base.items=base.items.map((v,i)=>({...v,taken:!!saved.items[i]?.taken}));
    for(const e of base.enemies)if(e.hp<=0){const old=saved.items.find(a=>a.id===1000+e.id);base.items.push({id:1000+e.id,type:'ammo',x:e.x,z:e.z,value:8,taken:!!old?.taken});}
    base.discovered=saved.discovered.filter(x=>Number.isInteger(x)&&x>=0&&x<729);
    for(const k of ['kills','secrets','treasures','time'])base[k]=Math.max(0,Number(saved[k])||0);
    if(!canStand(base,p.x,p.z))return null;return {...createGame(g.difficulty,base.index),player:{...p,gold:!!p.gold,silver:!!p.silver},level:base,totals:g.totals||{kills:0,secrets:0,treasures:0,time:0},events:[]};
  }catch{return null;}
}
