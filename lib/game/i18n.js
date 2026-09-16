import es from './locales/es.js';
import en from './locales/en.js';

export const LANGUAGE_KEY = 'wolf3d-hd:language:v1';
export const LANGUAGES = [{code:'es',name:'Español'},{code:'en',name:'English'}];
export const CATALOGS = {es,en};
export const DEFAULT_LANGUAGE = 'en';

function supportedLanguage(value) {
  const base=String(value||'').toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(CATALOGS,base)?base:null;
}
export function normalizeLanguage(value) {return supportedLanguage(value)||DEFAULT_LANGUAGE;}
export function chooseLanguage(saved,browserLanguages=[]) {
  if(supportedLanguage(saved))return supportedLanguage(saved);
  const languages=Array.isArray(browserLanguages)?browserLanguages:[browserLanguages];
  return languages.map(supportedLanguage).find(Boolean)||DEFAULT_LANGUAGE;
}
export function readLanguage(storage,browserLanguages=[]) {
  let saved;try{saved=storage?.getItem(LANGUAGE_KEY);}catch{}
  return chooseLanguage(saved,browserLanguages);
}
export function persistLanguage(storage,value) {
  const language=normalizeLanguage(value);
  try{storage?.setItem(LANGUAGE_KEY,language);}catch{}
  return language;
}
export function translate(language,key,params={}) {
  if(!key)return '';
  const locale=normalizeLanguage(language),catalog=CATALOGS[locale];
  let resolved=key;
  if(Number.isFinite(params.count)){
    const plural=`${key}_${new Intl.PluralRules(locale).select(params.count)}`;
    if(Object.hasOwn(catalog,plural)||Object.hasOwn(CATALOGS[DEFAULT_LANGUAGE],plural))resolved=plural;
  }
  const value=catalog[resolved]??CATALOGS[DEFAULT_LANGUAGE][resolved]??key;
  return value.replace(/\{(\w+)\}/g,(token,name)=>params[name]===undefined?token:String(params[name]));
}
export function translateMessage(language,message) {
  return message&&typeof message==='object'?translate(language,message.key,message.params):translate(language,message);
}
export function formatNumber(language,value,options={}) {return new Intl.NumberFormat(normalizeLanguage(language),options).format(value);}
