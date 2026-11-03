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
examples.push(
 {id:'series',name:'Two-LED series indicator',description:'Both LEDs share one current path. The target is 3–15 mA through each diode.',supply:9,parts:[{id:'R1',type:'resistor',a:'V+',b:'A',value:470},{id:'D1',type:'led',a:'A',b:'B',vf:2},{id:'D2',type:'led',a:'B',b:'0',vf:2}],goals:[ledGoal('D1'),ledGoal('D2')],layout:{'V+':[100,70],A:[520,70],B:[520,360],'0':[100,360]}},
 {id:'loaded',name:'Loaded sensor divider',description:'A sensor load changes the divider output. Keep S between 2.3 and 2.7 V while delivering 2–3 mA through the load.',supply:5,parts:[{id:'R1',type:'resistor',a:'V+',b:'S',value:500},{id:'R2',type:'resistor',a:'S',b:'0',value:1000},{id:'RL',type:'resistor',a:'S',b:'L',value:500},{id:'R3',type:'resistor',a:'L',b:'0',value:500}],goals:[{kind:'voltage',id:'S',min:2.3,max:2.7},{kind:'current',id:'RL',min:0.002,max:0.003}],layout:{'V+':[110,60],S:[320,190],L:[530,270],'0':[110,400]}}
);
export function example(id){return structuredClone(examples.find(c=>c.id===id)||examples[0]);}
