import {examples,example} from '/circuits.js';
import {solve,change} from '/solver.js';
const el=id=>document.getElementById(id);
let circuit=example('branches'),revision=0,proposal=null,ready=false,busy=false,faultIndex=0;
const notebook=[];
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function svg(tag,attributes,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attributes))e.setAttribute(key,value);if(text)e.textContent=text;return e;}
function record(label,data){notebook.push({time:new Date().toISOString(),label,circuit:structuredClone(circuit),...data});el('journal').replaceChildren(...notebook.slice(-8).reverse().map(item=>node('li',`${item.label} · ${item.circuit.name} · ${item.result?.passes?'targets met':item.result?'target not met':item.experiments+' experiments'}`)));}
function invalidate(){revision++;proposal=null;el('proposal').hidden=true;el('apply').hidden=true;el('readings').replaceChildren(node('p','Circuit changed. Run a new simulation.'));el('outcome').textContent='NOT RUN';el('message').textContent='';el('error').textContent='';}
function draw(result){
  const picture=el('diagram');picture.replaceChildren();
  for(const p of circuit.parts){
    const [x1,y1]=circuit.layout[p.a],[x2,y2]=circuit.layout[p.b],x=(x1+x2)/2,y=(y1+y2)/2;
    picture.append(svg('line',{x1,y1,x2,y2,stroke:p.enabled===false?'#765a48':'#8aab91','stroke-width':3,'stroke-dasharray':p.enabled===false?'7 7':'none'}));
    const lit=p.type==='led'&&Math.abs(result?.currents[p.id]||0)>=0.003;
    picture.append(svg('rect',{x:x-35,y:y-18,width:70,height:36,rx:6,fill:lit?'#d1f794':'#1b2826',stroke:p.reversed?'#ffad78':'#b2c6ae','stroke-width':2}));
    picture.append(svg('text',{x,y:y+5,'text-anchor':'middle',fill:lit?'#142019':'#eff3e8','font-size':13,'font-family':'monospace'},p.id+(p.reversed?' ↶':'')));
    picture.append(svg('text',{x:x+45,y:y+4,fill:'#a2ada7','font-size':11,'font-family':'monospace'},p.type==='resistor'?`${p.value} Ω`:p.type==='led'?`${p.vf} V LED`:p.enabled===false?'open':'closed'));
  }
  for(const [name,[x,y]]of Object.entries(circuit.layout)){
    picture.append(svg('circle',{cx:x,cy:y,r:5,fill:'#d1f794'}));
    picture.append(svg('text',{x,y:y-15,'text-anchor':'middle',fill:'#edf1e7','font-size':13,'font-family':'monospace'},name==='V+'?`${circuit.supply} V`:name==='0'?'GROUND':name));
  }
}
function render(){
  el('description').textContent=circuit.description;draw();
  el('parts').replaceChildren(...circuit.parts.map(p=>{
    const row=node('div',undefined,'part-row');row.append(node('strong',p.id),node('small',`${p.a} → ${p.b} · ${p.type}`));
    if(p.type==='resistor'){
      const input=node('input');input.type='number';input.min='1';input.max='10000000';input.value=p.value;input.setAttribute('aria-label',p.id+' resistance in ohms');
      input.onchange=()=>{try{circuit=change(circuit,[{id:p.id,field:'value',value:Number(input.value)}]);invalidate();render();}catch(e){el('error').textContent=e.message;input.value=p.value;}};row.append(input);
    }else{
      const label=node('label'),input=node('input');input.type='checkbox';input.checked=p.type==='led'?Boolean(p.reversed):p.enabled!==false;
      label.append(input,document.createTextNode(p.type==='led'?' Reversed':' Closed'));input.onchange=()=>{circuit=change(circuit,[{id:p.id,field:p.type==='led'?'reversed':'enabled',value:input.checked}]);invalidate();render();};row.append(label);
    }
    return row;
  }));
}
function readings(result){
  el('outcome').textContent=result.passes?'TARGETS MET':'FAULT DETECTED';el('outcome').className='tag '+(result.passes?'pass':'fail');
  el('readings').replaceChildren(...result.goals.map(g=>{
    const row=node('div',undefined,'measurement');const unit=g.kind==='current'?'mA':'V',scale=g.kind==='current'?1000:1;
    row.append(node('span',`${g.id} · target ${(g.min*scale).toFixed(1)}–${(g.max*scale).toFixed(1)} ${unit}`),node('strong',`${(g.value*scale).toFixed(2)} ${unit} ${g.pass?'✓':'×'}`,g.pass?'pass':'fail'));return row;
  }));draw(result);
}
function simulate(label='Simulation'){try{const result=solve(circuit);readings(result);record(label,{result});el('error').textContent='';return result;}catch(e){el('error').textContent=e.message;}}
for(const c of examples){const option=node('option',c.name);option.value=c.id;el('example').append(option);}
el('example').onchange=()=>{circuit=example(el('example').value);invalidate();render();};
el('reset').onclick=()=>{circuit=example(el('example').value);invalidate();render();};
el('simulate').onclick=()=>simulate();
el('fault').onclick=()=>{
  circuit=example(el('example').value);
  if(circuit.id==='divider')circuit=change(circuit,[{id:'R1',field:'value',value:10000}]);
  else if(circuit.id==='switch')circuit=change(circuit,[{id:'SW1',field:'enabled',value:false}]);
  else{const faults=[[{id:'D1',field:'reversed',value:true}],[{id:'R2',field:'value',value:10000}],[{id:'D1',field:'reversed',value:true},{id:'R2',field:'value',value:22}]];circuit=change(circuit,faults[faultIndex++%faults.length]);}
  invalidate();render();simulate('Injected fault');
};
el('investigate').onclick=async()=>{
  if(!ready||busy)return;
  invalidate();const at=revision,snapshot=structuredClone(circuit);busy=true;el('investigate').disabled=true;el('message').textContent='Meta is testing hypotheses. This may take a minute…';
  try{
    const response=await fetch('/api/investigate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({circuit:snapshot})});const result=await response.json();
    if(at!==revision)return;if(!response.ok)throw Error(result.error||'Investigation failed.');
    readings(result.original);proposal={snapshot,edits:result.edits};el('explanation').textContent=result.explanation;
    el('trace').replaceChildren(...result.experiments.map((e,i)=>node('li',`Experiment ${i+1}: ${e.edits.map(x=>`${x.id}.${x.field} = ${x.value}`).join(', ')} → ${e.readings.passes?'all targets pass':'target failed'}`)));
    el('changes').textContent=result.edits.length?result.edits.map(e=>`${e.id}: set ${e.field} to ${e.value}`).join('\n'):'No correction needed.';
    el('proposal').hidden=false;el('apply').hidden=!result.edits.length;el('message').textContent=`Completed with ${result.model}. Circuit unchanged until you apply the repair.`;record('Meta investigation',{experiments:result.experiments.length});
  }catch(e){if(at===revision)el('message').textContent=e.message;}
  finally{busy=false;el('investigate').disabled=!ready;if(at!==revision)el('message').textContent='Circuit changed. Run a new investigation.';}
};
el('apply').onclick=()=>{
  try{
    if(!proposal||JSON.stringify(proposal.snapshot)!==JSON.stringify(circuit))throw Error('The circuit has changed. Investigate again.');
    const candidate=change(circuit,proposal.edits),check=solve(candidate);if(!check.passes)throw Error('Independent verification failed. Circuit unchanged.');
    circuit=candidate;invalidate();render();simulate('Verified repair');el('message').textContent='Repair applied. Every target passes the independent local calculation.';
  }catch(e){el('error').textContent=e.message;}
};
el('export').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify({project:'CircuitProof',modelLimits:solve(example('branches')).model,notebook},null,2)],{type:'application/json'}));const link=node('a');link.href=url;link.download='circuitproof-experiments.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
render();
fetch('/api/config').then(r=>{if(!r.ok)throw Error();return r.json();}).then(config=>{ready=config.ready;el('connection').textContent=ready?`${config.model} · key configured`:'Meta key not configured';el('investigate').disabled=!ready;if(!ready)el('message').textContent='The simulator works offline. Add your Meta key to .env to enable investigations.';}).catch(()=>{el('connection').textContent='Local server unavailable';});
