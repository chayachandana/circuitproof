import {test} from 'node:test';import assert from 'node:assert/strict';
import {examples,example} from '../src/circuits.js';import {change} from '../src/solver.js';import {normalizeProject,verifyProposal} from '../src/project.js';
test('every supplied circuit meets its reference targets',()=>{for(const c of examples)assert.doesNotThrow(()=>verifyProposal(c,{edits:[]}));});
test('import supplies safe layout and strips unsupported metadata',()=>{const c=example('divider');delete c.layout;c.extra='ignored';const out=normalizeProject(c);assert.equal(out.extra,undefined);assert.equal(out.layout.S.length,2);});
test('client verification rejects a forged passing result',()=>{const c=change(example('divider'),[{id:'R1',field:'value',value:10000}]);assert.throws(()=>verifyProposal(c,{edits:[],verified:{passes:true}}));});
test('client verifies experiment calculations, not a reported pass flag',()=>{const c=change(example('divider'),[{id:'R1',field:'value',value:10000}]);assert.throws(()=>verifyProposal(c,{edits:[{id:'R1',field:'value',value:1000}],experiments:[{edits:[{id:'R1',field:'value',value:9000}],readings:{passes:true}}]}));});
