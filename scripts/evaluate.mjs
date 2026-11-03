import {readFile,writeFile,mkdir} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {example} from '../src/circuits.js';import {change,solve} from '../src/solver.js';import {investigate} from '../src/investigator.mjs';import {verifyProposal} from '../src/project.js';
try{process.loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url)));}catch(e){if(e.code!=='ENOENT')throw e;}
const cases=[
 {name:'reversed LED',id:'branches',edits:[{id:'D1',field:'reversed',value:true}]},
 {name:'two interacting faults',id:'branches',edits:[{id:'D1',field:'reversed',value:true},{id:'R2',field:'value',value:22}]},
 {name:'dim second branch',id:'branches',edits:[{id:'R2',field:'value',value:15000}]},
 {name:'sensor divider ratio',id:'divider',edits:[{id:'R1',field:'value',value:6800}]},
 {name:'open switch',id:'switch',edits:[{id:'SW1',field:'enabled',value:false}]},
 {name:'series polarity fault',id:'series',edits:[{id:'D2',field:'reversed',value:true}]},
 {name:'loaded divider faults',id:'loaded',edits:[{id:'R1',field:'value',value:1500},{id:'RL',field:'value',value:100}]},
 {name:'healthy circuit control',id:'divider',edits:[]}
];
const live=process.argv.includes('--live'),results=[];
for(const test of cases){const c=test.edits.length?change(example(test.id),test.edits):example(test.id);const baseline=solve(c);
 if(!live){results.push({name:test.name,detected:!baseline.passes,expectedFault:Boolean(test.edits.length)});continue;}
 const start=Date.now();try{const result=await investigate(c);verifyProposal(c,result);results.push({name:test.name,passed:true,elapsedMs:Date.now()-start,experiments:result.experiments.length,tokens:result.usage.totalTokens,circuit:c,result});console.log(`PASS · ${test.name} · ${result.experiments.length} experiments`);}catch(e){results.push({name:test.name,passed:false,elapsedMs:Date.now()-start,error:e.message});console.log(`FAIL · ${test.name} · ${e.message}`);}
}
const summary={date:new Date().toISOString().slice(0,10),model:process.env.META_MODEL||'muse-spark-1.3',mode:live?'live':'offline',total:results.length,passed:results.filter(r=>live?r.passed:r.detected===r.expectedFault).length,description:live?'One run per case on eight predefined circuits/fault configurations, including one healthy control. No automatic retries. Repairs independently checked. This small development set is not a held-out benchmark.':'Offline solver check only; no new model calls. All seeded faults and the healthy control checked against their targets.',cases:results.map(({result,circuit,...rest})=>rest)};
await mkdir(new URL('../work/',import.meta.url),{recursive:true});await writeFile(new URL('../work/evaluation-full.json',import.meta.url),JSON.stringify({summary,results},null,2));
await writeFile(new URL('../web/evaluation.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));if(summary.passed<summary.total)process.exitCode=1;
