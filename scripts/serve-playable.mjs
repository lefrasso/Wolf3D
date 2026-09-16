// No installed dependencies required; Node.js serves the prebuilt game locally.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../playable/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.zip':'application/zip'};
const port=Number(process.env.GAME_PORT)||8080;
const server=createServer(async(req,res)=>{
  try{const url=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(url.pathname);if(pathname==='/downloads/wolf3d-hd-project.zip'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});res.end('Ya estás usando el proyecto descargado. El código, PRD y ADR están en la carpeta del proyecto.');return;}
    const file=path.resolve(root,pathname==='/'?'index.html':'.'+pathname);if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end('Forbidden');return;}
    const s=await stat(file);if(!s.isFile())throw Error('not a file');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(bytes);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('No encontrado. Verificá que exista la carpeta playable/.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`WOLF3D listo: http://localhost:${port}\nCtrl+C para cerrar.`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`El puerto ${port} está ocupado. Cerrá la otra instancia o cambiá GAME_PORT.`:e.message);process.exit(1);});
