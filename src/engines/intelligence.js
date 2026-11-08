/* STRATOS System Dynamics & Strategic Intelligence.
   Transparent heuristic layer: resource/constraint/dependency dynamics, diagnostics and controlled comparisons. */
(function(root){
"use strict";
const clamp=n=>Math.max(0,Math.min(10,Number(n)||0));
const list=(m,k)=>Array.isArray(m&&m[k])?m[k]:[];
const parseEffects=(raw,variables)=>{const out={};String(raw||"").split(/[,;\n]+/).forEach(part=>{const x=part.trim().match(/^([^:]+):\s*([+-]?\d+(?:\.\d+)?)$/);if(!x)return;const v=variables.find(v=>v.id===x[1].trim()||String(v.name||"").toLowerCase()===x[1].trim().toLowerCase());if(v)out[v.id]=Number(x[2]);});return out;};
function dependencyStatus(model,step,levels,resources){
 const variables=list(model,"variables"),actors=list(model,"actors");
 return list(model,"dependencies").map(d=>{
  const start=Math.max(1,Number(d.when)||1);let actual=null,expected=Number(d.threshold??5),exists=true,label="";
  if(d.fromType==="variable"){const v=variables.find(x=>x.id===d.fromId);exists=!!v;actual=v?Number(levels[v.id]??v.level??5):null;label=v?.name||"Missing variable";}
  else if(d.fromType==="resource"){const r=resources.find(x=>x.id===d.fromId);exists=!!r;actual=r?Number(r.level):null;label=r?.name||"Missing resource";}
  else if(d.fromType==="actor"){const a=actors.find(x=>x.id===d.fromId);exists=!!a;actual=a?clamp(a.capability??a.capacity??5):null;label=a?.name||"Missing actor";}
  else if(d.fromType==="constraint"){const c=list(model,"constraints").find(x=>x.id===d.fromId);exists=!!c;actual=c?(!c.disabled&&(Number(c.when)||1)<=step&&(c.until===undefined||c.until===""||step<=Number(c.until))?1:0):null;label=c?.name||"Missing constraint";}
  const op=d.operator||"gte",passed=exists&&step>=start&&(op==="lte"?actual<=expected:op==="gt"?actual>expected:op==="lt"?actual<expected:actual>=expected);
  return {id:d.id,name:d.name||"Dependency",step,fromType:d.fromType||"variable",from:label,actual,operator:op,threshold:expected,passed,hard:d.hard!==false,requiredBy:d.requiredBy||"",reason:!exists?"Source record is missing":step<start?"Not active yet":passed?"Prerequisite satisfied":"Prerequisite not satisfied"};
 });
}
function enhance(model,run,options){
 const m=model||{},variables=list(m,"variables"),constraints=list(m,"constraints"),resources=list(m,"resources"),dependencies=list(m,"dependencies");
 const levels={...(run.finalLevels||{})},resourceState={};
 resources.forEach(r=>resourceState[r.id]=Math.max(0,Number(r.initial??r.level??r.capacity??0)));
 const constraintOut=[],resourceOut=[],dependencyOut=[],stepSnapshots=[];
 const timeline=(run.timeline||[]).map(x=>({...x,levels:{...(x.levels||{})}}));
 let previousBase=null,previousEnhanced=null;
 const chosen=list(m,"decisions").find(x=>x.id===run.decision);
 const initialLevels={};variables.forEach(v=>initialLevels[v.id]=clamp(v.level??5));
 const dependencyAtStart=dependencyStatus(m,1,initialLevels,resources.map(r=>({...r,level:resourceState[r.id]})));
 const blocked=run._blockedPrerequisites||dependencyAtStart.filter(x=>x.hard&&!x.passed&&(!x.requiredBy||x.requiredBy===run.decision));
 delete run._blockedPrerequisites;
 if(blocked.length){run.warnings.push("Strategy blocked by unmet hard prerequisite(s): "+blocked.map(x=>x.name).join(", ")+". Direct strategy effects were suppressed; actor and environmental dynamics still run.");run.blockedPrerequisites=blocked;}
 timeline.forEach((snap,index)=>{
  const step=snap.step||index+1, baseState={...snap.levels};
  const state=previousBase&&previousEnhanced?Object.fromEntries(Object.keys(baseState).map(id=>[id,clamp(Number(previousEnhanced[id]??baseState[id])+Number(baseState[id])-Number(previousBase[id]??baseState[id]))])):{...baseState};
  resources.forEach(r=>{
   const before=resourceState[r.id],baseCapacity=Math.max(0,Number(r.capacity??r.initial??r.level??10)),capacity=baseCapacity+Math.max(0,Number(r.capacityGrowthPerStep)||0)*(step-1),replenishment=Math.max(0,Number(r.replenishmentPerStep??0));
   const claims=String(r.allocationClaims||"").split(/[;,\n]+/).map(part=>{const p=part.trim().split(":");const ref=p[0].trim(),actor=list(m,"actors").find(a=>a.id===ref||String(a.name||"").toLowerCase()===ref.toLowerCase());return p.length>=2?{actorId:actor?.id||ref,actorName:actor?.name||ref,requested:Math.max(0,Number(p[1])||0),priority:Number(p[2])||0}:null;}).filter(x=>x&&x.actorId&&x.requested>0);
   const requested=claims.length?claims.reduce((n,x)=>n+x.requested,0):Math.max(0,Number(r.consumptionPerStep??0)),used=Math.min(before,requested),shortfall=requested>before;
   let allocations=[];
   if(claims.length){if(r.allocationMode==="priority"){let remaining=used;claims.slice().sort((a,b)=>b.priority-a.priority).forEach(c=>{const amount=Math.min(remaining,c.requested);allocations.push({actorId:c.actorId,actorName:c.actorName,requested:c.requested,allocated:amount,priority:c.priority});remaining-=amount;});}else allocations=claims.map(c=>({actorId:c.actorId,actorName:c.actorName,requested:c.requested,allocated:requested?used*c.requested/requested:0,priority:c.priority}));}
   const after=Math.min(capacity,Math.max(0,before-used+replenishment));resourceState[r.id]=after;
   const ratio=capacity>0?after/capacity:0,linked=variables.find(v=>v.id===r.linkedVariableId);
   if(linked&&r.exhaustionEffect!==undefined&&ratio<1){const effect=Number(r.exhaustionEffect)*(1-ratio);state[linked.id]=clamp(Number(state[linked.id]??5)+effect);}
   const effectMap=parseEffects(r.effects,variables),applied={};
   Object.entries(effectMap).forEach(([id,amount])=>{const actual=amount*(capacity?ratio:0);state[id]=clamp(Number(state[id]??5)+actual);applied[id]=Number(actual.toFixed(3));});
   const netRecovery=replenishment-requested,recoverySteps=after>=capacity?0:netRecovery>0?Math.ceil((capacity-after)/netRecovery):null;
   resourceOut.push({id:r.id,name:r.name||"Resource",step,before,requested,consumed:used,replenished:replenishment,after,capacity,capacityGrowthPerStep:Number(r.capacityGrowthPerStep)||0,utilization:capacity?Number((1-after/capacity).toFixed(3)):0,shortfall,allocations,recoverySteps,applied});
  });
  constraints.filter(c=>!c.disabled&&(Number(c.when)||1)<=step&&(c.until===undefined||c.until===""||step<=Number(c.until))).forEach(c=>{
   const trigger=variables.find(v=>v.id===c.triggerVariable),value=trigger?Number(state[trigger.id]??5):null,threshold=Number(c.triggerThreshold??5),op=c.triggerOperator||"gte";
   const triggered=!trigger||(op==="lte"?value<=threshold:op==="gt"?value>threshold:op==="lt"?value<threshold:value>=threshold);
   const effectMap=parseEffects(c.effects,variables),applied={};
   if(triggered){Object.entries(effectMap).forEach(([id,amount])=>{const severity=clamp(c.severity??5)/10,scale=c.hardness==="hard"?1:severity;const actual=amount*scale;state[id]=clamp(Number(state[id]??5)+actual);applied[id]=Number(actual.toFixed(3));});if(c.targetVariable&&state[c.targetVariable]!==undefined&&Number.isFinite(Number(c.limitValue))){const before=state[c.targetVariable];state[c.targetVariable]=c.limitMode==="floor"?Math.max(before,Number(c.limitValue)):Math.min(before,Number(c.limitValue));applied[c.targetVariable]=Number((state[c.targetVariable]-before).toFixed(3));}}
   constraintOut.push({id:c.id,name:c.name||"Constraint",step,triggered,hardness:c.hardness||"soft",severity:clamp(c.severity??5),applied,reason:triggered?"Constraint active; declared effects applied":"Activation condition not met"});
  });
  const dep=dependencyStatus(m,step,state,resources.map(r=>({...r,level:resourceState[r.id]})));dependencyOut.push(...dep);
  const missing=dep.filter(x=>x.hard&&!x.passed&&(!x.requiredBy||x.requiredBy===run.decision));
  if(missing.length&&chosen)run.warnings.push("Unmet prerequisite at step "+step+": "+missing.map(x=>x.name).join(", ")+".");
  snap.levels=state;previousBase=baseState;previousEnhanced={...state};stepSnapshots.push({step,levels:{...state},resources:resources.map(r=>({id:r.id,level:resourceState[r.id]})),activeConstraints:constraintOut.filter(x=>x.step===step&&x.triggered).map(x=>x.name),unmetDependencies:missing.map(x=>x.name)});
 });
 Object.assign(run.finalLevels,stepSnapshots.length?stepSnapshots[stepSnapshots.length-1].levels:levels);
 let weighted=0,weight=0;variables.forEach(v=>{const polarity=v.direction==="positive"?1:v.direction==="negative"?-1:0,w=Math.max(0,Number(v.importance)||1)*({low:.55,medium:.8,high:1}[v.confidence]||.6);weighted+=(Number(run.finalLevels[v.id]??5)-5)*polarity*w;weight+=w;});run.score=weight?Math.round(Math.max(0,Math.min(100,50+weighted/(weight*5)*50))):50;run.low=Math.min(run.low,run.score);run.high=Math.max(run.high,run.score);
 run.timeline=timeline;
 run.steps=timeline.map(x=>({step:x.step,label:x.label,note:"State snapshot: "+variables.map(v=>v.name+" "+Number(x.levels[v.id]??5).toFixed(1)).join("; ")}));
 run.constraints=constraintOut;run.resources=resourceOut;run.dependencies=dependencyOut;run.intelligenceTimeline=stepSnapshots;
 if(constraints.length||resources.length||dependencies.length)run.notes.push("System dynamics layer applied "+constraints.length+" constraint(s), "+resources.length+" resource(s), and "+dependencies.length+" dependency record(s).");
 return run;
}
function analyze(model){
 const m=model||{},variables=list(m,"variables"),links=list(m,"links"),constraints=list(m,"constraints"),resources=list(m,"resources"),dependencies=list(m,"dependencies"),decisions=list(m,"decisions"),actors=list(m,"actors");
 const incoming={},outgoing={};variables.forEach(v=>{incoming[v.id]=[];outgoing[v.id]=[];});
 links.forEach(l=>{if(outgoing[l.from])outgoing[l.from].push(l);if(incoming[l.to])incoming[l.to].push(l);});
 const leverage=variables.map(v=>{const out=outgoing[v.id]||[],inn=incoming[v.id]||[],score=out.reduce((n,l)=>n+Math.max(0,Number(l.strength)||1),0)+inn.reduce((n,l)=>n+Math.max(0,Number(l.strength)||1)*.5,0);return {id:v.id,name:v.name||"Unnamed variable",outgoing:out.length,incoming:inn.length,leverage:Number(score.toFixed(2)),evidence:v.evidenceStatus||"unspecified",confidence:v.confidence||"unspecified"};}).sort((a,b)=>b.leverage-a.leverage);
 const secondOrder=[];links.forEach(a=>links.filter(b=>b.from===a.to&&b.to!==a.from).forEach(b=>secondOrder.push({via:a.to,from:a.from,to:b.to,sign:a.sign==="negative"||b.sign==="negative"?"negative":"positive"})));
 const competingExplanations=variables.flatMap(v=>{const causes=incoming[v.id]||[];return causes.length>1?[{target:v.name||v.id,causes:causes.map(l=>({variable:variables.find(x=>x.id===l.from)?.name||l.from,sign:l.sign||"unspecified",strength:Number(l.strength)||1,reason:l.reason||""}))}]:[];});
 const feedbackLoops=[],seenLoops=new Set();
 const walkLoop=(start,current,path)=>{if(path.length>5)return;(outgoing[current]||[]).forEach(edge=>{if(edge.to===start&&path.length>1){const nodes=[...path,start],key=nodes.slice(0,-1).slice().sort().join("|");if(!seenLoops.has(key)){seenLoops.add(key);feedbackLoops.push({nodes:nodes.map(id=>variables.find(v=>v.id===id)?.name||id),length:path.length,kind:"directed feedback cycle"});}}else if(!path.includes(edge.to))walkLoop(start,edge.to,[...path,edge.to]);});};
 variables.forEach(v=>walkLoop(v.id,v.id,[v.id]));
 const indirectEffects=decisions.flatMap(d=>{const direct=parseEffects(d.effectText,variables);return Object.entries(direct).flatMap(([from,amount])=>(outgoing[from]||[]).map(link=>{const propagated=amount*(link.sign==="negative"?-1:1)*(Number(link.strength)||1);const target=variables.find(v=>v.id===link.to);const conflicts=target&&((target.direction==="positive"&&propagated<0)||(target.direction==="negative"&&propagated>0));return conflicts?{strategy:d.name,via:variables.find(v=>v.id===from)?.name||from,target:target.name||target.id,estimatedDirection:propagated<0?"negative":"positive",reason:"One declared causal step may move this variable against its desired direction"}:null;}).filter(Boolean));});

 const bottlenecks=[...resources.filter(r=>Number(r.initial??r.level??r.capacity??0)<Number(r.capacity??r.initial??10)*.35).map(r=>({type:"resource",id:r.id,name:r.name||"Unnamed resource",reason:"Low starting availability relative to capacity"})),...dependencies.filter(d=>d.hard!==false).map(d=>({type:"dependency",id:d.id,name:d.name||"Unnamed prerequisite",reason:"Hard prerequisite should be checked before the dependent action"})),...variables.filter(v=>(incoming[v.id]||[]).length===0&&(outgoing[v.id]||[]).length>0).map(v=>({type:"variable",id:v.id,name:v.name,reason:"Upstream variable with no modelled incoming cause"}))];
 const missing=[];if(!actors.length)missing.push({type:"coverage",question:"Which people or organizations can change the outcome but are missing?"});if(!constraints.length)missing.push({type:"constraints",question:"What can prevent, delay, limit or make the strategy more expensive?"});if(!resources.length)missing.push({type:"resources",question:"What scarce resources are consumed, replenished or shared?"});if(!dependencies.length)missing.push({type:"dependencies",question:"What must be true or happen before each important strategy can work?"});if(!links.length)missing.push({type:"causality",question:"What mechanisms connect an action to the outcome, including indirect effects?"});if(!list(m,"evidence").length)missing.push({type:"evidence",question:"Which important assumptions have real evidence, and what could disprove them?"});
 const unintended=decisions.flatMap(d=>{const direct=parseEffects(d.effectText,variables);return Object.entries(direct).filter(([id,amount])=>{const v=variables.find(x=>x.id===id);return v&&((v.direction==="positive"&&amount<0)||(v.direction==="negative"&&amount>0));}).map(([id,amount])=>({strategy:d.name,variable:variables.find(v=>v.id===id)?.name,effect:amount,reason:"Entered direct effect moves against the variable's declared desired direction"}));});
 return {leverage,bottlenecks,missing,secondOrder,competingExplanations,feedbackLoops,indirectEffects,unintended,coverage:{actors:actors.length,variables:variables.length,links:links.length,constraints:constraints.length,resources:resources.length,dependencies:dependencies.length,evidence:list(m,"evidence").length},caveat:"Structural diagnostics are heuristics based on entered records. They do not prove causal importance, identify every missing factor or establish predictive validity."};
}
function runExperiment(model,spec){
 const s=spec||{},base=JSON.parse(JSON.stringify(model)),intervention=JSON.parse(JSON.stringify(model)),target=s.targetId,delta=Number(s.delta)||0;
 if(s.type==="variable"){const v=list(intervention,"variables").find(x=>x.id===target);if(v)v.level=clamp(Number(v.level??5)+delta);}
 else if(s.type==="resource"){const r=list(intervention,"resources").find(x=>x.id===target);if(r)r.initial=Math.min(Math.max(0,Number(r.capacity??r.initial??r.level??0)),Math.max(0,Number(r.initial??r.level??0)+delta));}
 else if(s.type==="constraint-toggle"){const c=list(intervention,"constraints").find(x=>x.id===target);if(c)c.disabled=!c.disabled;}
 const opts=s.options||{},baseline=root.STRATOSSimulation.simulate(base,opts),changed=root.STRATOSSimulation.simulate(intervention,opts);
 return {name:s.name||"Controlled intervention",baseline,intervention:changed,delta:{score:changed.score-baseline.score,variables:Object.fromEntries(list(model,"variables").map(v=>[v.id,Number((Number(changed.finalLevels[v.id]??5)-Number(baseline.finalLevels[v.id]??5)).toFixed(3))]))},note:"One declared input was changed. Differences are model-conditional, not causal proof or calibrated forecasts."};
}
function calibrate(run,observations){
 const rows=(observations||[]).map(o=>{const simulated=Number(run?.finalLevels?.[o.variableId]),observed=Number(o.observedValue);return {variableId:o.variableId,name:o.name||o.variableId,simulated:Number.isFinite(simulated)?simulated:null,observed:Number.isFinite(observed)?observed:null,error:Number.isFinite(simulated)&&Number.isFinite(observed)?Number((simulated-observed).toFixed(3)):null,absoluteError:Number.isFinite(simulated)&&Number.isFinite(observed)?Number(Math.abs(simulated-observed).toFixed(3)):null,source:o.source||"",date:o.date||""};});
 const valid=rows.filter(x=>x.absoluteError!==null),mae=valid.length?valid.reduce((n,x)=>n+x.absoluteError,0)/valid.length:null;
 return {runId:run?.id||null,rows,meanAbsoluteError:mae===null?null:Number(mae.toFixed(3)),normalizedError:mae===null?null:Number((mae/10*100).toFixed(1)),count:valid.length,caveat:"Calibration is descriptive comparison against the observations supplied for this specific run, scope and time. It is not validation on its own; use held-out observations and repeated cases before making predictive claims."};
}
function sensitivity(model,options){
 const variables=list(model,"variables"),delta=Number(options?.delta)||1,base=root.STRATOSSimulation.simulate(model,options||{}),rows=[];
 variables.forEach(v=>{const altered=JSON.parse(JSON.stringify(model)),target=list(altered,"variables").find(x=>x.id===v.id);target.level=clamp(Number(target.level??5)+delta);const run=root.STRATOSSimulation.simulate(altered,options||{});rows.push({id:v.id,name:v.name||"Unnamed variable",baseline:base.score,changed:run.score,scoreChange:Number((run.score-base.score).toFixed(2)),delta});});
 return rows.sort((a,b)=>Math.abs(b.scoreChange)-Math.abs(a.scoreChange));
}
const baseSimulate=root.STRATOSSimulation.simulate;
root.STRATOSSimulation=Object.freeze({...root.STRATOSSimulation,simulate:function(model,options){
 const opts=options||{},chosen=list(model,"decisions").find(x=>x.id===opts.decisionId);
 const initial={};list(model,"variables").forEach(v=>initial[v.id]=clamp(v.level??5));
 const stocks=list(model,"resources").map(r=>({...r,level:Number(r.initial??r.level??r.capacity??0)}));
 const blocked=chosen?dependencyStatus(model,1,initial,stocks).filter(x=>x.hard&&!x.passed&&(!x.requiredBy||x.requiredBy===chosen.id)):[];
 let run;
 if(blocked.length){const shadow={...model,decisions:list(model,"decisions").map(d=>d.id===chosen.id?{...d,effectText:""}:d)};run=baseSimulate(shadow,opts);run._blockedPrerequisites=blocked;}
 else run=baseSimulate(model,opts);
 return enhance(model,run,opts);
},analyze,runExperiment,sensitivity,calibrate,enhance});
})(window);
