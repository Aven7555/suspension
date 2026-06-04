const statusList = ["New Enquiry","Inspection Booked","Car Received","Inspection Started","Problem Confirmed","Quotation Sent","Customer Approved","Repair In Progress","Reinstalling","Testing","Ready for Collection","Delivered / Collected","Warranty Case"];
const priceData = {
  "Continental": {"Air suspension warning":[18000,9000,4500,2800],"Absorber leaking":[12000,6500,3500,2200],"Car one side lower":[15000,8000,4200,2800],"Workshop cannot solve":[16000,8500,5000,3200]},
  "Luxury SUV": {"Air suspension warning":[35000,18000,9000,6500],"Absorber leaking":[22000,12000,8000,5200],"Car one side lower":[28000,16000,8500,6000],"Workshop cannot solve":[32000,18000,10000,7000]},
  "Porsche / Performance": {"Air suspension warning":[65000,30000,15000,9500],"Absorber leaking":[42000,22000,12000,7500],"Car one side lower":[55000,25000,14500,8800],"Workshop cannot solve":[60000,28000,16000,10000]},
  "Supercar": {"Air suspension warning":[180000,90000,50000,28000],"Absorber leaking":[120000,65000,38000,22000],"Car one side lower":[150000,75000,45000,26000],"Workshop cannot solve":[200000,100000,65000,35000]}
};
const defaultJobs = [
  {id:"SX1001",name:"Mr Tan",phone:"012-3338888",car:"Porsche Panamera 2018",source:"Direct Customer",status:"Repair In Progress",dealerCost:8200,retailPrice:11800,warranty:6,agent:"",note:"Rear air strut leak confirmed. Rebuild in progress.",created:new Date().toISOString()},
  {id:"SX1002",name:"Dealer Wong",phone:"016-2221111",car:"Mercedes-Benz W222 S400",source:"Used Car Dealer",status:"Quotation Sent",dealerCost:4600,retailPrice:6800,warranty:6,agent:"AG-WONG",note:"Front right air suspension unable to hold height.",created:new Date().toISOString()},
  {id:"SX1003",name:"Mr Lim",phone:"017-8889999",car:"Lamborghini Huracan",source:"Direct Customer",status:"Inspection Booked",dealerCost:25000,retailPrice:35000,warranty:6,agent:"",note:"Customer has original replacement quote above RM150k. Booking required.",created:new Date().toISOString()}
];
let selectedJobId = null;

function $(id){return document.getElementById(id)}
function money(n){return "RM" + Number(n||0).toLocaleString()}
function getJobs(){return JSON.parse(localStorage.getItem("sx_jobs")||"[]")}
function setJobs(jobs){localStorage.setItem("sx_jobs",JSON.stringify(jobs))}
function getFloat(){return JSON.parse(localStorage.getItem("sx_float")||'{"target":50000,"balance":50000}')}
function setFloat(f){localStorage.setItem("sx_float",JSON.stringify(f))}
function uid(){return "SX" + Math.floor(1000 + Math.random()*9000)}

function initNav(){
  document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active");
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active")); $(btn.dataset.page).classList.add("active");
    renderAll();
  }));
}
function initPrice(){
  const vc=$("vehicleCategory"), pt=$("problemType");
  Object.keys(priceData).forEach(k=>vc.add(new Option(k,k)));
  function fillProblems(){pt.innerHTML="";Object.keys(priceData[vc.value]).forEach(k=>pt.add(new Option(k,k)))}
  vc.addEventListener("change",fillProblems); fillProblems();
  $("calculatePrice").addEventListener("click",()=>{
    const [original, secondhand, marketRepair, sxRepair] = priceData[vc.value][pt.value];
    const saving = original - sxRepair;
    $("priceResult").innerHTML = `<h2>${vc.value} - ${pt.value}</h2>
      <div class="price-grid">
        <div class="price-row"><span>Original Replacement Estimate</span><b>${money(original)}+</b></div>
        <div class="price-row"><span>Second-Hand Part Market</span><b>${money(secondhand)}±</b></div>
        <div class="price-row"><span>General Market Repair</span><b>${money(marketRepair)}±</b></div>
        <div class="price-row"><span>SuspensionX Repair Route</span><b>${money(sxRepair)} onwards</b></div>
      </div>
      <p class="save">Potential saving up to ${money(saving)}</p>
      <p class="muted small">This is an indicative range only. Final quotation requires inspection, part condition check and technician confirmation.</p>`;
  });
}
function initForms(){
  $("leadForm").addEventListener("submit",e=>{
    e.preventDefault(); const fd=new FormData(e.target);
    const job={id:uid(),name:fd.get("name"),phone:fd.get("phone"),car:`${fd.get("brand")} ${fd.get("model")||""}`.trim(),source:"Website Enquiry",status:"New Enquiry",dealerCost:0,retailPrice:0,warranty:6,agent:"",note:`Issue: ${fd.get("issue")}. Previous quote: ${fd.get("previousQuote")||"N/A"}. Message: ${fd.get("message")||""}`,created:new Date().toISOString()};
    const jobs=getJobs(); jobs.unshift(job); setJobs(jobs); alert("Enquiry saved into Owner Back-End demo."); e.target.reset(); renderAll();
  });
  $("seedDemo").addEventListener("click",()=>{setJobs(defaultJobs); renderAll()});
  $("addManualLead").addEventListener("click",()=>{
    const name=$("manualName").value||"Manual Lead"; const phone=$("manualPhone").value||""; const car=$("manualCar").value||"Car model pending"; const source=$("manualSource").value;
    const jobs=getJobs(); jobs.unshift({id:uid(),name,phone,car,source,status:"New Enquiry",dealerCost:0,retailPrice:0,warranty:6,agent:"",note:"Manual lead added.",created:new Date().toISOString()}); setJobs(jobs); renderAll();
    ["manualName","manualPhone","manualCar"].forEach(id=>$(id).value="");
  });
  $("saveFloat").addEventListener("click",()=>{setFloat({target:+$("floatTarget").value,balance:+$("floatBalance").value}); renderAll()});
  $("searchJobs").addEventListener("input",renderJobs);
  $("saveJob").addEventListener("click",saveSelectedJob);
  $("copyWhatsapp").addEventListener("click",copyWhatsapp);
  $("exportCsv").addEventListener("click",exportCsv);
  $("printReport").addEventListener("click",()=>window.print());
}
function renderStats(){
  const jobs=getJobs(), f=getFloat(); const revenue=jobs.reduce((s,j)=>s+Number(j.retailPrice||0),0), cost=jobs.reduce((s,j)=>s+Number(j.dealerCost||0),0), profit=revenue-cost;
  const active=jobs.filter(j=>!["Delivered / Collected"].includes(j.status)).length;
  $("stats").innerHTML = `<div class="stat"><span>Total Leads</span><b>${jobs.length}</b></div><div class="stat"><span>Active Jobs</span><b>${active}</b></div><div class="stat"><span>Retail Sales</span><b>${money(revenue)}</b></div><div class="stat"><span>Gross Profit</span><b>${money(profit)}</b></div><div class="stat"><span>Float Balance</span><b>${money(f.balance)}</b></div>`;
  $("floatTarget").value=f.target; $("floatBalance").value=f.balance;
}
function renderJobs(){
  const q=($("searchJobs")?.value||"").toLowerCase(); const tbody=document.querySelector("#jobsTable tbody"); if(!tbody) return;
  const jobs=getJobs().filter(j=>JSON.stringify(j).toLowerCase().includes(q));
  tbody.innerHTML = jobs.map(j=>`<tr><td>${j.id}</td><td><b>${j.name}</b><br><span class="muted">${j.phone}</span></td><td>${j.car}</td><td>${j.source}</td><td><span class="pill">${j.status}</span></td><td>${money(j.dealerCost)}</td><td>${money(j.retailPrice)}</td><td>${money((j.retailPrice||0)-(j.dealerCost||0))}</td><td>${j.warranty||0} mths</td><td><button class="action-btn" onclick="selectJob('${j.id}')">Edit</button></td></tr>`).join("");
}
window.selectJob=function(id){
  selectedJobId=id; const j=getJobs().find(x=>x.id===id); if(!j)return;
  $("selectedJobHint").textContent=`Editing ${j.id} - ${j.name}`; $("jobEditor").classList.remove("hidden");
  $("editStatus").innerHTML=""; statusList.forEach(s=>$("editStatus").add(new Option(s,s))); $("editStatus").value=j.status;
  $("editDealerCost").value=j.dealerCost||0; $("editRetailPrice").value=j.retailPrice||0; $("editWarranty").value=j.warranty||6; $("editAgent").value=j.agent||""; $("editNote").value=j.note||"";
}
function saveSelectedJob(){
  const jobs=getJobs(); const idx=jobs.findIndex(j=>j.id===selectedJobId); if(idx<0)return alert("Select a job first.");
  jobs[idx]={...jobs[idx],status:$("editStatus").value,dealerCost:+$("editDealerCost").value,retailPrice:+$("editRetailPrice").value,warranty:+$("editWarranty").value,agent:$("editAgent").value,note:$("editNote").value,updated:new Date().toISOString()}; setJobs(jobs); renderAll(); alert("Job updated.");
}
function copyWhatsapp(){
  const j=getJobs().find(x=>x.id===selectedJobId); if(!j)return;
  const msg=`Hi boss, update for your ${j.car}: ${j.status}. ${j.note || "Our team will update you again once the next step is completed."}\n\nEstimated warranty record: ${j.warranty||6} months after completion. Thank you.`;
  navigator.clipboard.writeText(msg).then(()=>alert("WhatsApp update copied."));
}
function renderReport(){
  const jobs=getJobs(), revenue=jobs.reduce((s,j)=>s+Number(j.retailPrice||0),0), cost=jobs.reduce((s,j)=>s+Number(j.dealerCost||0),0), profit=revenue-cost;
  const bySource={}; jobs.forEach(j=>bySource[j.source]=(bySource[j.source]||0)+1);
  $("reportBox").innerHTML=`<h3>Report Summary</h3><p>Total jobs/leads: <b>${jobs.length}</b></p><p>Total retail sales: <b>${money(revenue)}</b></p><p>Total dealer cost: <b>${money(cost)}</b></p><p>Gross profit: <b>${money(profit)}</b></p><h4>Lead Source</h4>${Object.entries(bySource).map(([k,v])=>`<p>${k}: <b>${v}</b></p>`).join("")}<p class="muted small">Use Print Report for monthly/audit file. Export CSV for accountant or yearly tracking.</p>`;
}
function renderStatus(){
  const jobs=getJobs(); const j=jobs.find(x=>x.id===selectedJobId)||jobs[0];
  if(!j){$("customerStatus").innerHTML="<p>No job selected yet.</p>";return;}
  const current=statusList.indexOf(j.status);
  $("customerStatus").innerHTML=`<div class="status-meta"><div><span class="muted">Job ID</span><h3>${j.id}</h3></div><div><span class="muted">Vehicle</span><h3>${j.car}</h3></div><div><span class="muted">Current Status</span><h3>${j.status}</h3></div></div><div class="timeline">${statusList.slice(1,12).map((s,i)=>`<div class="item ${i<current-1?'done':''} ${i===current-1?'current':''}"><div class="dot"></div><div><b>${s}</b><p class="muted">${s===j.status?(j.note||"Latest update from workshop."):""}</p></div></div>`).join("")}</div>`;
}
function exportCsv(){
  const jobs=getJobs(); const headers=["ID","Name","Phone","Car","Source","Status","Dealer Cost","Retail Price","Profit","Warranty","Agent","Note","Created"];
  const rows=jobs.map(j=>[j.id,j.name,j.phone,j.car,j.source,j.status,j.dealerCost,j.retailPrice,(j.retailPrice||0)-(j.dealerCost||0),j.warranty,j.agent,j.note,j.created]);
  const csv=[headers,...rows].map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="suspensionx-jobs.csv"; a.click();
}
function renderAll(){renderStats();renderJobs();renderReport();renderStatus()}
function init(){initNav();initPrice();initForms(); if(!localStorage.getItem("sx_jobs"))setJobs(defaultJobs); statusList.forEach(s=>{}); renderAll()}
init();
