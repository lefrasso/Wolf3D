import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOGS,LANGUAGES,LANGUAGE_KEY,chooseLanguage,readLanguage,persistLanguage,translate,translateMessage,formatNumber} from '../lib/game/i18n.js';
import {createGame,collect,interact,shoot,serialize,deserialize,targetInteraction} from '../lib/game/simulation.js';
import {WolfEngine} from '../lib/game/engine.js';

test('Every supported language has the same complete keys and interpolation tokens',()=>{
  const keys=Object.keys(CATALOGS.en).sort();
  for(const {code} of LANGUAGES){assert.deepEqual(Object.keys(CATALOGS[code]).sort(),keys);for(const key of keys){assert(CATALOGS[code][key].trim());const tokens=s=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();assert.deepEqual(tokens(CATALOGS[code][key]),tokens(CATALOGS.en[key]),`${code}:${key}`);}}
});
test('Saved language wins; regional browser languages normalize with English fallback',()=>{
  assert.equal(chooseLanguage('es',['en-US']),'es');assert.equal(chooseLanguage('en',['es-AR']),'en');
  assert.equal(chooseLanguage(null,['es-CL','en-US']),'es');assert.equal(chooseLanguage(null,['fr-FR','en-GB']),'en');
  assert.equal(chooseLanguage('invalid',['es_ES']),'es');assert.equal(chooseLanguage(null,['de-DE']),'en');
});
test('Language preferences survive reload and blocked browser storage does not throw',()=>{
  const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  assert.equal(persistLanguage(storage,'en-US'),'en');assert.equal(data.get(LANGUAGE_KEY),'en');assert.equal(readLanguage(storage,['es']),'en');
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(readLanguage(blocked,['es-AR']),'es');assert.equal(persistLanguage(blocked,'en'),'en');
});
test('Plural lives, interpolated levels, localized decimals and fallback render correctly',()=>{
  assert.equal(translate('en','death.lives',{count:1}),'You have 1 life left. Try again.');
  assert.equal(translate('en','death.lives',{count:2}),'You have 2 lives left. Try again.');
  assert.equal(translate('es','death.lives',{count:1}),'Te queda 1 vida. Volvé a intentarlo.');
  assert.equal(translate('en','results.level',{level:'02'}),'LEVEL 02 COMPLETE');
  assert.equal(formatNumber('es',1.5),'1,5');assert.equal(formatNumber('en',1.5),'1.5');
  assert.equal(translate('unsupported','common.close'),'Close');
});
test('Real combat, pickup and door notifications are translated at display time',()=>{
  const g=createGame();collect(g,{type:'treasure',value:500,taken:false});
  assert.equal(translateMessage('en',g.message),'Treasure +500');assert.equal(translateMessage('es',g.message),'Tesoro +500');
  g.player.ammo=0;shoot(g);assert.equal(translateMessage('en',g.message),'Out of ammo · Use the knife [1]');
  g.player.x=19.5;g.player.z=11.5;g.player.yaw=Math.PI;
  assert.equal(translate('en',targetInteraction(g).text),'You need the gold key');interact(g);
  assert.equal(translateMessage('es',g.message),'Necesitás la llave dorada');assert.equal(translateMessage('en',g.message),'You need the gold key');
  g.player.x=g.level.exit.x;g.player.z=g.level.exit.z;interact(g);assert.equal(translateMessage('en',g.message),'You need both keys to activate the exit.');
});
test('Live language changes keep game state and v1 saved games intact',()=>{
  const g=createGame('hard',1);g.player.ammo=73;g.player.gold=true;g.level.doors[1].open=1;g.level.items[0].taken=true;
  const original=serialize(g);let updates=0;const engine={language:'es',g,exitSign:null,emit(){updates++;},buildWorld(){assert.fail('Language must not rebuild a level');}};
  WolfEngine.prototype.setLanguage.call(engine,'en');assert.equal(engine.language,'en');assert.equal(serialize(g),original);
  WolfEngine.prototype.setLanguage.call(engine,'es');assert.equal(updates,2);assert.equal(serialize(g),original);
  const legacy=JSON.parse(original);legacy.message='Llave dorada';const restored=deserialize(JSON.stringify(legacy));
  assert(restored);assert.equal(restored.version,1);assert.equal(restored.player.ammo,73);assert.equal(restored.player.gold,true);assert(restored.level.items[0].taken);
  assert.equal(translate('en',`level.${restored.level.index}.name`),'The Arsenal');assert.equal(translate('es',`level.${restored.level.index}.name`),'El arsenal');
});
