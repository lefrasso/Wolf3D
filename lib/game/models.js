import * as T from 'three';
export const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.76,metalness:.12,...extra});
export function box(parent,w,h,d,mat,x=0,y=0,z=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function cylinder(parent,r1,r2,h,mat,x=0,y=0,z=0,segments=12){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
export function ball(parent,r,mat,x=0,y=0,z=0){const m=new T.Mesh(new T.SphereGeometry(r,12,8),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}

export function makeEnemy(type){
  const g=new T.Group(),off=type==='officer',boss=type==='commander';
  const cloth=material(boss?'#2e3539':off?'#42515b':'#62614c'),skin=material('#bca28b'),black=material('#171a19'),metal=material('#5a6362',{metalness:.8,roughness:.35}),strap=material('#322c25');
  // Weighted silhouettes and articulated limbs; no external model dependencies.
  const body=box(g,.72,.83,.44,cloth,0,1.2,0);body.rotation.z=.018;
  box(g,.75,.13,.47,strap,0,.9,0);box(g,.14,.15,.06,metal,0,.9,.27);
  const head=ball(g,.235,skin,0,1.9,0);head.scale.set(.83,1.07,.87);
  const helmet=ball(g,.275,off?black:cloth,0,2.03,0);helmet.scale.y=.52;
  box(g,.48,.035,.35,black,0,1.99,.075);
  box(g,.25,.065,.06,black,0,1.91,.195);box(g,.065,.07,.06,skin,0,1.82,.23);
  box(g,.1,.75,.025,strap,-.18,1.27,.239).rotation.z=-.3;
  for(const x of [-.22,.22]){box(g,.13,.18,.09,strap,x,1.22,.29);box(g,.16,.12,.07,metal,x,1.48,.26);}
  const legs=[];for(const x of [-.21,.21]){const leg=new T.Group();leg.position.set(x,.86,0);box(leg,.27,.57,.3,cloth,0,-.28,0);box(leg,.29,.3,.4,black,0,-.72,.06);g.add(leg);legs.push(leg);}
  const arms=[];for(const x of [-.48,.48]){const arm=new T.Group();arm.position.set(x,1.52,0);cylinder(arm,.16,.14,.55,cloth,0,-.24,0);ball(arm,.14,skin,0,-.49,.035);arm.rotation.x=-.8;g.add(arm);arms.push(arm);}
  const gun=new T.Group();gun.position.set(.22,1.12,.49);box(gun,.15,.17,.66,black);const barrel=cylinder(gun,.043,.043,.56,metal,0,.01,.48);barrel.rotation.x=Math.PI/2;box(gun,.08,.32,.13,metal,0,-.18,.05);g.add(gun);
  const flash=ball(gun,.16,new T.MeshBasicMaterial({color:'#ffcd69'}),0,.01,.78);flash.visible=false;
  if(boss){g.scale.setScalar(1.3);box(g,1,.44,.55,metal,0,1.55,0);for(const x of [-.7,.7]){const cannon=cylinder(g,.1,.1,.92,metal,x,1.12,.5);cannon.rotation.x=Math.PI/2;}}
  g.userData={legs,arms,flash,body};return g;
}

export function makeWeapon(id){
  const g=new T.Group(),steel=material('#576368',{metalness:.88,roughness:.29}),dark=material('#182022',{metalness:.7,roughness:.36}),grip=material('#443c32'),skin=material('#a18a72'),sleeve=material('#42473a');
  const arm=cylinder(g,.055,.083,.43,sleeve,.115,-.18,.27);arm.rotation.x=-.45;ball(g,.071,skin,.1,-.025,.055);
  if(id===0){box(g,.045,.18,.055,grip,.08,.035,-.02);box(g,.18,.024,.07,steel,.08,.14,-.02);const blade=new T.Mesh(new T.ConeGeometry(.05,.4,3),steel);blade.position.set(.08,.35,-.02);g.add(blade);}
  else if(id===1){box(g,.095,.105,.38,steel,.08,.08,-.14);box(g,.065,.185,.105,grip,.08,-.02,.015).rotation.x=-.2;box(g,.07,.055,.09,dark,.08,.16,-.27);box(g,.04,.025,.03,steel,.08,.17,.02);const b=cylinder(g,.025,.025,.14,dark,.08,.08,-.38);b.rotation.x=Math.PI/2;}
  else {box(g,.14,.15,.45,dark,.03,.08,-.12);box(g,.095,.22,.12,grip,.03,-.08,.035);box(g,.072,.31,.12,steel,.03,-.18,-.21).rotation.x=.15;
    const b=cylinder(g,id===3?.065:.04,id===3?.065:.04,.51,steel,.03,.08,-.56);b.rotation.x=Math.PI/2;
    for(let i=0;i<6;i++){const ring=cylinder(g,.06,.06,.019,dark,.03,.08,-.38-i*.061);ring.rotation.x=Math.PI/2;}
    box(g,.035,.05,.045,steel,.03,.17,-.78);box(g,.11,.055,.055,steel,.03,.18,.04);
    const a=cylinder(g,.055,.08,.36,sleeve,-.17,-.19,.1);a.rotation.z=-.4;a.rotation.x=-1;ball(g,.065,skin,-.07,-.04,-.24);
    if(id===3){for(const [x,y]of [[-.04,.04],[.04,.04],[-.04,-.04],[.04,-.04]]){const v=cylinder(g,.027,.027,.65,steel,.03+x,.08+y,-.6);v.rotation.x=Math.PI/2;}box(g,.22,.16,.3,dark,.03,.08,-.12);}}
  const flash=new T.Group(),fmat=new T.MeshBasicMaterial({color:'#ffdd7b',transparent:true,opacity:.92,depthTest:false});
  const cone=new T.Mesh(new T.ConeGeometry(.12,.36,7),fmat);cone.rotation.x=-Math.PI/2;flash.add(cone);flash.position.set(id===1?.08:.03,.08,id===1?-.48:-.97);flash.visible=false;g.add(flash);
  g.userData={flash};return g;
}

export function makePickup(type){
  const g=new T.Group(),gold=material('#e9bd50',{metalness:.85,roughness:.23}),silver=material('#c8d7df',{metalness:.8,roughness:.28}),green=material('#536442'),dark=material('#232828');
  if(type==='gold'||type==='silver'){const mat=type==='gold'?gold:silver;const ring=new T.Mesh(new T.TorusGeometry(.19,.058,8,16),mat);ring.position.y=.36;g.add(ring);box(g,.075,.47,.075,mat,0,0,0);box(g,.23,.07,.075,mat,.07,-.2,0);box(g,.065,.12,.075,mat,.15,-.15,0);}
  else if(type==='health'){box(g,.63,.34,.48,material('#d2d2b8'),0,.1,0);box(g,.12,.25,.012,material('#b64336'),0,.1,.25);box(g,.34,.09,.014,material('#b64336'),0,.1,.26);}
  else if(type==='ammo'){box(g,.46,.25,.28,green,0,.07,0);box(g,.48,.035,.3,dark,0,.2,0);for(let i=0;i<3;i++)cylinder(g,.027,.028,.19,gold,-.12+i*.12,.27,0);}
  else if(type==='treasure'){box(g,.43,.19,.31,gold,0,.03,0);box(g,.36,.1,.28,gold,0,.17,0);}
  else {const gun=makeWeapon(type==='machinegun'?2:3);gun.scale.setScalar(.9);gun.rotation.z=Math.PI/2;g.add(gun);}
  const halo=new T.Mesh(new T.RingGeometry(.31,.36,32),new T.MeshBasicMaterial({color:type==='gold'?'#eec863':type==='silver'?'#b3dce9':type==='health'?'#dc8670':'#b7d27b',transparent:true,opacity:.36,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=-.35;g.add(halo);return g;
}

export function signTexture(text,sub='',color='#d6e2c0'){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#18211d';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#596658';ctx.lineWidth=5;ctx.strokeRect(12,12,488,232);ctx.fillStyle=color;ctx.textAlign='center';ctx.font='bold 64px Arial';ctx.fillText(text,256,128);ctx.font='24px Arial';ctx.fillText(sub,256,182);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
