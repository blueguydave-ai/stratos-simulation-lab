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


// Each panel/card reveals independently with a vertical-only motion; no depth blur or scale.
const revealTargets = ".input-panel, #status, .results-head, .metrics, .section-title, .disclaimer, .factor, .outcome, .more-row";
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -55px 0px" })
  : null;

function activateScrollReveals(root = document) {
  root.querySelectorAll(revealTargets).forEach(element => {
    if (element.classList.contains("reveal-on-scroll")) return;
    element.classList.add("reveal-on-scroll");
    const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
    const siblingIndex = Math.max(0, siblings.indexOf(element));
    element.style.setProperty("--reveal-delay", (Math.min(siblingIndex, 5) * 105) + "ms");
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
  });
}

activateScrollReveals();
if ("MutationObserver" in window) {
  const resultsMotionObserver = new MutationObserver(() => activateScrollReveals(resultsBox));
  resultsMotionObserver.observe(resultsBox, { childList: true, subtree: true });
}


// SVG displacement in backdrop-filter is Chromium-only in current browser engines.
if (navigator.userAgentData) document.documentElement.classList.add("supports-live-refraction");

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


/* STRATOS ATMOSPHERE — lightweight WebGL/GLSL scene behind the interface.
   The shader renders only into the fixed backdrop layer, never onto UI panels. */
(function initStratosAtmosphere(){
  const backdrop=document.querySelector(".cinematic-backdrop");
  if(!backdrop || !window.WebGLRenderingContext) return;
  const canvas=document.createElement("canvas");
  canvas.className="atmosphere-webgl";
  canvas.setAttribute("aria-hidden","true");
  backdrop.insertBefore(canvas,backdrop.querySelector(".backdrop-vignette")||null);
  const gl=canvas.getContext("webgl",{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:"low-power"});
  if(!gl) { canvas.remove(); return; }

  const vertexSource=`
    attribute vec2 position;
    varying vec2 uv;
    void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }
  `;
  const fragmentSource=`
    precision mediump float;
    varying vec2 uv;
    uniform vec2 resolution;
    uniform float time;

    float hash(vec2 p){
      p=fract(p*vec2(123.34,456.21));
      p+=dot(p,p+45.32);
      return fract(p.x*p.y);
    }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0., a=.5;
      mat2 m=mat2(1.6,1.2,-1.2,1.6);
      for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}
      return v;
    }
    void main(){
      vec2 p=uv;
      float aspect=resolution.x/max(resolution.y,1.);
      vec2 q=vec2((p.x-.5)*aspect,p.y);
      float t=time*.018;

      // Broad, slow-moving smoke banks with soft, layered structure.
      float n1=fbm(vec2(q.x*1.45+t*.7,q.y*2.2-t*.18));
      float n2=fbm(vec2(q.x*2.2-t*.35,q.y*3.1+t*.12)+7.4);
      float cloud=smoothstep(.43,.79,n1*.66+n2*.34);
      float lowFog=smoothstep(.34,.82,fbm(vec2(q.x*1.1-t*.25,q.y*1.8+2.8)));
      float veil=cloud*.18+lowFog*.12;

      // Restrained shafts: broad and blurred, not graphic streaks.
      float beamA=exp(-pow((q.x+.31+sin(t)*.045)*3.0,2.))*smoothstep(.05,.9,p.y);
      float beamB=exp(-pow((q.x-.38-cos(t*.8)*.035)*4.0,2.))*smoothstep(.12,.92,p.y);
      float shafts=(beamA*.045+beamB*.025)*(0.45+n1*.55);

      // Tiny suspended particles, intentionally sparse and low contrast.
      vec2 cell=floor(p*vec2(38.*aspect,26.));
      float rnd=hash(cell);
      vec2 local=fract(p*vec2(38.*aspect,26.))-.5;
      float drift=time*(.012+fract(rnd*8.)*.018);
      local.y+=drift;
      float dust=smoothstep(.035,.0,length(local)) * step(.992,rnd);
      dust*=.12+.12*sin(time*.7+rnd*30.);

      vec3 smokeColor=vec3(.62,.68,.75);
      vec3 warmColor=vec3(.76,.64,.48);
      float warm= smoothstep(.15,.8,p.x)*smoothstep(.1,.8,p.y);
      vec3 color=mix(smokeColor,warmColor,warm*.28);
      float alpha=veil*.34+shafts+ dust;
      // Fade at the perimeter so the photo remains dominant.
      float edge=smoothstep(0.,.18,p.x)*smoothstep(0.,.18,1.-p.x)
                *smoothstep(0.,.16,p.y)*smoothstep(0.,.16,1.-p.y);
      alpha*=edge;
      gl_FragColor=vec4(color,clamp(alpha,0.,.16));
    }
  `;
  function compile(type,source){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}
    return shader;
  }
  const vs=compile(gl.VERTEX_SHADER,vertexSource), fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
  if(!vs||!fs){canvas.remove();return;}
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.remove();return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,"position");
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,"resolution");
  const timeUniform=gl.getUniformLocation(program,"time");
  let frame=0, start=performance.now(), last=0, visible=true;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,1.35);
    const w=Math.max(1,Math.floor(backdrop.clientWidth*dpr));
    const h=Math.max(1,Math.floor(backdrop.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.uniform2f(resolution,w,h);
  }
  function draw(now){
    frame=0;
    if(!visible)return;
    if(!reduced && now-last<40){frame=requestAnimationFrame(draw);return;}
    last=now;resize();
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeUniform,reduced?0:(now-start)/1000);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(!reduced)frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame&&!reduced&&visible)frame=requestAnimationFrame(draw);else if(reduced&&!frame)draw(0);}
  document.addEventListener("visibilitychange",()=>{
    visible=!document.hidden;
    if(visible)schedule();else if(frame){cancelAnimationFrame(frame);frame=0;}
  });
  window.addEventListener("resize",schedule,{passive:true});
  schedule();
})();
