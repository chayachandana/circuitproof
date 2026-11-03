import {validate,solve,change} from './solver.js';

export function normalizeProject(value){
  validate(value);
  const nodes=[...new Set(value.parts.flatMap(p=>[p.a,p.b]))];
  const circuit={id:typeof value.id==='string'?value.id.slice(0,40):'custom',name:typeof value.name==='string'?value.name.slice(0,100):'Custom circuit',description:typeof value.description==='string'?value.description.slice(0,400):'Imported circuit',supply:value.supply,
    parts:value.parts.map(p=>Object.fromEntries(['id','type','a','b','value','vf','enabled','reversed'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))),
    goals:value.goals.map(g=>({kind:g.kind,id:g.id,min:g.min,max:g.max})),layout:{}};
  nodes.forEach((n,i)=>{const position=value.layout?.[n];circuit.layout[n]=Array.isArray(position)&&position.length===2&&position.every(v=>Number.isFinite(v)&&v>=20&&v<=620)?position:[60+(i%5)*130,70+Math.floor(i/5)*100];});
  solve(circuit);return circuit;
}
export function verifyProposal(circuit,result){
  if(!result||!Array.isArray(result.edits))throw Error('Invalid proposal.');
  const candidate=result.edits.length?change(circuit,result.edits):structuredClone(circuit);
  const verified=solve(candidate);
  if(!verified.passes)throw Error('The proposed correction does not meet every target.');
  if(result.edits.length&&!result.experiments?.some(e=>{try{return solve(change(circuit,e.edits)).passes&&JSON.stringify(change(circuit,e.edits).parts)===JSON.stringify(candidate.parts);}catch{return false;}}))throw Error('No passing experiment supports this correction.');
  return {candidate,verified};
}
export function notebookEntry(label,circuit,data={}){return {time:new Date().toISOString(),label,circuit:structuredClone(circuit),...structuredClone(data)};}
