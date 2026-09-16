// Authored campaign data. Coordinates are cells; rendering scales them to metres.
export const CELL = 3;
export const LEVELS = [
  { name: 'Las mazmorras', label: 'EL DESPERTAR', location: 'Ala este · Nivel subterráneo', theme: 'stone', tint: '#778786', fog: '#151d1e', par: 240, briefing: 'Salí de las celdas. Encontrá las dos llaves y llegá al ascensor.' },
  { name: 'El arsenal', label: 'TRAS LAS LÍNEAS', location: 'Ala norte · Instalaciones militares', theme: 'bunker', tint: '#888677', fog: '#1a1e18', par: 300, briefing: 'La guarnición está en alerta. Recuperá las llaves y atravesá el arsenal.' },
  { name: 'La fortaleza', label: 'ÚLTIMA SALIDA', location: 'Torre central · Puesto de mando', theme: 'fortress', tint: '#85797a', fog: '#211b1a', par: 360, briefing: 'El comandante protege la salida. Conseguí las llaves y terminá la operación.' },
];

export function makeLevel(index = 0) {
  const grid = Array.from({length: 27}, () => Array(27).fill('#'));
  const room = (x1,z1,x2,z2) => { for(let z=z1;z<=z2;z++) for(let x=x1;x<=x2;x++) grid[z][x]='.'; };
  room(2,2,10,10); room(15,2,24,10); room(15,15,24,24); room(2,15,10,24);
  room(11,6,14,6); room(19,11,19,14); room(11,19,14,19); room(6,11,6,14);
  room(12,2,13,4); room(11,3,11,3); room(2,12,4,13); room(3,11,3,11);
  // Cover islands preserve navigation lanes on each side.
  for(const [x,z] of [[5,7],[8,7],[18,5],[21,5],[18,18],[21,21],[5,18],[8,21]]) grid[z][x]='#';
  if(index>0) for(const [x,z] of [[17,8],[22,8],[16,21],[23,18],[8,16]]) grid[z][x]='#';
  const doors = [
    {x:12,z:6,axis:'x',key:null}, {x:19,z:12,axis:'z',key:'gold'},
    {x:12,z:19,axis:'x',key:'silver'}, {x:6,z:12,axis:'z',key:'silver'},
    {x:11,z:3,axis:'x',secret:true}, {x:3,z:11,axis:'z',secret:true},
  ].map((d,id)=>({id,...d,open:0,target:0,found:false}));
  for(const d of doors) grid[d.z][d.x]=d.secret?'S':'D';
  const items = [];
  const add = (type,x,z,value) => items.push({id:items.length,type,x:x+.5,z:z+.5,value,taken:false});
  add('gold',23,3); add('silver',23,23);
  add('ammo',7,3); add('ammo',16,3); add('ammo',23,8); add('ammo',16,16); add('ammo',20,23); add('ammo',3,16);
  add('health',3,8); add('health',22,9); add('health',16,23); add('health',9,23);
  add('treasure',9,3,100); add('treasure',16,9,100); add('treasure',23,16,100); add('treasure',3,23,100);
  add('treasure',12,2,500); add('treasure',13,4,500); add('health',12,4);
  add(index===0?'machinegun':'chaingun',3,12); add('ammo',2,13); add('treasure',4,13,500);
  add(index===0?'machinegun':'chaingun',17,3); add('ammo',20,16);
  const spots = [[9,9],[16,6],[22,4],[23,9],[19,16],[23,20],[16,23],[9,19],[4,22]];
  if(index>0) spots.push([16,9],[21,16],[7,23],[3,16]);
  if(index>1) spots.push([18,23],[22,22],[8,16]);
  const enemies=spots.map(([x,z],id)=>({id,x:x+.5,z:z+.5,originX:x+.5,originZ:z+.5,type:index>0&&id%3===1?'officer':'guard',hp:index>0&&id%3===1?75:50,state:'idle',yaw:Math.PI,cooldown:.9+id*.12,alert:0,walk:0,path:[],repath:0}));
  if(index===2) enemies.push({id:enemies.length,x:5.5,z:21.5,originX:5.5,originZ:21.5,type:'commander',hp:420,state:'idle',yaw:0,cooldown:1.5,alert:0,walk:0,path:[],repath:0});
  return {...LEVELS[index],index,grid,doors,items,enemies,spawn:{x:5.5,z:3.5,yaw:Math.PI},exit:{x:3.5,z:21.5},discovered:[],kills:0,secrets:0,treasures:0,time:0};
}

export const WEAPONS = [
  {id:0,name:'Cuchillo',short:'CUCHILLO',damage:32,rate:.42,range:1.15,ammo:0},
  {id:1,name:'Pistola',short:'PISTOLA',damage:32,rate:.32,range:22,ammo:1},
  {id:2,name:'Subfusil',short:'SUBFUSIL',damage:26,rate:.135,range:22,ammo:1},
  {id:3,name:'Ametralladora',short:'AMETRALLADORA',damage:35,rate:.095,range:24,ammo:1},
];
export const DIFFICULTIES = {easy:{name:'Recluta',damage:.5,accuracy:.55,speed:.75},normal:{name:'Soldado',damage:1,accuracy:.72,speed:1},hard:{name:'Veterano',damage:1.45,accuracy:.9,speed:1.15}};

export const CAMPAIGN_TOTALS = {enemies: LEVELS.reduce((n,_,i)=>n+makeLevel(i).enemies.length,0), secrets: LEVELS.length*2, treasures: LEVELS.reduce((n,_,i)=>n+makeLevel(i).items.filter(v=>v.type==='treasure').length,0)};
