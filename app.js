const scenarioInput=document.getElementById("scenario");
const runButton=document.getElementById("run-button");
const charCount=document.getElementById("char-count");
const statusBox=document.getElementById("status");
const resultsBox=document.getElementById("results");
let currentAnalysis=null;
let currentScope="focused";
let expanding=false;

scenarioInput.addEventListener("input",()=>{charCount.textContent=scenarioInput.value.length.toLocaleString()+" / 8,000";});
document.querySelectorAll('input[name="scope"]').forEach(input=>input.addEventListener("change",()=>{currentScope=input.value;document.querySelectorAll(".mode-option").forEach(option=>option.classList.toggle("selected",option.querySelector("input").checked));}));

function showStatus(message,isError=false){statusBox.hidden=false;statusBox.className=isError?"status error":"status";statusBox.textContent=message;}
function make(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined&&text!==null)node.textContent=text;return node;}
function addFactorCard(parent,title,items){if(!Array.isArray(items)||!items.length)return;const card=make("article","factor");card.append(make("h4","",title));card.append(make("p","",items.map(item=>typeof item==="string"?item:(item.name||item.title||"Factor")+(item.why||item.role||item.why_it_matters?" — "+(item.why||item.role||item.why_it_matters):"")+(item.incentive_or_interest?" (interest: "+item.incentive_or_interest+")":"")+(item.reach?" ["+item.reach+" influence]":"")).join(" · ")));parent.append(card);}
function addDetail(parent,label,value){if(!value||(Array.isArray(value)&&!value.length))return;const p=make("p");p.append(make("b","",label+": "),document.createTextNode(Array.isArray(value)?value.join("; "):String(value)));parent.append(p);}
function renderOutcomes(outcomes,list){outcomes.forEach(outcome=>{const details=document.createElement("details");details.className="outcome";if(outcome.rank===1)details.open=true;const summary=document.createElement("summary");summary.append(make("span","rank",String(outcome.rank||list.children.length+1)));const main=document.createElement("span");main.append(make("span","outcome-title",outcome.title||"Possible outcome"));const meta=make("span","outcome-meta");meta.append(make("span","tag",outcome.category||"Mixed drivers"));main.append(meta);summary.append(main);summary.append(make("span","likelihood"+(String(outcome.likelihood||"").toLowerCase().includes("moderate")?" moderate":""),outcome.likelihood||"Plausible"));details.append(summary);const body=make("div","outcome-body");addDetail(body,"What happens",outcome.description);addDetail(body,"Why it happens",outcome.causal_chain);addDetail(body,"Conditions required",outcome.conditions);addDetail(body,"Main drivers",outcome.drivers);addDetail(body,"Early signs",outcome.early_signs);addDetail(body,"What could change it",outcome.changing_conditions);if(outcome.blind_spot)body.append(make("div","blindspot","Potential blind spot: "+outcome.blind_spot));details.append(body);list.append(details);});}
function render(data,append=false){if(!append){resultsBox.replaceChildren();const head=make("div","results-head");head.append(make("div","results-kicker",currentScope==="expanded"?"EXPANDED CONTEXT ANALYSIS":"SMALL CONTEXT ANALYSIS"));head.append(make("h2","",data.title||"Your possible outcomes"));head.append(make("p","results-summary",data.overview||"Plausible ways this situation could unfold."));if(data.scope_boundary)head.append(make("p","disclaimer","Scope boundary: "+data.scope_boundary));resultsBox.append(head);
const factorSection=make("section","section-block");factorSection.append(make("h3","section-title","What shapes the situation"));const grid=make("div","factor-grid");addFactorCard(grid,"Influential variables",data.influential_variables);addFactorCard(grid,"Constants",data.constants);addFactorCard(grid,"Constraints",data.constraints);addFactorCard(grid,"Actors and groups",data.actors);addFactorCard(grid,"Other relevant components",data.components);addFactorCard(grid,"Important unknowns",data.unknowns);addFactorCard(grid,"Interactions to watch",data.interactions);factorSection.append(grid);resultsBox.append(factorSection);
const blind=make("section","section-block");blind.append(make("h3","section-title","Blind spots worth checking"));const blindGrid=make("div","factor-grid");(data.blind_spots||[]).forEach(item=>{const card=make("article","factor");card.append(make("h4","",item.title||"Overlooked factor"));card.append(make("p","",item.why_it_matters||item.description||""));blindGrid.append(card);});blind.append(blindGrid);resultsBox.append(blind);}
let metrics=resultsBox.querySelector(".metrics");if(!metrics){metrics=make("div","metrics");[["0","outcomes explored"],[String((data.key_drivers||[]).length),"key drivers identified"],[String((data.blind_spots||[]).length),"blind spots surfaced"]].forEach(([n,label])=>{const m=make("div","metric");m.append(make("strong","",n),make("span","",label));metrics.append(m);});resultsBox.insertBefore(metrics,resultsBox.querySelector(".section-block"));}
let section=resultsBox.querySelector(".outcome-section");if(!section){section=make("section","section-block outcome-section");section.append(make("h3","section-title","Possible outcomes"));section.append(make("div","outcome-list"));resultsBox.insertBefore(section,resultsBox.querySelector(".section-block"));}
const list=section.querySelector(".outcome-list");renderOutcomes(data.outcomes||[],list);metrics.querySelector(".metric strong").textContent=String(list.children.length);
if(!section.querySelector(".more-row")){const row=make("div","more-row");const button=make("button","more-button","Explore more possible outcomes");button.type="button";button.addEventListener("click",expandOutcomes);row.append(button);section.append(row);}
if(!append)resultsBox.append(make("p","disclaimer",data.caveat||"Likelihood labels are comparative judgments, not measured probabilities. These are scenarios to test, not guarantees."));}
async function expandOutcomes(){if(!currentAnalysis||expanding)return;expanding=true;const button=resultsBox.querySelector(".more-button");button.disabled=true;button.textContent="Exploring additional possibilities...";showStatus("Searching for additional distinct outcomes within the same context boundary...");try{const response=await fetch("/api/outcomes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scenario:scenarioInput.value.trim(),scope:currentScope,action:"expand",existing_outcomes:currentAnalysis.outcomes.map(item=>item.title)})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"Could not expand the outcome set.");const extra=payload.analysis;const seen=new Set(currentAnalysis.outcomes.map(item=>String(item.title||"").toLowerCase()));const fresh=(extra.outcomes||[]).filter(item=>!seen.has(String(item.title||"").toLowerCase()));if(!fresh.length)throw new Error("No meaningfully distinct additional outcomes were found at this scope. Try a new analysis with the expanded-context mode to widen the lens.");fresh.forEach((item,i)=>item.rank=currentAnalysis.outcomes.length+i+1);currentAnalysis.outcomes.push(...fresh);render({...currentAnalysis,outcomes:fresh},true);statusBox.hidden=true;button.textContent="Explore more possible outcomes";}catch(error){showStatus(error.message||"Unable to expand outcomes.",true);button.textContent="Try exploring more outcomes";}finally{expanding=false;button.disabled=false;}}
runButton.addEventListener("click",async()=>{const scenario=scenarioInput.value.trim();if(scenario.length<20){showStatus("Describe the situation in a little more detail so STRATOS has enough context to analyse it.",true);scenarioInput.focus();return;}runButton.disabled=true;runButton.querySelector("span:first-child").textContent="Exploring...";resultsBox.hidden=true;resultsBox.replaceChildren();currentAnalysis=null;showStatus(currentScope==="expanded"?"Widening the lens carefully to find relevant surrounding influences...":"Mapping the immediate situation and its plausible outcomes...");try{const response=await fetch("/api/outcomes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scenario,scope:currentScope,action:"initial"})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"STRATOS could not complete the analysis. Please try again.");if(!payload.analysis||!Array.isArray(payload.analysis.outcomes)||payload.analysis.outcomes.length<5)throw new Error("The analysis came back incomplete. Please run it again.");currentAnalysis=payload.analysis;render(currentAnalysis);statusBox.hidden=true;resultsBox.hidden=false;resultsBox.scrollIntoView({behavior:"smooth",block:"start"});}catch(error){showStatus(error.message||"Something went wrong. Please try again.",true);}finally{runButton.disabled=false;runButton.querySelector("span:first-child").textContent="Explore outcomes";}});


// Scroll-reveal motion for analysis sections and dynamically-created result cards.
const revealTargets = ".results-head, .metrics, .section-block, .disclaimer, .factor, .outcome, .more-row";
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -36px 0px" })
  : null;

function activateScrollReveals(root = document) {
  root.querySelectorAll(revealTargets).forEach((element, index) => {
    if (element.classList.contains("reveal-on-scroll")) return;
    element.classList.add("reveal-on-scroll");
    element.style.setProperty("--reveal-delay", (Math.min(index % 5, 4) * 65) + "ms");
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
  });
}

activateScrollReveals();
if ("MutationObserver" in window) {
  const resultsMotionObserver = new MutationObserver(() => activateScrollReveals(resultsBox));
  resultsMotionObserver.observe(resultsBox, { childList: true, subtree: true });
}


// Keep the refracted photo fragment perfectly aligned with the fixed chess backdrop.
// This is a Safari-friendly visual fallback: it bends the uploaded scene itself at each glass rim.
(function syncGlassScene(){
  const photo=document.querySelector(".backdrop-photo");
  if(!photo)return;
  let frame=0;
  function update(){
    frame=0;
    const vw=window.innerWidth, vh=window.innerHeight;
    const nw=photo.naturalWidth||1920, nh=photo.naturalHeight||1080;
    const scale=Math.max(vw/nw,vh/nh);
    const sceneW=nw*scale, sceneH=nh*scale;
    const sceneLeft=(vw-sceneW)*.5;
    const sceneTop=(vh-sceneH)*.46;
    document.querySelectorAll(".glass-panel,.metric,.factor,.outcome,.mode-option").forEach(el=>{
      const rect=el.getBoundingClientRect();
      el.style.setProperty("--scene-w",sceneW+"px");
      el.style.setProperty("--scene-h",sceneH+"px");
      el.style.setProperty("--scene-x",(sceneLeft-rect.left)+"px");
      el.style.setProperty("--scene-y",(sceneTop-rect.top)+"px");
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update)}
  photo.addEventListener("load",schedule,{once:true});
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  if("ResizeObserver" in window){
    const ro=new ResizeObserver(schedule);
    ro.observe(document.documentElement);
  }
  if("MutationObserver" in window){
    const mo=new MutationObserver(schedule);
    mo.observe(document.getElementById("results"),{childList:true,subtree:true});
  }
  schedule();
})();
