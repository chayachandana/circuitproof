import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createService} from './src/service.mjs';
try{process.loadEnvFile(fileURLToPath(new URL('.env',import.meta.url)));}catch(e){if(e.code!=='ENOENT')throw e;}
const assets={'/':'web/index.html','/main.js':'web/main.js','/style.css':'web/style.css','/solver.js':'src/solver.js','/circuits.js':'src/circuits.js','/project.js':'src/project.js','/recording.json':'web/recording.json','/evaluation.json':'web/evaluation.json'};
export function app({agent,env=process.env}={}){
  const service=createService({env,agent});
  return http.createServer(async(req,res)=>{
    const host=req.headers.host||'';
    if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)){res.writeHead(403);res.end('{"error":"Local access only."}');return;}
    const path=new URL(req.url,'http://localhost').pathname;
    if(path.startsWith('/api/')){
      try{
        const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>20000){res.writeHead(413);res.end('{"error":"Circuit too large."}');return;}chunks.push(chunk);}
        const request=new Request(`http://${host}${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
        const response=await service(request);res.writeHead(response.status,Object.fromEntries(response.headers));
        if(response.body){const reader=response.body.getReader();for(;;){const {done,value}=await reader.read();if(done)break;res.write(value);}}res.end();
      }catch{res.writeHead(500);res.end('{"error":"Unable to process request."}');}return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    if(!Object.hasOwn(assets,path)){res.writeHead(404);res.end();return;}
    try{const file=assets[path],body=await readFile(new URL(file,import.meta.url));res.writeHead(200,{'Content-Type':({'html':'text/html','js':'text/javascript','css':'text/css','json':'application/json'})[file.split('.').pop()]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(req.method==='HEAD'?undefined:body);}catch{res.writeHead(404);res.end();}
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const server=app();server.on('error',e=>{console.error(`Preview could not start: ${e.code}`);process.exitCode=1;});server.listen(Number(process.env.PORT)||5180,'127.0.0.1',()=>console.log(`CircuitProof Studio: http://127.0.0.1:${server.address().port}`));
}
