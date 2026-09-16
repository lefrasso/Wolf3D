"use client";
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ArrowRight,AudioLines,BookOpen,Check,ChevronRight,Crosshair,DoorOpen,Heart,KeyRound,Maximize,Minimize,Pause,Play,RotateCcw,Save,Settings2,Shield,Skull,Volume2,VolumeX,X,Map as MapIcon,Target,Download,LoaderCircle,Languages} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {WEAPONS,LEVELS,DIFFICULTIES,CAMPAIGN_TOTALS} from '@/lib/game/levels';
import {LANGUAGES,readLanguage,persistLanguage,translate,formatNumber} from '@/lib/game/i18n';

const pad=n=>String(n).padStart(2,'0');
const clock=t=>`${pad(Math.floor(t/60))}:${pad(Math.floor(t%60))}`;
const initial={status:'menu',player:{hp:100,ammo:40,score:0,lives:3,weapon:1,owned:[0,1]},level:{index:0,name:'Las mazmorras',kills:0,secrets:0,treasures:0,time:0,totalEnemies:9,totalTreasures:7},settings:{quality:'high',volume:.55,sound:true,music:false,bob:true,fov:78,sensitivity:1},hasSave:false,message:'',target:'',fps:0};

function TacticalMap({engine,frame,full=false,label}){const ref=useRef(null);useEffect(()=>{engine.current?.drawMap(ref.current,full);},[engine,frame,full]);return <canvas ref={ref} width={full?540:216} height={full?540:216} aria-label={label} className={full?'full-map':'mini-map'}/>;}
function Key({children}){return <kbd>{children}</kbd>;}
function browserStorage(){try{return window.localStorage;}catch{return null;}}
function LanguagePicker({language,onChange,t,compact=false,onOpenChange}){
  return <Select value={language} onValueChange={onChange} onOpenChange={onOpenChange}>
    <SelectTrigger id={compact?'header-language':'settings-language'} aria-label={t('app.language')} className={compact?'language-trigger':''}>
      {compact?<><Languages size={16}/><span>{language.toUpperCase()}</span></>:<SelectValue/>}
    </SelectTrigger>
    <SelectContent>{LANGUAGES.map(l=><SelectItem key={l.code} value={l.code}><span lang={l.code}>{l.name}</span></SelectItem>)}</SelectContent>
  </Select>;}

export default function WolfGame(){
  const canvas=useRef(null),engine=useRef(null),shell=useRef(null),stick=useRef(null),look=useRef(null);
  const [language,setLanguage]=useState('es'),languageRef=useRef('es');
  const t=(key,params)=>translate(language,key,params);
  const [state,setState]=useState(initial),[ready,setReady]=useState(false),[error,setError]=useState(''),[dialog,setDialog]=useState(''),[difficulty,setDifficulty]=useState('normal'),[fullscreen,setFullscreen]=useState(false),[touch,setTouch]=useState(false),[stickOffset,setStickOffset]=useState({x:0,y:0}),[toast,setToast]=useState('');
  const victory=state.status==='victory';
  const resultStats={kills:state.level.kills+(victory?(state.totals?.kills||0):0),secrets:state.level.secrets+(victory?(state.totals?.secrets||0):0),treasures:state.level.treasures+(victory?(state.totals?.treasures||0):0),time:state.level.time+(victory?(state.totals?.time||0):0)};
  const menu=state.status==='menu',playing=state.status==='playing',paused=state.status==='paused',results=state.status==='complete'||state.status==='victory',dead=state.status==='dead';
  useEffect(()=>{let cancelled=false;const preferred=readLanguage(browserStorage(),navigator.languages||[navigator.language]);languageRef.current=preferred;setLanguage(preferred);import('@/lib/game/engine').then(({WolfEngine})=>{if(cancelled)return;try{engine.current=new WolfEngine(canvas.current,setState,setError,languageRef.current);setReady(true);}catch(e){setError('errors.webgl');console.error(e);}}).catch(()=>setError('errors.load'));setTouch(matchMedia('(pointer: coarse)').matches);const fn=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',fn);return()=>{cancelled=true;engine.current?.dispose();document.removeEventListener('fullscreenchange',fn);};},[]);
  useEffect(()=>{const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();try{Promise.resolve(context.registerTool({name:'read_game_status',title:t('agent.title'),description:t('agent.description'),inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw new Error(t('agent.noParameters'));const g=engine.current?.g;if(!g)throw new Error(t('agent.notReady'));return {status:g.status,language,level:translate(language,`level.${g.level.index}.name`),health:g.player.hp,ammo:g.player.ammo,kills:g.level.kills,secrets:g.level.secrets,goldKey:g.player.gold,silverKey:g.player.silver};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}return()=>lifecycle.abort();},[language]);
  useEffect(()=>{document.documentElement.lang=language;const meta=document.querySelector('meta[name=description]');if(meta)meta.content=translate(language,'app.description');},[language]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2500);return()=>clearTimeout(t);},[toast]);
  const call=(method,...args)=>engine.current?.[method](...args);
  const changeLanguage=value=>{const next=persistLanguage(browserStorage(),value);languageRef.current=next;setLanguage(next);call('setLanguage',next);};
  const levelName=t(`level.${state.level.index}.name`);
  const openDialog=name=>{if(playing)call('pause');setDialog(name);};
  const config=(key,value)=>call('configure',{[key]:value});
  const full=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setToast('toast.fullscreen');}};
  const save=()=>{if(call('save',true))setToast('toast.saved');else setToast('toast.saveFailed');};
  const start=()=>{setDialog('');call('start',difficulty);};
  const moveStick=e=>{if(!stick.current)return;const dx=e.clientX-stick.current.x,dy=e.clientY-stick.current.y,d=Math.max(42,Math.hypot(dx,dy));const x=dx/d,y=dy/d;if(engine.current){engine.current.input.strafe=x;engine.current.input.forward=-y;}setStickOffset({x:x*34,y:y*34});};
  const releaseStick=()=>{stick.current=null;if(engine.current){engine.current.input.forward=0;engine.current.input.strafe=0;}setStickOffset({x:0,y:0});};
  const beginStick=e=>{e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();stick.current={x:r.left+r.width/2,y:r.top+r.height/2};moveStick(e);};
  return <main ref={shell} className={`game-shell ${menu?'is-menu':''} ${playing?'is-playing':''}`}>
    <canvas ref={canvas} className="world-canvas" aria-label={t('app.canvas')} tabIndex={-1}/>
    <div className="scene-vignette" aria-hidden="true"/>
    {!ready&&!error&&<div className="loading-screen"><LoaderCircle className="spin" size={28}/><span>{t('app.loading')}</span></div>}
    {error&&<div className={`error-notice ${!ready?'fatal':''}`} role="alert"><Shield size={20}/><p>{t(error)}</p>{ready?<button aria-label={t('common.dismiss')} onClick={()=>setError('')}><X size={18}/></button>:<button onClick={()=>location.reload()}>{t('common.retry')}</button>}</div>}
    <header className="topbar">
      <div className="brand"><span className="brand-mark">W</span><span>WOLF<span className="brand-number">3D</span></span><span className="edition">{t('app.edition')}</span></div>
      <div className="top-actions">
        <LanguagePicker language={language} onChange={changeLanguage} t={t} compact onOpenChange={open=>{if(open&&playing)call('pause');}}/>
        {!menu&&<button className="icon-button" aria-label={playing?t('common.pause'):t('common.returnGame')} onClick={()=>playing?call('pause'):paused&&call('resume')}><Pause size={18}/></button>}
        <button className="icon-button sound-button" aria-label={state.settings.sound?t('common.mute'):t('common.unmute')} onClick={()=>{call('unlockAudio');config('sound',!state.settings.sound);}}>{state.settings.sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
        <button className="icon-button" aria-label={t('common.settings')} onClick={()=>openDialog('settings')}><Settings2 size={18}/></button>
        <span className="action-divider"/>
        <button className="icon-button" aria-label={fullscreen?t('common.exitFullscreen'):t('common.fullscreen')} onClick={full}>{fullscreen?<Minimize size={18}/>:<Maximize size={18}/>}</button>
      </div>
    </header>
    {menu&&<>
      <div className="menu-shade" aria-hidden="true"/>
      <section className="main-menu" aria-label={t('common.mainMenu')}>
        <div className="operation-tag"><span className="little-line"/>{t('menu.tagline')}</div>
        <h1 className="game-title">WOLF<span>3D</span><span className="title-outline" aria-hidden="true">WOLF3D</span></h1>
        <div className="subtitle-row"><span className="hd-tag">HD</span><h2>CASTLE ESCAPE</h2><span className="tiny-rule"/></div>
        <p className="intro">{t('menu.intro1')}<br/>{t('menu.intro2')}</p>
        <div className="launch-panel">
          <div className="difficulty-select"><label id="difficulty-label">{t('menu.difficulty')}</label><Select value={difficulty} onValueChange={setDifficulty}><SelectTrigger aria-labelledby="difficulty-label" className="difficulty-trigger"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(DIFFICULTIES).map(([id,d])=><SelectItem key={id} value={id}>{t(`difficulty.${id}`)}</SelectItem>)}</SelectContent></Select></div>
          <button className="launch-button" disabled={!ready} onClick={()=>state.hasSave?setDialog('new'):start()}><Play size={19} fill="currentColor"/><span>{t('menu.newGame')}</span><ArrowUpRight size={23}/></button>
          {state.hasSave&&<button className="continue-button" onClick={()=>call('continue')}><RotateCcw size={15}/>{t('menu.continue')}<ArrowRight size={16}/></button>}
        </div>
        <button className="manual-link" onClick={()=>openDialog('manual')}><BookOpen size={16}/>{t('menu.manual')}<ChevronRight size={15}/></button>
      </section>
      <aside className="mission-preview"><div className="mission-top"><span>{t('menu.episodes')}</span><Crosshair size={18}/></div><div className="mission-marker">01<span>/</span></div><h3>{t('level.0.name').toLocaleUpperCase(language)}</h3><p>{t('menu.mission1')}<br/>{t('menu.mission2')}</p><div className="mission-line"/><div className="mission-specs"><span><Target size={15}/>{t('menu.levels')}</span><span><KeyRound size={15}/>{t('menu.secrets')}</span></div></aside>
      <footer className="menu-footer"><div className="chapter-list">{LEVELS.map((l,i)=><div className={`chapter ${i===0?'active':''}`} key={i}><span>{pad(i+1)}</span><div><small>{t(`level.${i}.label`)}</small><strong>{t(`level.${i}.name`)}</strong></div></div>)}</div><div className="footer-edition"><span className="status-square"/>{t('app.version',{version:'1.1'})}<span className="footer-note">{t('app.independent')}</span></div></footer>
    </>}
    {!menu&&<>
      <div className="mission-hud"><div className="level-number">{pad(state.level.index+1)}</div><div><span className="hud-eyebrow">{t('app.operation')}</span><strong>{levelName}</strong><p>{!state.player.gold?t('objective.gold'):!state.player.silver?t('objective.silver'):state.boss?t('objective.boss'):t('objective.exit')}</p></div></div>
      <div className="minimap-wrap"><div className="map-label"><span>N</span><button aria-label={t('map.open')} onClick={()=>{if(engine.current){engine.current.mapOpen=!engine.current.mapOpen;engine.current.emit();}}}><MapIcon size={14}/> M</button></div><TacticalMap label={t('map.canvas')} engine={engine} frame={state}/><div className="minimap-footer">{clock(state.level.time)}<span>{state.fps} FPS</span></div></div>
      {playing&&<>
        <div className={`crosshair ${state.player.weapon===0?'melee':''}`} aria-hidden="true"><i/><i/><i/><i/></div>
        {state.hitSerial>0&&<div key={`hit${state.hitSerial}`} className="hit-marker" aria-hidden="true">×</div>}
        {state.damageSerial>0&&<div key={`damage${state.damageSerial}`} className="damage-flash" aria-hidden="true"/>}
        {state.target&&<div className="interaction-prompt"><Key>E</Key><span>{state.target}</span></div>}
        {state.message&&<div className="game-message" role="status">{state.message}</div>}
        {!touch&&state.level.time<12&&<div className="onboarding-hint"><span><Key>W A S D</Key> {t('controls.move')}</span><span><Key>{t('key.mouse')}</Key> {t('controls.aimShoot')}</span><span><Key>E</Key> {t('controls.interact')}</span></div>}
        {!state.locked&&!touch&&<button className="capture-hint" onClick={()=>call('lock')}><Crosshair size={14}/>{t('controls.capture')}</button>}
        {state.boss>0&&<div className="boss-health"><span>{t('hud.boss')}</span><div><i style={{width:`${state.boss/420*100}%`}}/></div></div>}
      </>}
      <div className="bottom-hud">
        <div className={`health-stat ${state.player.hp<30?'critical':''}`}><div className="stat-icon"><Heart size={22}/></div><div><span className="hud-eyebrow">{t('hud.health')}</span><strong>{Math.ceil(state.player.hp)}<small>%</small></strong><div className="health-track"><i style={{width:`${state.player.hp}%`}}/></div></div></div>
        <div className="ammo-stat"><div className="stat-icon"><AudioLines size={23}/></div><div><span className="hud-eyebrow">{t('hud.ammo')}</span><strong>{state.player.weapon===0?'∞':pad(state.player.ammo)}<small>/ 199</small></strong></div></div>
        <div className="weapon-slots" aria-label={t('hud.weapons')}>{WEAPONS.map(w=><button key={w.id} className={`weapon-slot ${state.player.weapon===w.id?'selected':''}`} disabled={!state.player.owned.includes(w.id)} onClick={()=>{if(engine.current)import('@/lib/game/simulation').then(m=>m.changeWeapon(engine.current.g,w.id));}} aria-label={state.player.owned.includes(w.id)?t(`weapon.${w.id}.name`):t('hud.unavailableWeapon',{name:t(`weapon.${w.id}.name`)})}><span>{w.id+1}</span><strong>{t(`weapon.${w.id}.short`)}</strong><i/></button>)}</div>
        <div className="inventory"><div className="key-inventory"><KeyRound aria-label={state.player.gold?t('hud.goldOwned'):t('hud.goldMissing')} className={state.player.gold?'key-gold':'missing'}/><KeyRound aria-label={state.player.silver?t('hud.silverOwned'):t('hud.silverMissing')} className={state.player.silver?'key-silver':'missing'}/></div><span>{state.level.kills}/{state.level.totalEnemies} {t('hud.kills')} <i/> {state.level.secrets}/2 {t('hud.secrets')}</span></div>
        <div className="score-stat"><span className="hud-eyebrow">{t('hud.score')}</span><strong>{String(state.player.score).padStart(6,'0')}</strong><span className="lives">{Array.from({length:3},(_,i)=><Shield key={i} size={12} className={i<state.player.lives?'':'spent'}/>)}<small>{t('hud.lives')}</small></span></div>
      </div>
      {state.mapOpen&&playing&&<div className="map-overlay"><div className="map-panel"><div className="map-heading"><div><span className="eyebrow">{t('map.heading')}</span><h2>{levelName}</h2></div><button aria-label={t('map.close')} onClick={()=>{engine.current.mapOpen=false;engine.current.emit();}}><X size={21}/></button></div><TacticalMap label={t('map.canvas')} engine={engine} frame={state} full/><div className="map-legend"><span>{t('map.position')}</span><span>{t('map.explored')}</span></div><p>{t('map.active')} <Key>M</Key> {t('map.closeHint')}</p></div></div>}
    </>}
    {touch&&playing&&<div className="touch-controls">
      <div className="touch-look" aria-label={t('controls.drag')} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);look.current=e.clientX;}} onPointerMove={e=>{if(look.current!==null){call('look',(e.clientX-look.current)*1.9);look.current=e.clientX;}}} onPointerUp={()=>look.current=null} onPointerCancel={()=>look.current=null}/>
      <div className="touch-stick" onPointerDown={beginStick} onPointerMove={moveStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} aria-label={t('controls.joystick')}><div style={{transform:`translate(${stickOffset.x}px, ${stickOffset.y}px)`}}/></div>
      <button className="touch-use" onPointerDown={e=>{e.preventDefault();call('use');}} aria-label={t('controls.interact')}><DoorOpen size={25}/></button>
      <button className="touch-fire" aria-label={t('controls.fire')} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);if(engine.current)engine.current.input.fire=true;}} onPointerUp={()=>{if(engine.current)engine.current.input.fire=false;}} onPointerCancel={()=>{if(engine.current)engine.current.input.fire=false;}}><Crosshair size={38}/></button>
    </div>}
    {paused&&!dialog&&<div className="state-overlay"><section className="state-panel"><span className="eyebrow">{t('pause.eyebrow')}</span><h2>{t('pause.title')}</h2><p>{levelName} · {clock(state.level.time)}</p><button className="launch-button" onClick={()=>call('resume')}><Play size={19}/><span>{t('pause.resume')}</span><ArrowRight size={20}/></button><div className="pause-actions"><button onClick={save}><Save size={17}/>{t('pause.save')}</button><button onClick={()=>openDialog('settings')}><Settings2 size={17}/>{t('common.settings')}</button><button onClick={()=>openDialog('manual')}><BookOpen size={17}/>{t('pause.controls')}</button><button onClick={()=>call('menu')}><ArrowUpRight size={17}/>{t('common.mainMenu')}</button></div><small>{t('pause.localSave')}</small></section></div>}
    {dead&&!dialog&&<div className="state-overlay"><section className="state-panel"><Skull className="state-symbol" size={34}/><span className="eyebrow">{t('death.eyebrow')}</span><h2>{state.player.lives>1?t('death.title'):t('death.gameOver')}</h2><p>{state.player.lives>1?t('death.lives',{count:state.player.lives-1}):t('death.description')}</p><button className="launch-button" onClick={()=>call('retry')}><RotateCcw size={19}/><span>{state.player.lives>1?t('death.retryLevel'):t('death.newOperation')}</span><ArrowRight size={20}/></button><button className="text-button" onClick={()=>call('menu')}>{t('common.backMenu')}</button></section></div>}
    {results&&!dialog&&<div className="state-overlay"><section className="state-panel results-panel"><span className="eyebrow">{state.status==='victory'?t('results.operation'):t('results.level',{level:pad(state.level.index+1)})}</span><h2>{state.status==='victory'?t('results.free'):t('results.secured')}</h2><p>{state.status==='victory'?t('results.description'):levelName}</p><div className="results-grid"><div><Skull size={18}/><strong>{resultStats.kills}<small>/{victory?CAMPAIGN_TOTALS.enemies:state.level.totalEnemies}</small></strong><span>{t('hud.kills')}</span></div><div><KeyRound size={18}/><strong>{resultStats.secrets}<small>/{victory?CAMPAIGN_TOTALS.secrets:2}</small></strong><span>{t('hud.secrets')}</span></div><div><Target size={18}/><strong>{resultStats.treasures}<small>/{victory?CAMPAIGN_TOTALS.treasures:state.level.totalTreasures}</small></strong><span>{t('hud.treasures')}</span></div></div><div className="results-time"><span>{t('results.time')} {clock(resultStats.time)}</span><span>{formatNumber(language,state.player.score)} {t('results.points')}</span></div><button className="launch-button" onClick={()=>state.status==='victory'?call('menu'):call('next')}><Check size={20}/><span>{state.status==='victory'?t('results.menu'):state.level.index===2?t('results.finish'):t('results.next')}</span><ArrowRight size={20}/></button></section></div>}
    {toast&&<div className="ui-toast" role="status">{t(toast)}</div>}
    <Dialog open={!!dialog} onOpenChange={open=>!open&&setDialog('')}><DialogContent showCloseButton={false} className="field-dialog" onCloseAutoFocus={e=>e.preventDefault()}><DialogClose className="dialog-close" aria-label={t('common.close')}><X size={18}/></DialogClose><DialogHeader><span className="eyebrow">WOLF3D · CASTLE ESCAPE</span><DialogTitle>{dialog==='settings'?t('settings.title'):dialog==='new'?t('new.title'):t('menu.manual')}</DialogTitle><DialogDescription>{dialog==='settings'?t('settings.description'):dialog==='new'?t('new.description'):t('manual.description')}</DialogDescription></DialogHeader>
      {dialog==='settings'&&<div className="settings-content"><div className="setting-row"><label htmlFor="settings-language">{t('app.language')}</label><LanguagePicker language={language} onChange={changeLanguage} t={t}/></div><div className="setting-row"><label id="quality-label">{t('settings.quality')}</label><Select value={state.settings.quality} onValueChange={v=>config('quality',v)}><SelectTrigger aria-labelledby="quality-label"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="high">{t('settings.high')}</SelectItem><SelectItem value="medium">{t('settings.medium')}</SelectItem><SelectItem value="low">{t('settings.low')}</SelectItem></SelectContent></Select></div><div className="slider-setting"><div><label id="sens-label">{t('settings.sensitivity')}</label><span>{formatNumber(language,state.settings.sensitivity,{minimumFractionDigits:1,maximumFractionDigits:1})}×</span></div><Slider aria-labelledby="sens-label" min={.3} max={2.5} step={.1} value={[state.settings.sensitivity]} onValueChange={v=>config('sensitivity',v[0])}/></div><div className="slider-setting"><div><label id="fov-label">{t('settings.fov')}</label><span>{state.settings.fov}°</span></div><Slider aria-labelledby="fov-label" min={60} max={100} step={1} value={[state.settings.fov]} onValueChange={v=>config('fov',v[0])}/></div><div className="slider-setting"><div><label id="volume-label">{t('settings.volume')}</label><span>{Math.round(state.settings.volume*100)}%</span></div><Slider aria-labelledby="volume-label" min={0} max={1} step={.05} value={[state.settings.volume]} onValueChange={v=>{call('unlockAudio');config('volume',v[0]);}}/></div><div className="setting-row"><label htmlFor="sound-switch">{t('settings.sound')}</label><Switch id="sound-switch" checked={state.settings.sound} onCheckedChange={v=>{call('unlockAudio');config('sound',v);}}/></div><div className="setting-row"><label htmlFor="music-switch">{t('settings.music')}</label><Switch id="music-switch" checked={state.settings.music} onCheckedChange={v=>{call('unlockAudio');config('music',v);}}/></div><div className="setting-row"><label htmlFor="bob-switch">{t('settings.bob')}</label><Switch id="bob-switch" checked={state.settings.bob} onCheckedChange={v=>config('bob',v)}/></div><p className="settings-note">{t('settings.performanceHint')}</p></div>}
      {dialog==='manual'&&<div className="manual-content"><div className="manual-objective"><span>{t('manual.heading')}</span><p>{t('manual.objective')}</p></div><div className="controls-table">{[['W A S D',t('controls.move')],[t('key.turn'),t('controls.turn')],[t('key.fire'),t('controls.fire')],[t('key.interact'),t('controls.door')],['SHIFT',t('controls.run')],[t('key.weapon'),t('controls.weapon')],['M / TAB',t('controls.map')],['ESC / P',t('controls.pause')],['F5 / F9',t('controls.saveLoad')]].map(([key,label])=><div key={key}><span>{label}</span><Key>{key}</Key></div>)}</div><p className="manual-tip"><KeyRound size={18}/>{t('manual.secret')}</p><p className="settings-note">{t('manual.touch')}</p><a className="source-link" href="/downloads/wolf3d-hd-project.zip" download><Download size={17}/>{t('manual.download')}</a></div>}
      {dialog==='new'&&<div className="confirm-new"><button className="launch-button" onClick={start}><Play size={18}/><span>{t('new.start')}</span><ArrowRight size={18}/></button><button className="text-button" onClick={()=>setDialog('')}>{t('new.cancel')}</button></div>}
    </DialogContent></Dialog>
  </main>;
}
