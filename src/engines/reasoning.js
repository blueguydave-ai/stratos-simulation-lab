(function(root){"use strict";
const txt=v=>String(v||"").trim(), uniq=a=>[...new Set(a.filter(Boolean))];
const patterns=[
["trust",/\b(trust|credib|skeptic|scam|reputation|confidence)\b/i,"Trust and credibility"],
["demand",/\b(demand|need|want|interest|buyers?|customers?|audience)\b/i,"Demand and customer interest"],
["awareness",/\b(awareness|discover|visibility|reach|advertis|promotion|marketing)\b/i,"Awareness and discovery"],
["access",/\b(access|available|availability|distribution|gatekeep|permission)\b/i,"Access and gatekeeping"],
["price",/\b(price|cost|budget|afford|expensive|cheap|payment|pay|revenue)\b/i,"Price and affordability"],
["competition",/\b(compet|rival|alternative|substitute|market share)\b/i,"Competition and alternatives"],
["delay",/\b(delay|wait|slow|deadline|time|later|postpone)\b/i,"Timing and delay"],
["risk",/\b(risk|uncertain|uncertainty|failure|downside|loss|threat)\b/i,"Risk and uncertainty"],
["power",/\b(power|authority|influence|control|leverage|approval)\b/i,"Power and decision authority"],
["resources",/\b(resource|capacity|budget|staff|inventory|cash|skill)\b/i,"Resources and capacity"],
["resistance",/\b(resist|object|refus|reject|pushback|conflict|oppose)\b/i,"Resistance and objections"],
["information",/\b(information|evidence|misinform|rumou?r|know|belief|communicat)\b/i,"Information and beliefs"],
["rules",/\b(rule|law|policy|regulat|procedure|institution|norm)\b/i,"Rules and institutions"],
["feedback",/\b(feedback|signal|measure|test|observe|result)\b/i,"Feedback and learning"]];
function interpret(model){const s=model?.situation||{},d=s.guidedDetails||{},description=[s.description,s.outcome,s.position,s.boundary,s.social,s.legal,...Object.values(d)].map(txt).filter(Boolean).join("\n"),themes=patterns.filter(p=>p[1].test(description)).map(p=>({id:p[0],label:p[2]})),mentions=uniq((txt(d.participants)+"\n"+txt(d.participantGoals)+"\n"+txt(s.description)).split(/[,;\n]+/).map(x=>x.trim()).filter(x=>x.length>2)).slice(0,12),uncertainties=[],suggestions=[],questions=[];
if(!txt(s.outcome))uncertainties.push("The desired outcome is not stated clearly.");
if(!(model.evidence||[]).length)uncertainties.push("No evidence records are attached; important claims may be assumptions.");
if(!(model.links||[]).length)uncertainties.push("No causal links are recorded, so knock-on effects are limited.");
if(!(model.actors||[]).length)uncertainties.push("No actor records exist; different interests and responses are not represented.");
if(/\b(always|never|everyone|nobody|guaranteed|certain)\b/i.test(description))uncertainties.push("Absolute language appears. Check for exceptions and counterexamples.");
if(themes.some(x=>["trust","resistance","information"].includes(x.id)))suggestions.push({title:"Separate statements from actions",why:"Stated beliefs, observed behaviour and inferred motives can differ.",action:"Record statements, observed actions and evidence separately."});
if(themes.some(x=>["price","demand","competition"].includes(x.id)))suggestions.push({title:"Map the buyer decision path",why:"Interest does not guarantee trust, authority, payment or delivery.",action:"Model discovery, evaluation, trust, access, approval, payment and delivery."});
if(themes.some(x=>["power","access","rules"].includes(x.id)))suggestions.push({title:"Identify who can enable or block the outcome",why:"Gatekeepers, formal authority and informal influence may differ.",action:"Add decision rights, rules, dependencies and exceptions."});
if(themes.some(x=>["resources","delay","risk"].includes(x.id)))suggestions.push({title:"Test capacity, timing and failure conditions",why:"A strategy may fail when resources run out or effects arrive too late.",action:"Add resource stocks, constraints, prerequisites, delays and adverse scenarios."});
if(!suggestions.length)suggestions.push({title:"Clarify the mechanisms",why:"The description does not expose enough specific drivers yet.",action:"Name participants, what each wants, what they can do, what limits them and observable signals."});
if(!txt(d.knownUnknown))questions.push("Which parts are directly observed, and which are assumptions?");
if(!txt(d.counterResponses))questions.push("How might participants respond differently from what you expect?");
if(!txt(d.alternatives))questions.push("What are the realistic alternatives, including waiting or doing nothing?");
questions.push("What evidence would prove your current explanation wrong?");
return {summary:"First-pass interpretation. Extracted themes are candidate concepts, not verified facts.",themes,mentions,uncertainties,suggestions,questions,confidence:"Heuristic text matching; human review required."};}
function explainRun(model,run){const vars=model.variables||[],initial=Object.fromEntries(vars.map(v=>[v.id,Number(v.level??5)])),moved=Object.entries(run.finalLevels||{}).map(([id,value])=>({v:vars.find(x=>x.id===id),before:initial[id],after:Number(value)})).filter(x=>x.v).map(x=>({...x,delta:x.after-x.before})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)),major=moved.slice(0,4),warnings=(run.warnings||[]).slice(0,5),drivers=(run.sensitivities||[]).slice(0,4),responses=(run.actorResponses||[]).filter(x=>x.responded).slice(0,4),insights=[];
if(major.length)insights.push("Largest modelled movements: "+major.map(x=>x.v.name+" "+(x.delta>0?"+":"")+x.delta.toFixed(1)+"/10").join("; ")+". Model movements are not measured real-world changes.");
if(drivers.length)insights.push("Leading sensitivity drivers: "+drivers.join(", ")+". Check whether these assumptions have evidence.");
if(responses.length)insights.push("Applied actor response rules for: "+responses.map(x=>x.name).join(", ")+". These follow entered rules, not predictions of private intentions.");
if(warnings.length)insights.push("Important limitations: "+warnings.join(" "));
if(!major.length)insights.push("No meaningful variable movement was recorded. Check whether a strategy, event or causal link was configured.");
return {insights,questions:["Did the largest modelled change occur in reality, and on the same timescale?","Which warning would most change the conclusion?","What alternative explanation could produce a different outcome?","What is the cheapest real-world observation that could challenge this result?"]};}
root.STRATOSReasoning=Object.freeze({interpret,explainRun});})(window);