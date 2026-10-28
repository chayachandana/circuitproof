import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {app} from '../server.mjs';
import {example} from '../src/circuits.js';
async function request({body=JSON.stringify({circuit:example('divider')}),headers={},method='POST'}={},agent=async()=>({verified:true})){
  const req=Readable.from([Buffer.from(body)]);Object.assign(req,{url:'/api/investigate',method,headers:{host:'localhost:5180',origin:'http://localhost:5180','content-type':'application/json',...headers}});
  return new Promise(resolve=>app({agent}).emit('request',req,{writeHead(status){this.status=status;},end(body){resolve({status:this.status,body:JSON.parse(body)});}}));
}
test('valid circuit reaches agent with measurements kept server-side',async()=>{const r=await request({},async c=>{assert.equal(c.id,'divider');return {verified:true};});assert.equal(r.status,200);});
test('cross-origin calls are blocked before paid use',async()=>{const r=await request({headers:{origin:'https://elsewhere.example'}},()=>assert.fail('unexpected call'));assert.equal(r.status,403);});
test('invalid circuit and JSON never reach agent',async()=>{for(const body of ['{','{"circuit":{}}']){const r=await request({body},()=>assert.fail('unexpected call'));assert.equal(r.status,400);}});
test('internal exception text is not exposed',async()=>{const r=await request({},()=>{throw Error('private configuration');});assert.equal(r.status,502);assert.doesNotMatch(JSON.stringify(r),/private configuration/);});
