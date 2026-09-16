import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLevel,WEAPONS} from '../lib/game/levels.js';
import {createGame,update,move,canStand,findPath,clearLine,interact,shoot,collect,nextLevel,serialize,deserialize,changeWeapon} from '../lib/game/simulation.js';

test('Every authored floor is rectangular, bounded, and all objectives are reachable in key order',()=>{
  for(let i=0;i<3;i++){const l=makeLevel(i);assert.equal(l.grid.length,27);assert(l.grid.every(r=>r.length===27));assert(l.grid[0].every(c=>c==='#'));assert(l.grid[26].every(c=>c==='#'));assert(canStand(l,l.spawn.x,l.spawn.z));
    const p={...l.spawn};for(const key of ['gold','silver']){const item=l.items.find(v=>v.type===key);for(const d of l.doors)if(!d.key||p[d.key])d.open=1;assert(findPath(l,p.x,p.z,item.x,item.z).length>0,`floor ${i}, ${key}`);p.x=item.x;p.z=item.z;p[key]=true;}
    l.doors.forEach(d=>d.open=1);assert(findPath(l,p.x,p.z,l.exit.x,l.exit.z).length>0);
    for(const item of l.items)assert(!['#'].includes(l.grid[Math.floor(item.z)][Math.floor(item.x)]));
  }
});
test('Wall collision slides and prevents crossing grid boundaries',()=>{const l=makeLevel();const p={x:2.22,z:3.5};for(let i=0;i<120;i++)move(l,p,-.05,.015);assert(p.x>=2.19);assert(p.z>4);assert(canStand(l,p.x,p.z));});
test('Diagonal movement has the same speed as forward movement',()=>{const a=createGame(),b=createGame();a.level.enemies=[];b.level.enemies=[];update(a,.05,{forward:1});update(b,.05,{forward:1,strafe:1});assert(Math.abs(Math.hypot(a.player.x-5.5,a.player.z-3.5)-Math.hypot(b.player.x-5.5,b.player.z-3.5))<1e-9);});
test('Keys gate doors, doors animate, and a player cannot be crushed',()=>{const g=createGame();g.player.x=19.5;g.player.z=11.5;g.player.yaw=Math.PI;const d=g.level.doors[1];interact(g);assert.equal(d.target,0);g.player.gold=true;interact(g);assert.equal(d.target,1);g.level.enemies=[];for(let i=0;i<90;i++)update(g,1/60);assert.equal(d.open,1);g.player.z=12.5;d.target=0;update(g,1/60);assert.equal(d.target,1);assert(canStand(g.level,19.5,12.5));});
test('Secret score and count are granted exactly once',()=>{const g=createGame();g.player.x=10.5;g.player.z=3.5;g.player.yaw=-Math.PI/2;interact(g);interact(g);assert.equal(g.level.secrets,1);assert.equal(g.player.score,500);});
test('Hitscan obeys aim, cooldown, ammo, enemy health and drops',()=>{const g=createGame();const e=g.level.enemies[0];e.x=5.5;e.z=5.5;g.level.enemies=[e];assert(shoot(g,()=>.5));assert.equal(e.hp,18);assert.equal(g.player.ammo,39);assert(!shoot(g));g.shotCooldown=0;assert(shoot(g,()=>.5));assert.equal(e.hp,0);assert.equal(g.level.kills,1);assert(g.level.items.some(i=>i.id===1000+e.id));});
test('Closed walls block both hitscan and enemy perception',()=>{const g=createGame();const e=g.level.enemies[0];g.player.x=10.5;g.player.z=5.5;g.player.yaw=-Math.PI/2;e.x=15.5;e.z=5.5;g.level.enemies=[e];assert(!clearLine(g.level,g.player.x,g.player.z,e.x,e.z));shoot(g,()=>.5);assert.equal(e.hp,50);update(g,.05,{},()=>0);assert.equal(g.player.hp,100);assert.equal(e.state,'idle');});
test('Ammo is shared, pickups respect caps, and knife remains available',()=>{const g=createGame();g.player.ammo=0;assert(!shoot(g));changeWeapon(g,0);g.shotCooldown=0;assert(shoot(g));assert.equal(g.player.ammo,0);collect(g,{type:'machinegun',taken:false});assert(g.player.owned.includes(2));assert.equal(g.player.weapon,2);g.player.hp=100;assert(!collect(g,{type:'health',taken:false}));g.player.ammo=199;assert(!collect(g,{type:'ammo',taken:false}));g.player.ammo=195;collect(g,{type:'ammo',taken:false});assert.equal(g.player.ammo,199);});
test('Pause freezes simulation; combat can terminate in death',()=>{const g=createGame();g.status='paused';update(g,.05,{forward:1,fire:true});assert.equal(g.level.time,0);assert.equal(g.player.ammo,40);g.status='playing';g.player.hp=1;const e=g.level.enemies[0];e.x=5.5;e.z=5.5;e.cooldown=0;g.level.enemies=[e];update(g,.05,{},()=>0);assert.equal(g.status,'dead');assert.equal(g.player.hp,0);});
test('Exit requires both keys and the final commander; campaign reaches victory',()=>{let g=createGame();for(let i=0;i<3;i++){g.player.x=g.level.exit.x;g.player.z=g.level.exit.z;interact(g);assert.equal(g.status,'playing');g.player.gold=g.player.silver=true;if(i===2){interact(g);assert.equal(g.status,'playing');g.level.enemies.find(e=>e.type==='commander').hp=0;}interact(g);assert.equal(g.status,'complete');g=nextLevel(g);}assert.equal(g.status,'victory');});
test('Save restores dynamic state, validates corruption and reconstructs trusted level data',()=>{const g=createGame('hard',1);g.player.gold=true;g.player.ammo=72;g.level.doors[0].open=1;g.level.items[0].taken=true;const saved=deserialize(serialize(g));assert(saved);assert.equal(saved.player.ammo,72);assert.equal(saved.difficulty,'hard');assert(saved.level.items[0].taken);assert.equal(deserialize('{bad'),null);const raw=JSON.parse(serialize(g));raw.player.x=-100;assert.equal(deserialize(JSON.stringify(raw)),null);raw.player.x=5.5;raw.level.grid=[];assert.equal(deserialize(JSON.stringify(raw)).level.grid.length,27);raw.player.owned=[200];assert.equal(deserialize(JSON.stringify(raw)),null);});

// End-to-end simulation smoke: no teleporting, no invulnerability, real collision,
// pathfinding, interaction, combat, pickups and transitions. Fixed RNG isolates logic.
test('Autonomous traversal completes all three floors using the actual movement and interaction loop',()=>{
  let g=createGame('easy');let ticks=0;
  function walkTo(tx,tz){
    for(let limit=0;limit<20000;limit++){
      const p=g.player;if(Math.hypot(tx-p.x,tz-p.z)<.2)return;
      assert.equal(g.status,'playing');
      // Stop and defeat visible enemies before proceeding, as a careful player would.
      const target=g.level.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.z-p.z)<15&&clearLine(g.level,p.x,p.z,e.x,e.z)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
      if(target&&p.ammo>0){p.yaw=Math.atan2(-(target.x-p.x),-(target.z-p.z));update(g,1/60,{fire:true},()=>.95);ticks++;continue;}
      const planned={...g.level,doors:g.level.doors.map(d=>({...d,open:!d.key||p[d.key]?1:d.open}))};
      const path=findPath(planned,p.x,p.z,tx,tz);const dest=path[0]||{x:tx,z:tz};p.yaw=Math.atan2(-(dest.x-p.x),-(dest.z-p.z));
      const d=g.level.doors.find(d=>Math.hypot(d.x+.5-p.x,d.z+.5-p.z)<1.55&&Math.floor(dest.x)===d.x&&Math.floor(dest.z)===d.z);
      if(d&&d.target!==1)interact(g);
      update(g,1/60,{forward:1},()=>.95);ticks++;
    }assert.fail(`Navigation stalled at ${g.player.x},${g.player.z}, target ${tx},${tz}`);
  }
  for(let i=0;i<3;i++){
    for(const type of ['machinegun','gold','silver']){const item=g.level.items.find(v=>v.type===type);if(item){walkTo(item.x,item.z);assert(item.taken,`Pickup ${type}`);}}
    if(i===2){const boss=g.level.enemies.find(e=>e.type==='commander');walkTo(boss.x,boss.z);assert.equal(boss.hp,0);}
    walkTo(g.level.exit.x,g.level.exit.z);interact(g);assert.equal(g.status,'complete');g=nextLevel(g);
  }
  assert.equal(g.status,'victory');assert(ticks>1000);console.log(`Campaign completed in ${ticks} fixed simulation ticks.`);
});
