// Nodal DC analysis with an enumerated piecewise-linear LED model.
// LEDs have a fixed threshold plus 10 Ω dynamic resistance; switches use 0.01 Ω.
// A 1 pS conductance to ground regularizes otherwise floating nodes.
export function validate(c){
  if(!c||!Number.isFinite(c.supply)||c.supply<0.1||c.supply>12||!Array.isArray(c.parts)||!c.parts.length||c.parts.length>24||!Array.isArray(c.goals)||!c.goals.length||c.goals.length>8)throw Error('Circuit requires a 0.1–12 V supply, 1–24 parts, and 1–8 goals.');
  const ids=new Set(),nodes=new Set(['V+','0']);
  for(const p of c.parts){
    if(!p||typeof p.id!=='string'||!/^[A-Za-z0-9_]{1,20}$/.test(p.id)||ids.has(p.id))throw Error('Part IDs must be unique simple names.');ids.add(p.id);
    for(const n of [p.a,p.b]){if(typeof n!=='string'||!/^([A-Za-z0-9_+-]{1,20})$/.test(n))throw Error('Invalid node name.');nodes.add(n);}
    if(p.a===p.b||!['resistor','led','switch'].includes(p.type)||p.enabled!==undefined&&typeof p.enabled!=='boolean'||p.reversed!==undefined&&typeof p.reversed!=='boolean')throw Error('Invalid component.');
    if(p.type==='resistor'&&(!Number.isFinite(p.value)||p.value<1||p.value>1e7))throw Error('Resistance must be 1–10,000,000 Ω.');
    if(p.type==='led'&&(!Number.isFinite(p.vf)||p.vf<1||p.vf>4))throw Error('LED forward voltage must be 1–4 V.');
  }
  if(nodes.size>20||c.parts.filter(p=>p.type==='led').length>6)throw Error('Maximum 20 nodes and 6 LEDs.');
  for(const g of c.goals){if(!g||!['current','voltage'].includes(g.kind)||!Number.isFinite(g.min)||!Number.isFinite(g.max)||g.min>g.max||g.kind==='current'&&!ids.has(g.id)||g.kind==='voltage'&&!nodes.has(g.id))throw Error('Invalid goal.');}
  return c;
}
function linear(matrix,rhs){
  const a=matrix.map((r,i)=>[...r,rhs[i]]),n=a.length;
  for(let k=0;k<n;k++){
    let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;
    if(Math.abs(a[pivot][k])<1e-16)throw Error('Unable to solve circuit.');
    [a[k],a[pivot]]=[a[pivot],a[k]];
    const d=a[k][k];for(let j=k;j<=n;j++)a[k][j]/=d;
    for(let i=0;i<n;i++)if(i!==k){const m=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=m*a[k][j];}
  }
  return a.map(r=>r[n]);
}
export function solve(input){
  const c=validate(input),diodes=c.parts.filter(p=>p.type==='led'&&p.enabled!==false);
  const unknown=[...new Set(c.parts.flatMap(p=>[p.a,p.b]))].filter(n=>n!=='V+'&&n!=='0');
  const idx=new Map(unknown.map((n,i)=>[n,i]));
  for(let mask=0;mask<2**diodes.length;mask++){
    const on=new Set(diodes.filter((_,i)=>mask&(1<<i)).map(p=>p.id));
    const rows=unknown.map((_,i)=>unknown.map((__,j)=>i===j?1e-12:0)),rhs=unknown.map(()=>0),known={'0':0,'V+':c.supply};
    const edges=c.parts.map(p=>{
      let a=p.a,b=p.b;if(p.type==='led'&&p.reversed)[a,b]=[b,a];
      const active=p.enabled!==false&&(p.type!=='led'||on.has(p.id));
      return {id:p.id,a,b,g:!active?0:p.type==='resistor'?1/p.value:p.type==='switch'?100:0.1,e:p.type==='led'?p.vf:0};
    });
    for(const e of edges){
      for(const [n,other,sign] of [[e.a,e.b,1],[e.b,e.a,-1]]){
        if(!idx.has(n))continue;const i=idx.get(n);rows[i][i]+=e.g;
        if(idx.has(other))rows[i][idx.get(other)]-=e.g;else rhs[i]+=e.g*known[other];
        rhs[i]+=sign*e.g*e.e;
      }
    }
    const values=linear(rows,rhs),volts={...known,...Object.fromEntries(unknown.map((n,i)=>[n,values[i]]))};
    if(diodes.some(p=>{const e=edges.find(e=>e.id===p.id),delta=volts[e.a]-volts[e.b]-p.vf;return on.has(p.id)?delta < -1e-7:delta>1e-7;}))continue;
    const currents=Object.fromEntries(edges.map(e=>[e.id,e.g*(volts[e.a]-volts[e.b]-e.e)]));
    const goals=c.goals.map(g=>{const value=g.kind==='voltage'?volts[g.id]:Math.abs(currents[g.id]);return {...g,value,pass:value>=g.min-1e-9&&value<=g.max+1e-9};});
    return {volts,currents,goals,passes:goals.every(g=>g.pass),model:'Piecewise DC: LED threshold + 10 Ω, switch 0.01 Ω, 1 pS grounding. No transients, breakdown, or tolerances.'};
  }
  throw Error('No consistent LED operating state found.');
}
export function change(c,edits){
  if(!Array.isArray(edits)||!edits.length||edits.length>8)throw Error('Provide 1–8 component edits.');
  const copy=structuredClone(c);
  for(const edit of edits){
    const p=copy.parts.find(p=>p.id===edit.id);
    if(!p||!['value','enabled','reversed'].includes(edit.field)||edit.field==='value'&&p.type!=='resistor'||edit.field==='reversed'&&p.type!=='led'||edit.field!=='value'&&typeof edit.value!=='boolean')throw Error('Unsupported component edit.');
    p[edit.field]=edit.value;
  }
  validate(copy);return copy;
}
