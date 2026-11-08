/* STRATOS Core — portable model contract. No framework or runtime dependency. */
(function (root) {
  "use strict";
  const VERSION = 3;
  const COLLECTIONS = ["actors","variables","links","events","communications","relationships","powerRelations","institutions","markets","segments","competitors","journeys","journeyPoints","negotiations","negotiationParties","decisionInteractions","reputationEvents","groups","decisions","branches","experiments","evidence","runs"];
  const CONTEXT_FIELDS = ["country","region","locality","institution","industry","market","legal","social","timeHorizon","boundary"];
  const id = () => "st_" + Math.random().toString(36).slice(2,10);
  const freshModel = () => ({
    schemaVersion: VERSION, version: VERSION,
    meta: { title:"Untitled situation", createdAt:new Date().toISOString(), updatedAt:null, domainPack:"general", modelStatus:"draft" },
    situation: { outcome:"", deadline:"", position:"", description:"", geography:"", country:"", region:"", locality:"", institution:"", industry:"", market:"", legal:"", social:"", timeHorizon:"30 days", boundary:"" },
    actors:[], variables:[], links:[], events:[], communications:[], relationships:[], powerRelations:[], institutions:[], markets:[], segments:[], competitors:[], journeys:[], journeyPoints:[], negotiations:[], negotiationParties:[], decisionInteractions:[], reputationEvents:[], groups:[], decisions:[], branches:[],
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
    if (!String(model.situation.outcome||"").trim()) warnings.push({code:"outcome.missing",message:"Define the outcome this model is trying to explain or influence."});
    if (!String(model.situation.boundary||"").trim()) warnings.push({code:"scope.missing",message:"Define what is outside this model's scope."});
    const ids=new Set();
    COLLECTIONS.forEach(collection=>model[collection].forEach((item,index)=>{
      if(!item||typeof item!=="object") errors.push({code:"record.invalid",path:collection+"["+index+"]",message:"Record must be an object."});
      else if(item.id){if(ids.has(item.id))errors.push({code:"id.duplicate",path:collection+"["+index+"]",message:"Duplicate record ID: "+item.id});ids.add(item.id);}
    }));
    const actorIds=new Set(model.actors.map(x=>x.id).filter(Boolean)), variableIds=new Set(model.variables.map(x=>x.id).filter(Boolean));
    model.links.forEach((x,i)=>{if(!variableIds.has(x.from)||!variableIds.has(x.to))errors.push({code:"link.dangling",path:"links["+i+"]",message:"Causal link references a missing variable."});if(x.from===x.to)warnings.push({code:"link.self",path:"links["+i+"]",message:"Self-link: confirm this feedback loop is intentional."});});
    model.events.forEach((x,i)=>{if(x.actorId&&!actorIds.has(x.actorId))warnings.push({code:"event.actor_missing",path:"events["+i+"]",message:"Event references a missing actor."});Object.keys(x.effects||{}).forEach(k=>{if(!variableIds.has(k))warnings.push({code:"event.variable_missing",path:"events["+i+"]",message:"Event effect references a missing variable."});});});
    model.variables.forEach((x,i)=>{if(Number(x.low)>Number(x.high))errors.push({code:"variable.range",path:"variables["+i+"]",message:"Plausible low value cannot exceed plausible high value."});if(x.evidenceStatus==="unknown"||x.confidence==="low")warnings.push({code:"evidence.weak",path:"variables["+i+"]",message:"Unknown or low-confidence variable: test sensitivity to it."});});
    if(!model.actors.length)warnings.push({code:"actors.none",message:"No actors are modelled; human responses may be missing."});
    if(!model.evidence.length)warnings.push({code:"evidence.none",message:"No evidence records have been attached."});
    return {valid:errors.length===0,errors,warnings,checkedAt:new Date().toISOString()};
  }
  function createRecord(type,fields){if(!COLLECTIONS.includes(type))throw new Error("Unknown collection: "+type);return {id:id(),...fields,createdAt:new Date().toISOString()};}
  root.STRATOSCore=Object.freeze({VERSION,COLLECTIONS,CONTEXT_FIELDS,freshModel,normalizeModel,validateModel,createRecord});
})(window);
