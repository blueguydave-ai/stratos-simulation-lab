/* STRATOS Simulation Engine — deterministic, inspectable, dependency-free. */
(function(root){
"use strict";
const clamp=n=>Math.max(0,Math.min(10,Number(n)||0));
const confidence=v=>({low:.55,medium:.8,high:1}[v]||.6);
function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function randomFrom(seed){let a=seed>>>0;return function(){a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function parseEffects(text,variables){
 const out={};String(text||"").split(/[,;\n]+/).forEach(part=>{const m=part.trim().match(/^([^:]+):\s*([+-]?\d+(?:\.\d+)?)$/);if(!m)return;const key=m[1].trim();const v=variables.find(x=>x.id===key||String(x.name||"").toLowerCase()===key.toLowerCase());if(v)out[v.id]=Number(m[2]);});return out;
}
function simulate(model,options){
 const opts=options||{}, branch=opts.branch||"base", steps=Math.max(1,Math.min(60,Number(opts.steps)||4)), rounds=Math.max(1,Math.min(10,Number(opts.rounds)||3));
 const variables=model.variables||[], actors=model.actors||[], events=model.events||[], links=model.links||[], decisions=model.decisions||[];
 const chosen=decisions.find(x=>x.id===opts.decisionId), seedText=String(opts.seed??[branch,opts.decisionId||"none",steps,rounds].join("|"));
 const rng=randomFrom(hash(seedText)), levels={};
 variables.forEach(v=>levels[v.id]=clamp(v.level??5));
 const actorBeliefs={},beliefTimeline=[];
 actors.forEach(actor=>{
   const beliefs={};
   String(actor.beliefs||"").split(/[;\n]+/).forEach(part=>{
     const match=part.trim().match(/^([^:]+):\s*(-?\d+(?:\.\d+)?)$/);
     if(!match)return;
     const variable=variables.find(v=>v.id===match[1].trim()||String(v.name||"").toLowerCase()===match[1].trim().toLowerCase());
     if(variable)beliefs[variable.id]=clamp(match[2]);
   });
   actorBeliefs[actor.id]=beliefs;
 });
 Object.entries(model.scenarioOverrides?.[branch]||{}).forEach(([k,v])=>{if(levels[k]!==undefined)levels[k]=clamp(levels[k]+Number(v));});
 if(branch==="favourable")variables.forEach(v=>{if(v.direction==="positive")levels[v.id]=clamp(levels[v.id]+.7);if(v.direction==="negative")levels[v.id]=clamp(levels[v.id]-.4);});
 if(branch==="adverse")variables.forEach(v=>{if(v.direction==="positive")levels[v.id]=clamp(levels[v.id]-.8);if(v.direction==="negative")levels[v.id]=clamp(levels[v.id]+.6);});
 const warnings=[],timeline=[],eventOutcomes=[],actorOutcomes=[],pending=[];
 if(!variables.length)warnings.push("No variables: the simulation has no measurable state.");
 if(!actors.length)warnings.push("No actors modelled: strategic responses are missing.");
 if(!links.length)warnings.push("No causal links: knock-on effects are limited.");
 if(variables.some(v=>v.evidenceStatus==="unknown"||v.confidence==="low"))warnings.push("Some variables are unknown or low-confidence; output sensitivity may be understated.");
 if(!model.evidence?.length)warnings.push("No evidence records attached. Treat inputs as unverified until sourced.");
 if(model.situation?.legal&&!/source|checked|verified/i.test(model.situation.legal))warnings.push("Legal context has no explicit verification marker; independently check current rules.");
 const notes=[];
 if(chosen){
   notes.push("Selected strategy: "+chosen.name+". Declared mechanism: "+(chosen.mechanism||"not specified")+".");
   const direct=parseEffects(chosen.effectText,variables);
   Object.entries(direct).forEach(([k,v])=>levels[k]=clamp(levels[k]+v));
   if(Object.keys(direct).length)notes.push("Applied the strategy's entered direct effects at step 0.");
 }
 const eventsSorted=events.slice().sort((a,b)=>Number(a.when)-Number(b.when));
 for(let t=1;t<=steps;t++){
   const stepNotes=[], due=pending.filter(x=>x.at===t);
   // Actors update only beliefs about variables they can observe. Missing beliefs start neutral.
   actors.forEach(actor=>{
     const beliefs=actorBeliefs[actor.id]||(actorBeliefs[actor.id]={});
     const access=String(actor.informationAccess||"").split(/[,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
     const rate=Math.max(0,Math.min(1,Number(actor.learningRate??0.25)))*Math.max(0,Math.min(1,Number(actor.informationConfidence??5)/10));
     variables.forEach(variable=>{
       if(access.length&&!access.includes(variable.id.toLowerCase())&&!access.includes(String(variable.name||"").toLowerCase()))return;
       if(beliefs[variable.id]===undefined)beliefs[variable.id]=5;
       const before=beliefs[variable.id],after=clamp(before+(levels[variable.id]-before)*rate);
       beliefs[variable.id]=after;
       if(Math.abs(after-before)>.0001)stepNotes.push(actor.name+" updated belief about "+variable.name+" ("+before.toFixed(1)+" → "+after.toFixed(1)+")");
     });
   });
   for(const item of due){if(levels[item.variableId]!==undefined){levels[item.variableId]=clamp(levels[item.variableId]+item.amount);stepNotes.push(item.label);}}
   for(const event of eventsSorted.filter(e=>Math.max(1,Number(e.when)||1)===t)){
     const likelihood={low:.25,medium:.55,high:.8,unknown:.5}[event.likelihood]??.5;
     const chance=event.status==="confirmed"?1:likelihood;
     const allowed=opts.includeUncertain!==false||!["low","unknown"].includes(event.likelihood);
     const occurred=allowed&&rng()<chance;
     eventOutcomes.push({id:event.id,name:event.name,step:t,probability:chance,occurred});
     if(occurred){Object.entries(event.effects||{}).forEach(([k,v])=>{if(levels[k]!==undefined)levels[k]=clamp(levels[k]+Number(v));});stepNotes.push("Event occurred: "+event.name);}
     else stepNotes.push("Event not applied: "+event.name);
   }
   if(chosen){
     actors.forEach(actor=>{
       const effects=parseEffects(actor.responseEffects,variables);
       if(!Object.keys(effects).length)return;
       const triggerId=actor.triggerVariable||"";
       const observed=triggerId?(actorBeliefs[actor.id]?.[triggerId]??5):undefined;
       const threshold=Number(actor.triggerThreshold??5);
       const op=actor.triggerOperator||"gte";
       const triggered=!triggerId||observed===undefined||
         (op==="gte"&&observed>=threshold)||(op==="lte"&&observed<=threshold)||
         (op==="gt"&&observed>threshold)||(op==="lt"&&observed<threshold);
       if(!triggered){actorOutcomes.push({actorId:actor.id,name:actor.name,step:t,policy:actor.policy||"custom",triggered:false,responded:false,probability:0});return;}
       const baseChance=Math.max(0,Math.min(1,Number(actor.responseChance??45)/100));
       // Explicit user-entered drivers; transparent heuristics, not learned psychology.
       const modifiers={goalAlignment:Math.max(-5,Math.min(5,Number(actor.goalAlignment)||0))*.025,incentivePressure:(clamp(actor.incentivePressure??5)-5)*.012,resourceCapacity:(clamp(actor.resourceCapacity??5)-5)*.018,perceivedRisk:(clamp(actor.riskTolerance??5)-clamp(actor.perceivedRisk??5))*.012,informationConfidence:(clamp(actor.informationConfidence??5)-5)*.008};
       const adjustment=Object.values(modifiers).reduce((sum,value)=>sum+value,0);
       const chance=Math.max(0,Math.min(1,baseChance+adjustment));
       const responded=rng()<chance;
       actorOutcomes.push({actorId:actor.id,name:actor.name,step:t,policy:actor.policy||"custom",triggered:true,responded,baseProbability:baseChance,probability:chance,modifier:adjustment,modifiers,triggerVariable:triggerId||null,triggerValue:observed??null,threshold:triggerId?threshold:null});
       if(responded){
         Object.entries(effects).forEach(([k,v])=>{levels[k]=clamp(levels[k]+v*.45);});
         stepNotes.push("Actor policy response ("+(actor.policy||"custom")+"): "+actor.name);
       }
     });
   }
   // Schedule each delayed link once per time step, outside propagation rounds.
   links.forEach(link=>{
     const delay=Math.max(0,Math.min(20,Number(link.delay)||0));
     if(delay===0||levels[link.from]===undefined||levels[link.to]===undefined)return;
     const sign=link.sign==="negative"?-1:1;
     const strength=Math.max(0,Math.min(3,Number(link.strength)||1));
     const shift=(levels[link.from]-5)*.12*strength*sign;
     const damped=Math.max(-1,Math.min(1,shift))*.55;
     if(Math.abs(damped)>.0001&&t+delay<=steps)pending.push({at:t+delay,variableId:link.to,amount:damped,label:"Delayed influence: "+(variables.find(v=>v.id===link.from)?.name||"variable")+" → "+(variables.find(v=>v.id===link.to)?.name||"variable")});
   });
   for(let round=0;round<rounds;round++){
     const delta={};
     links.forEach(link=>{
       if(levels[link.from]===undefined||levels[link.to]===undefined)return;
       const sign=link.sign==="negative"?-1:1, strength=Math.max(0,Math.min(3,Number(link.strength)||1));
       const shift=(levels[link.from]-5)*.12*strength*sign;
       const damped=Math.max(-1,Math.min(1,shift))*.55;
       const delay=Math.max(0,Math.min(20,Number(link.delay)||0));
       if(delay===0)delta[link.to]=(delta[link.to]||0)+damped;
     });
     Object.entries(delta).forEach(([k,v])=>levels[k]=clamp(levels[k]+Math.max(-1,Math.min(1,v))));
   }
   const snapshot={};variables.forEach(v=>snapshot[v.id]=Number(levels[v.id].toFixed(3)));
   timeline.push({step:t,label:stepNotes.join("; ")||"No declared event or actor move",levels:snapshot,beliefs:Object.fromEntries(actors.map(actor=>[actor.id,{...(actorBeliefs[actor.id]||{})}])),propagationRounds:rounds});
   beliefTimeline.push({step:t,actors:actors.map(actor=>({actorId:actor.id,name:actor.name,beliefs:{...(actorBeliefs[actor.id]||{})}}))});
 }
 let weighted=0,weight=0;
 variables.forEach(v=>{const polarity=v.direction==="positive"?1:v.direction==="negative"?-1:0,w=Math.max(0,Number(v.importance)||1)*confidence(v.confidence);weighted+=(levels[v.id]-5)*polarity*w;weight+=w;});
 const score=weight?Math.round(Math.max(0,Math.min(100,50+weighted/(weight*5)*50))):50;
 const uncertainty=variables.reduce((sum,v)=>sum+(Math.max(0,Number(v.high??10)-Number(v.low??0)))*(Number(v.importance)||1)*(1-confidence(v.confidence)),0)/Math.max(1,variables.reduce((sum,v)=>sum+(Number(v.importance)||1),0))*3;
 const low=Math.max(0,Math.round(score-uncertainty)),high=Math.min(100,Math.round(score+uncertainty));
 const sensitivities=variables.map(v=>({name:v.name||"Unnamed variable",impact:Math.abs((levels[v.id]-5)*(Number(v.importance)||1)),level:levels[v.id],evidence:v.evidenceStatus||"unspecified"})).sort((a,b)=>b.impact-a.impact).slice(0,5).map(v=>v.name+" (final "+Number(v.level).toFixed(1)+"/10; "+v.evidence+")");
 if(events.some(e=>e.likelihood==="unknown"))warnings.push("At least one event has unknown likelihood; event occurrence is sampled for this run, not forecast.");
 if(chosen?.downside)warnings.push("Strategy downside to monitor: "+chosen.downside);
 if(links.some(l=>Number(l.delay)>0))warnings.push("Delayed causal effects are scheduled once per link per step, using the source state at scheduling time. Effects beyond the run horizon are not shown.");
 const branchName={base:"Baseline",favourable:"Favourable",adverse:"Adverse",custom:"Custom stress"}[branch]||branch;
 const summary="Indicative weighted alignment only. Final state: "+variables.map(v=>v.name+" "+Number(levels[v.id]).toFixed(1)+"/10").join("; ")+".";
 return {id:"run_"+hash(seedText+"|"+JSON.stringify(timeline)).toString(36),seed:seedText,branch,title:branchName+" · "+(chosen?.name||"No selected strategy"),decision:opts.decisionId||"",score,low,high,summary,steps:timeline.map(x=>({step:x.step,label:x.label,note:"State snapshot: "+variables.map(v=>v.name+" "+x.levels[v.id]).join("; ")})),sensitivities,warnings,notes,createdAt:new Date().toISOString(),finalLevels:levels,events:eventOutcomes,actorResponses:actorOutcomes,beliefTimeline,timeline,metrics:{eventsOccurred:eventOutcomes.filter(x=>x.occurred).length,eventsConsidered:eventOutcomes.length,actorResponses:actorOutcomes.filter(x=>x.responded).length,actorResponsesConsidered:actorOutcomes.length,actorTriggers:actorOutcomes.filter(x=>x.triggered).length}};
}
root.STRATOSSimulation=Object.freeze({simulate,parseEffects});
})(window);
