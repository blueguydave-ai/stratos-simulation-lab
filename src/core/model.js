/* STRATOS Core — portable model contract. No framework or runtime dependency. */
(function (root) {
  "use strict";
  const VERSION = 4;
  const COLLECTIONS = ["actors","variables","links","events","communications","relationships","powerRelations","institutions","markets","segments","competitors","journeys","journeyPoints","negotiations","negotiationParties","decisionInteractions","reputationEvents","groups","groupEvents","aiSystems","aiEvents","constraints","resources","dependencies","decisions","branches","experiments","evidence","runs"];
  const CONTEXT_FIELDS = ["country","region","locality","institution","industry","market","legal","social","timeHorizon","boundary"];
  const id = () => "st_" + Math.random().toString(36).slice(2,10);
  const freshModel = () => ({
    schemaVersion: VERSION, version: VERSION,
    meta: { title:"Untitled situation", createdAt:new Date().toISOString(), updatedAt:null, domainPack:"general", modelStatus:"draft" },
    situation: { outcome:"", deadline:"", position:"", description:"", geography:"", country:"", region:"", locality:"", institution:"", industry:"", market:"", legal:"", social:"", timeHorizon:"30 days", boundary:"" },
    actors:[], variables:[], links:[], events:[], communications:[], relationships:[], powerRelations:[], institutions:[], markets:[], segments:[], competitors:[], journeys:[], journeyPoints:[], negotiations:[], negotiationParties:[], decisionInteractions:[], reputationEvents:[], groups:[], groupEvents:[], aiSystems:[], aiEvents:[], constraints:[], resources:[], dependencies:[], decisions:[], branches:[],
    scenarioOverrides:{base:{},favourable:{},adverse:{},custom:{}}, experiments:[], evidence:[], runs:[]
  });
  function normalizeModel(input) {
    const base=freshModel(), source=input&&typeof input==="object"?input:{};
    const model={...base,...source, schemaVersion:VERSION, version:VERSION};
    model.meta={...base.meta,...(source.meta||{})};
    model.situation={...base.situation,...(source.situation||{})};
    COLLECTIONS.forEach(k=>{model[k]=Array.isArray(source[k])?source[k]:[];});
    model.scenarioOverrides={...base.scenarioOverrides,...(source.scenarioOverrides||{})};
    Object.keys(base.scenarioOverrides).forEach(k=>{model.scenarioOverrides[k]={...(model.scenarioOverrides[k]||{})};});
    return model;
  }
  function validateModel(input) {
    const model=normalizeModel(input), errors=[], warnings=[];
    const records=key=>Array.isArray(model[key])?model[key]:[];
    if (!String(model.situation.outcome||"").trim()) warnings.push({code:"outcome.missing",message:"Define the outcome this model is trying to explain or influence."});
    if (!String(model.situation.boundary||"").trim()) warnings.push({code:"scope.missing",message:"Define what is outside this model's scope."});
    const ids=new Set();
    COLLECTIONS.forEach(collection=>records(collection).forEach((item,index)=>{
      if(!item||typeof item!=="object"||Array.isArray(item)){errors.push({code:"record.invalid",path:collection+"["+index+"]",message:"Record must be an object."});return;}
      if(!item.id)warnings.push({code:"id.missing",path:collection+"["+index+"]",message:"Record has no stable ID."});
      else if(ids.has(item.id))errors.push({code:"id.duplicate",path:collection+"["+index+"]",message:"Duplicate record ID: "+item.id});
      else ids.add(item.id);
    }));
    const actorIds=new Set(records("actors").filter(x=>x&&typeof x==="object").map(x=>x.id).filter(Boolean));
    const variableIds=new Set(records("variables").filter(x=>x&&typeof x==="object").map(x=>x.id).filter(Boolean));
    records("links").forEach((x,i)=>{
      if(!x||typeof x!=="object")return;
      if(!variableIds.has(x.from)||!variableIds.has(x.to))errors.push({code:"link.dangling",path:"links["+i+"]",message:"Causal link references a missing variable."});
      if(x.from===x.to)warnings.push({code:"link.self",path:"links["+i+"]",message:"Self-link: confirm this feedback loop is intentional."});
      if(x.strength!==undefined&&(!Number.isFinite(Number(x.strength))||Number(x.strength)<0||Number(x.strength)>3))warnings.push({code:"link.strength",path:"links["+i+"]",message:"Link strength should be between 0 and 3."});
      if(x.delay!==undefined&&(!Number.isFinite(Number(x.delay))||Number(x.delay)<0))warnings.push({code:"link.delay",path:"links["+i+"]",message:"Link delay should be a non-negative number of steps."});
    });
    records("events").forEach((x,i)=>{
      if(!x||typeof x!=="object")return;
      if(x.actorId&&!actorIds.has(x.actorId))warnings.push({code:"event.actor_missing",path:"events["+i+"]",message:"Event references a missing actor."});
      Object.keys(x.effects||{}).forEach(k=>{if(!variableIds.has(k))warnings.push({code:"event.variable_missing",path:"events["+i+"]",message:"Event effect references a missing variable."});});
    });
    records("variables").forEach((x,i)=>{
      if(!x||typeof x!=="object")return;
      const low=Number(x.low),high=Number(x.high),level=Number(x.level);
      if(Number.isFinite(low)&&Number.isFinite(high)&&low>high)errors.push({code:"variable.range",path:"variables["+i+"]",message:"Plausible low value cannot exceed plausible high value."});
      if(x.low!==undefined&&(!Number.isFinite(low)||low<0||low>10))errors.push({code:"variable.low",path:"variables["+i+"]",message:"Plausible low must be a number from 0 to 10."});
      if(x.high!==undefined&&(!Number.isFinite(high)||high<0||high>10))errors.push({code:"variable.high",path:"variables["+i+"]",message:"Plausible high must be a number from 0 to 10."});
      if(x.level!==undefined&&(!Number.isFinite(level)||level<0||level>10))errors.push({code:"variable.level",path:"variables["+i+"]",message:"Current level must be a number from 0 to 10."});
      if(x.evidenceStatus==="unknown"||x.confidence==="low")warnings.push({code:"evidence.weak",path:"variables["+i+"]",message:"Unknown or low-confidence variable: test sensitivity to it."});
    });
    records("communications").forEach((x,i)=>{
      if(!x||typeof x!=="object")return;
      if(x.senderId&&!actorIds.has(x.senderId))warnings.push({code:"communication.sender_missing",path:"communications["+i+"]",message:"Message sender is not a registered actor."});
      if(x.recipientId&&!actorIds.has(x.recipientId))warnings.push({code:"communication.recipient_missing",path:"communications["+i+"]",message:"Message recipient is not a registered actor."});
      if(x.variableId&&!variableIds.has(x.variableId))warnings.push({code:"communication.variable_missing",path:"communications["+i+"]",message:"Message references a missing variable."});
    });
    if(!records("actors").filter(Boolean).length)warnings.push({code:"actors.none",message:"No actors are modelled; human responses may be missing."});
    if(!records("evidence").filter(Boolean).length)warnings.push({code:"evidence.none",message:"No evidence records have been attached."});
    return {valid:errors.length===0,errors,warnings,checkedAt:new Date().toISOString()};
  }
  function createRecord(type,fields){if(!COLLECTIONS.includes(type))throw new Error("Unknown collection: "+type);return {id:id(),...fields,createdAt:new Date().toISOString()};}
  root.STRATOSCore=Object.freeze({VERSION,COLLECTIONS,CONTEXT_FIELDS,freshModel,normalizeModel,validateModel,createRecord});
})(window);
