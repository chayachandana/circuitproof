import {solve,change,validate} from './solver.js';
const definition=(name,description,properties,required)=>({type:'function',function:{name,description,parameters:{type:'object',properties,required,additionalProperties:false}}});
const edits={type:'array',minItems:1,maxItems:8,items:{type:'object',properties:{id:{type:'string'},field:{type:'string',enum:['value','enabled','reversed']},value:{anyOf:[{type:'number'},{type:'boolean'}]}},required:['id','field','value'],additionalProperties:false}};
const tools=[definition('experiment','Evaluate edits against the original circuit. This does not apply changes.',{edits},['edits']),definition('recommend','Finish with an explanation and edits. Edits must match a passing experiment. Empty edits allowed only if original goals pass.',{explanation:{type:'string'},edits:{...edits,minItems:0}},['explanation','edits'])];
export async function investigate(circuit,{key=globalThis.process?.env?.MODEL_API_KEY,model=globalThis.process?.env?.META_MODEL||'muse-spark-1.3',transport=fetch,onEvent=()=>{}}={}){
  validate(circuit);if(!key?.trim())throw Error('Add MODEL_API_KEY to the local .env file and restart the server.');
  const started=Date.now(),original=solve(circuit),experiments=[],usage={promptTokens:0,completionTokens:0,totalTokens:0};
  const complete=(explanation,edits,verified)=>{const result={model,explanation,edits,original,verified,experiments,elapsedMs:Date.now()-started,usage,source:'live'};onEvent({type:'complete',result});return result;};
  const messages=[{role:'developer',content:'You are CircuitProof, an engineering debugging agent. Diagnose this simulated DC circuit using experiment and recommend. Prefer small changes. Each experiment starts from the original. Supply and component endpoints are fixed. Meet every goal, not only the first. Disabled parts carry zero current. Reversed LEDs swap their terminals. Use only calculated results as evidence. Explain the faulty component and why your correction works. Claim simulation verification only, never physical verification. Finish using recommend; do not just write a text answer.'},{role:'user',content:JSON.stringify({circuit,original})}];
  const signal=AbortSignal.timeout(90000);let used=0;
  for(let turn=0;turn<5;turn++){
    onEvent({type:'progress',round:turn+1,message:`Meta request ${turn+1}: evaluating circuit evidence`});
    let response;
    try{response=await transport('https://api.meta.ai/v1/chat/completions',{method:'POST',signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages,tools,tool_choice:'auto',reasoning_effort:'low',max_completion_tokens:3000})});}catch{throw Error('Meta connection failed or timed out. No changes were applied.');}
    if(!response.ok)throw Error(`Meta request failed (HTTP ${response.status}). Check API access, credits, and model configuration.`);
    let payload;try{payload=await response.json();}catch{throw Error('Meta returned an unreadable response.');}
    usage.promptTokens+=payload.usage?.prompt_tokens||0;usage.completionTokens+=payload.usage?.completion_tokens||0;usage.totalTokens+=payload.usage?.total_tokens||0;
    if(payload.choices?.[0]?.finish_reason==='length')throw Error('Meta reached the per-request output budget. No repair was applied.');
    const message=payload.choices?.[0]?.message;
    if(!message||message.tool_calls?.length>10)throw Error('Meta did not return a supported tool call.');
    if(!message.tool_calls?.length){messages.push({role:'assistant',content:message.content||''},{role:'user',content:'Use experiment to verify a correction, then finish with recommend. A prose-only answer cannot be applied.'});continue;}
    messages.push(message);
    for(const call of message.tool_calls){
      if(++used>10)throw Error('Experiment budget reached. No changes were applied.');
      let result;
      try{
        const args=JSON.parse(call.function.arguments);
        if(call.function.name==='experiment'){
          const candidate=change(circuit,args.edits),readings=solve(candidate);
          result={readings};experiments.push({edits:args.edits,candidate,readings});onEvent({type:'experiment',index:experiments.length,experiment:experiments.at(-1)});
        }else if(call.function.name==='recommend'){
          if(typeof args.explanation!=='string'||!args.explanation.trim()||args.explanation.length>2400||!Array.isArray(args.edits))throw Error('Supply a concise explanation and edits array.');
          if(!args.edits.length){if(!original.passes)throw Error('Original fails. Find a tested repair first.');return complete(args.explanation,[],original);}
          const candidate=change(circuit,args.edits),verified=solve(candidate);
          if(!verified.passes||!experiments.some(e=>e.readings.passes&&JSON.stringify(e.candidate)===JSON.stringify(candidate)))throw Error('Recommendation must match a passing experiment.');
          return complete(args.explanation,args.edits,verified);
        }else throw Error('Use experiment or recommend.');
      }catch(e){result={error:e.message};}
      messages.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(result)});
    }
  }
  throw Error('Request budget reached without a verified recommendation.');
}
