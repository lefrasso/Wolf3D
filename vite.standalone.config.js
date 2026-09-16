import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {cpSync,mkdirSync} from 'node:fs';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({
  base:'./',
  resolve:{alias:{'@':root}},
  publicDir:'public',
  plugins:[react(),{name:'copy-game-assets',closeBundle(){mkdirSync(`${root}/playable/textures`,{recursive:true});cpSync(`${root}/public/textures`,`${root}/playable/textures`,{recursive:true});cpSync(`${root}/public/favicon.svg`,`${root}/playable/favicon.svg`);}}],
  build:{outDir:'playable',copyPublicDir:false,emptyOutDir:true,chunkSizeWarningLimit:1500},
});
