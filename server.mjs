import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {investigate} from './src/investigator.mjs';
import {validate} from './src/solver.js';
try{process.loadEnvFile(fileURLToPath(new URL('.env',import.meta.url)));}catch(e){if(e.code!=='ENOENT')throw e;}
const assets={'/':'web/index.html','/main.js':'web/main.js','/style.css':'web/style.css','/solver.js':'src/solver.js','/circuits.js':'src/circuits.js'};
const types={html:'text/html',js:'text/javascript',css:'text/css'};
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
export function app({agent=investigate}={}){
  let running=false;
  return http.createServer(async(req,res)=>{
    const host=req.headers.host||'';
    if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))return send(res,403,{error:'Local access only.'});
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/api/config'&&req.method==='GET')return send(res,200,{ready:Boolean(process.env.MODEL_API_KEY?.trim()),model:process.env.META_MODEL||'muse-spark-1.3'});
    if(path==='/api/investigate'){
      if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
      if(req.headers.origin!==`http://${host}`||req.headers['content-type']!=='application/json')return send(res,403,{error:'Use the local app to start an investigation.'});
      if(running)return send(res,429,{error:'One investigation is already running.'});
      running=true;
      try{
        const chunks=[];let size=0;
        for await(const chunk of req){size+=chunk.length;if(size>16000)throw Error('Circuit request too large.');chunks.push(chunk);}
        let circuit;
        try{circuit=JSON.parse(Buffer.concat(chunks).toString()).circuit;validate(circuit);}catch{send(res,400,{error:'Invalid circuit request.'});return;}
        const result=await agent(circuit);send(res,200,result);
      }catch(e){send(res,502,{error:e.message?.startsWith('Meta')||e.message?.includes('budget')||e.message?.startsWith('Add MODEL_API_KEY')?e.message:'Investigation failed. No changes applied.'});}
      finally{running=false;}
      return;
    }
    if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed.'});
    if(!Object.hasOwn(assets,path))return send(res,404,{error:'Not found.'});
    try{const bytes=await readFile(new URL(assets[path],import.meta.url));res.writeHead(200,{'Content-Type':types[assets[path].split('.').pop()]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);}catch{send(res,500,{error:'Asset unavailable.'});}
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const server=app();server.on('error',e=>{console.error(`Preview could not start: ${e.code}`);process.exitCode=1;});
  server.listen(Number(process.env.PORT)||5180,'127.0.0.1',()=>console.log(`CircuitProof Studio: http://127.0.0.1:${server.address().port}`));
}
