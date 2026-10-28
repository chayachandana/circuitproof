const ledGoal=id=>({kind:'current',id,min:0.003,max:0.015});
export const examples=[
  {id:'branches',name:'Two independent LED branches',description:'Both LEDs should light at 3–15 mA. Each branch has its own resistor.',supply:5,
    parts:[{id:'R1',type:'resistor',a:'V+',b:'A',value:330},{id:'D1',type:'led',a:'A',b:'0',vf:2},{id:'R2',type:'resistor',a:'V+',b:'B',value:330},{id:'D2',type:'led',a:'B',b:'0',vf:2}],goals:[ledGoal('D1'),ledGoal('D2')],
    layout:{'V+':[320,60],A:[180,230],B:[460,230],'0':[320,390]}},
  {id:'divider',name:'Sensor voltage divider',description:'The sensor input at S should stay between 2.3 and 2.7 volts.',supply:5,
    parts:[{id:'R1',type:'resistor',a:'V+',b:'S',value:1000},{id:'R2',type:'resistor',a:'S',b:'0',value:1000}],goals:[{kind:'voltage',id:'S',min:2.3,max:2.7}],layout:{'V+':[320,60],S:[320,230],'0':[320,390]}},
  {id:'switch',name:'Switched indicator',description:'A closed switch should complete the LED path at 3–15 mA.',supply:5,
    parts:[{id:'R1',type:'resistor',a:'V+',b:'A',value:330},{id:'D1',type:'led',a:'A',b:'B',vf:2},{id:'SW1',type:'switch',a:'B',b:'0',enabled:true}],goals:[ledGoal('D1')],layout:{'V+':[320,50],A:[180,180],B:[460,180],'0':[320,380]}}
];
export function example(id){return structuredClone(examples.find(c=>c.id===id)||examples[0]);}
