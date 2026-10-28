import {fileURLToPath} from 'node:url';
import {writeFile,mkdir} from 'node:fs/promises';
import {example} from '../src/circuits.js';
import {solve,change} from '../src/solver.js';
import {investigate} from '../src/investigator.mjs';

// The default check is offline. --live explicitly opts into one paid investigation.
try { process.loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url))); }
catch(error) { if(error.code!=='ENOENT') throw error; }
const live=process.argv.includes('--live');
const model=process.env.META_MODEL||'muse-spark-1.3';
const configured=Boolean(process.env.MODEL_API_KEY?.trim());
const check=(condition,message)=>{if(!condition)throw Error(message);};

try {
  check(Number(process.versions.node.split('.')[0])>=22,'Node.js 22 or newer is required.');
  console.log('PASS · Node runtime');
  for(const id of ['branches','divider','switch']) {
    check(solve(example(id)).passes,`${id}: reference circuit did not meet its targets.`);
  }
  const fault=change(example('branches'),[
    {id:'D1',field:'reversed',value:true},
    {id:'R2',field:'value',value:22}
  ]);
  check(!solve(fault).passes,'Combined fault was not detected.');
  const repaired=change(fault,[
    {id:'D1',field:'reversed',value:false},
    {id:'R2',field:'value',value:330}
  ]);
  check(solve(repaired).passes,'Known correction did not meet its targets.');
  console.log('PASS · All reference circuits and combined-fault verification');
  console.log(configured?'READY · Meta key is present (not authenticated yet)':'PENDING · Add MODEL_API_KEY to .env for live investigations');
  if(!live) {
    console.log('Offline check complete. No network requests or API credits used.');
    console.log('When ready, run npm run verify:live for one Meta investigation.');
  } else {
    check(configured,'Live check needs MODEL_API_KEY in the local .env file.');
    console.log(`Starting one combined-fault investigation with ${model}.`);
    const start=Date.now();
    const result=await investigate(fault);
    check(result.edits.length>0,'Meta returned no correction for the failing circuit.');
    const independent=solve(change(fault,result.edits));
    check(independent.passes,'Independent verification rejected the proposed correction.');
    check(result.experiments.some(e=>e.readings.passes),'No passing experiment was recorded.');
    const report={time:new Date().toISOString(),model,elapsedMs:Date.now()-start,circuit:fault,result,independent};
    const directory=new URL('../work/',import.meta.url);
    await mkdir(directory,{recursive:true});
    await writeFile(new URL('live-verification.json',directory),JSON.stringify(report,null,2)+'\n');
    console.log(`PASS · Meta proposed a repair after ${result.experiments.length} experiments`);
    console.log('PASS · Independent calculation meets every goal');
    console.log('Evidence saved locally in work/live-verification.json.');
    console.log('This is one smoke test, not a benchmark or accuracy estimate.');
  }
} catch(error) {
  // Only known application errors are shown. Never serialize process.env or headers.
  console.error(`CHECK FAILED · ${error.message}`);
  process.exitCode=1;
}
