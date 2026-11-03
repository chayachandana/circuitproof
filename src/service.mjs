import {investigate} from './investigator.mjs';
import {normalizeProject} from './project.js';

export function createService({env={},agent=investigate,clock=Date.now}={}){
  let running=0;const attempts=new Map();
  const json=(status,value)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  const protectedMode=Boolean(env.DEMO_ACCESS_CODE)||env.HOSTED==='1';
  const ready=Boolean(env.MODEL_API_KEY?.trim())&&(!protectedMode||Boolean(env.DEMO_ACCESS_CODE));
  return async function service(request){
    const path=new URL(request.url).pathname;
    if(path==='/api/config'&&request.method==='GET')return json(200,{ready,protected:protectedMode,model:env.META_MODEL||'muse-spark-1.3',limits:{requests:5,tools:10,seconds:90}});
    if(path!=='/api/investigate')return json(404,{error:'Not found.'});
    if(request.method!=='POST')return json(405,{error:'Use POST.'});
    if(request.headers.get('Origin')!==new URL(request.url).origin)return json(403,{error:'Open the app in your browser to investigate.'});
    if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json(415,{error:'Send a JSON circuit.'});
    if(!ready)return json(503,{error:'Live AI is not configured. You can still simulate circuits or replay the recorded demo.'});
    if(protectedMode&&request.headers.get('Authorization')!==`Bearer ${env.DEMO_ACCESS_CODE}`)return json(401,{error:'Enter the demo access code to start a live investigation. This is not your Meta API key.'});
    const ip=request.headers.get('CF-Connecting-IP')||'local',now=clock();
    for(const [key,value]of attempts)if(now-value.start>600000)attempts.delete(key);
    const slot=attempts.get(ip)||{start:now,count:0};
    if(slot.count>=4||running>=1)return json(429,{error:'Investigation limit reached. Wait a few minutes before retrying.'});
    let circuit;
    try{const text=await request.text();if(text.length>20000)return json(413,{error:'Circuit is too large (20 KB maximum).'});circuit=normalizeProject(JSON.parse(text).circuit);}catch{return json(400,{error:'Invalid circuit. Check components, goals, and values.'});}
    slot.count++;attempts.set(ip,slot);running++;
    const safeError=e=>/^(Meta|Request budget|Experiment budget)/.test(e?.message||'')?e.message:'Investigation failed. No circuit changes were applied.';
    if(request.headers.get('Accept')==='application/x-ndjson'){
      const encoder=new TextEncoder();let cancelled=false;
      const stream=new ReadableStream({
        start(controller){
          const emit=event=>{if(!cancelled){try{controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));}catch{cancelled=true;}}};
          Promise.resolve().then(()=>agent(circuit,{key:env.MODEL_API_KEY,model:env.META_MODEL||'muse-spark-1.3',onEvent:emit})).then(result=>{emit({type:'result',result});}).catch(e=>emit({type:'error',message:safeError(e)})).finally(()=>{running--;if(!cancelled)controller.close();});
        },cancel(){cancelled=true;}
      });
      return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    try{return json(200,await agent(circuit,{key:env.MODEL_API_KEY,model:env.META_MODEL||'muse-spark-1.3'}));}
    catch(e){return json(502,{error:safeError(e)});}finally{running--;}
  };
}
