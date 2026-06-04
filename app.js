const statusList = [
  "New Enquiry","Inspection Booked","Car Received","Inspection Started","Problem Confirmed","Quotation Sent","Customer Approved","Repair In Progress","Reinstalling","Testing","Ready for Collection","Delivered / Collected","Warranty Case"
];
const priceData = {
  "Continental": {"Air suspension warning":[18000,9000,4500,2800],"Absorber leaking":[12000,6500,3500,2200],"Car one side lower":[15000,8000,4200,2800],"Workshop cannot solve":[16000,8500,5000,3200]},
  "Luxury SUV": {"Air suspension warning":[35000,18000,9000,6500],"Absorber leaking":[22000,12000,8000,5200],"Car one side lower":[28000,16000,8500,6000],"Workshop cannot solve":[32000,18000,10000,7000]},
  "Porsche / Performance": {"Air suspension warning":[65000,30000,15000,9500],"Absorber leaking":[42000,22000,12000,7500],"Car one side lower":[55000,25000,14500,8800],"Workshop cannot solve":[60000,28000,16000,10000]},
  "Supercar": {"Air suspension warning":[180000,90000,50000,28000],"Absorber leaking":[120000,65000,38000,22000],"Car one side lower":[150000,75000,45000,26000],"Workshop cannot solve":[200000,100000,65000,35000]},
  "EV / Future Performance": {"Adaptive suspension fault":[45000,22000,14000,8800],"Air suspension warning":[60000,30000,18000,12000],"Workshop cannot solve":[70000,35000,22000,15000]}
};
const defaultJobs = [
  {id:"SX1001",memberId:"M1001",name:"Mr Tan",phone:"012-3338888",car:"Porsche Panamera 2018",source:"Direct Customer",status:"Repair In Progress",dealerCost:8200,retailPrice:11800,warranty:6,addon:"Yes",addonPlan:"Extended Care - 12 months",addonPrice:1200,delivery:"Self collect",agent:"",note:"Rear air strut leak confirmed. Rebuild in progress. Video update sent.",created:new Date().toISOString()},
  {id:"SX1002",memberId:"M1002",name:"Dealer Wong",phone:"016-2221111",car:"Mercedes-Benz W222 S400",source:"Used Car Dealer",status:"Quotation Sent",dealerCost:4600,retailPrice:6800,warranty:6,addon:"No",addonPlan:"None",addonPrice:0,delivery:"Tow truck arranged",agent:"AG-WONG",note:"Front right air suspension unable to hold height. Waiting customer approval.",created:new Date().toISOString()},
  {id:"SX1003",memberId:"M1003",name:"Mr Lim",phone:"017-8889999",car:"Lamborghini Huracan",source:"Direct Customer",status:"Inspection Booked",dealerCost:25000,retailPrice:35000,warranty:6,addon:"Yes",addonPlan:"Premium Add-On - 18 months",addonPrice:2500,delivery:"Pickup arranged",agent:"",note:"Original replacement quote above RM150k. Booking required due to workshop capacity.",created:new Date().toISOString()},
  {id:"SX1004",memberId:"M1001",name:"Mr Tan",phone:"012-3338888",car:"Range Rover Vogue 2020",source:"Direct Customer",status:"Delivered / Collected",dealerCost:7200,retailPrice:9800,warranty:6,addon:"No",addonPlan:"None",addonPrice:0,delivery:"Delivery arranged",agent:"",note:"Previous repair completed. Customer eligible for returning member benefit.",created:new Date(Date.now()-86400000*20).toISOString(),collectedAt:new Date(Date.now()-86400000*16).toISOString()}
];
let selectedJobId = null;
let selectedMemberId = null;

function $(id){return document.getElementById(id)}
function money(n){return "RM" + Number(n||0).toLocaleString()}
function getJobs(){return JSON.parse(localStorage.getItem("sx_jobs")||"[]")}
function setJobs(jobs){localStorage.setItem("sx_jobs",JSON.stringify(jobs))}
function getFloat(){return JSON.parse(localStorage.getItem("sx_float")||'{"target":50000,"balance":50000}')}
function setFloat(f){localStorage.setItem("sx_float",JSON.stringify(f))}
function uid(prefix="SX"){return prefix + Math.floor(1000 + Math.random()*9000)}
function getStatusJobId(){return localStorage.getItem("sx_status_job") || selectedJobId || new URLSearchParams(location.search).get("job") || location.hash.replace("#job=","")}
function esc(str){return String(str??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]))}
function profit(j){return Number(j.retailPrice||0) + Number(j.addonPrice||0) - Number(j.dealerCost||0)}
function statusClass(s){ if(s==="Ready for Collection"||s==="Delivered / Collected") return "ready"; if(s.includes("Warranty")) return "red"; if(["Quotation Sent","Customer Approved","Testing"].includes(s)) return "warning"; return ""; }

function initNav(){
  document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active");
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active")); $(btn.dataset.page).classList.add("active");
    renderAll();
  }));
}
function goPage(page){
  const btn=[...document.querySelectorAll(".nav-btn")].find(b=>b.dataset.page===page);
  if(btn) btn.click();
}
function initPrice(){
  const vc=$("vehicleCategory"), pt=$("problemType");
  Object.keys(priceData).forEach(k=>vc.add(new Option(k,k)));
  function fillProblems(){pt.innerHTML="";Object.keys(priceData[vc.value]).forEach(k=>pt.add(new Option(k,k)))}
  vc.addEventListener("change",fillProblems); fillProblems();
  $("calculatePrice").addEventListener("click",()=>{
    const [original, secondhand, marketRepair, sxRepair] = priceData[vc.value][pt.value];
    const saving = original - sxRepair;
    $("priceResult").innerHTML = `<h2>${esc(vc.value)} - ${esc(pt.value)}</h2>
      <div class="price-grid">
        <div class="price-row"><span>Original Replacement Estimate</span><b>${money(original)}+</b></div>
        <div class="price-row"><span>Second-Hand Part Market</span><b>${money(secondhand)}±</b></div>
        <div class="price-row"><span>General Market Repair</span><b>${money(marketRepair)}±</b></div>
        <div class="price-row"><span>SuspensionX Repair Route</span><b>${money(sxRepair)} onwards</b></div>
      </div>
      <p class="save">Potential saving up to ${money(saving)}</p>
      <p class="muted small">Indicative range only. Final quotation requires inspection, part condition check and technician confirmation.</p>`;
  });
}
function initForms(){
  $("leadForm").addEventListener("submit",e=>{
    e.preventDefault(); const fd=new FormData(e.target);
    const memberId=findOrCreateMemberId(fd.get("phone"),fd.get("name"));
    const job={id:uid("SX"),memberId,name:fd.get("name"),phone:fd.get("phone"),car:`${fd.get("brand")} ${fd.get("model")||""}`.trim(),source:"Website Enquiry",status:"New Enquiry",dealerCost:0,retailPrice:0,warranty:6,addon:"No",addonPlan:"None",addonPrice:0,delivery:"Self collect",agent:"",note:`Issue: ${fd.get("issue")}. Previous quote: ${fd.get("previousQuote")||"N/A"}. Message: ${fd.get("message")||""}`,created:new Date().toISOString()};
    const jobs=getJobs(); jobs.unshift(job); setJobs(jobs); selectedJobId=job.id; localStorage.setItem("sx_status_job",job.id);
    alert(`Enquiry saved. Customer membership created/updated. Status link ID: ${job.id}`); e.target.reset(); renderAll(); goPage("status");
  });
  $("seedDemo").addEventListener("click",()=>{setJobs(defaultJobs); selectedJobId="SX1001"; localStorage.setItem("sx_status_job","SX1001"); renderAll()});
  $("resetDemo").addEventListener("click",()=>{ if(confirm("Reset all demo data?")){localStorage.removeItem("sx_jobs");localStorage.removeItem("sx_float");localStorage.removeItem("sx_status_job");setJobs(defaultJobs);renderAll();} });
  $("addManualLead").addEventListener("click",()=>{
    const name=$("manualName").value||"Manual Lead"; const phone=$("manualPhone").value||""; const car=$("manualCar").value||"Car model pending"; const source=$("manualSource").value;
    const memberId=findOrCreateMemberId(phone,name); const jobs=getJobs(); const job={id:uid("SX"),memberId,name,phone,car,source,status:"New Enquiry",dealerCost:0,retailPrice:0,warranty:6,addon:"No",addonPlan:"None",addonPrice:0,delivery:"Self collect",agent:"",note:"Manual lead added.",created:new Date().toISOString()};
    jobs.unshift(job); setJobs(jobs); selectedJobId=job.id; localStorage.setItem("sx_status_job",job.id); renderAll();
    ["manualName","manualPhone","manualCar"].forEach(id=>$(id).value="");
  });
  $("saveFloat").addEventListener("click",()=>{setFloat({target:+$("floatTarget").value,balance:+$("floatBalance").value}); renderAll()});
  $("searchJobs").addEventListener("input",renderJobs);
  $("memberSearch").addEventListener("input",renderMembers);
  $("refreshMembers").addEventListener("click",renderMembers);
  $("saveJob").addEventListener("click",saveSelectedJob);
  $("copyWhatsapp").addEventListener("click",copyWhatsapp);
  $("openStatus").addEventListener("click",()=>{ if(selectedJobId){ localStorage.setItem("sx_status_job",selectedJobId); $("statusJobId").value=selectedJobId; goPage("status"); }});
  $("deleteJob").addEventListener("click",deleteSelectedJob);
  $("exportCsv").addEventListener("click",exportCsv);
  $("printReport").addEventListener("click",()=>window.print());
  $("loadStatusById").addEventListener("click",()=>{ const id=$("statusJobId").value.trim(); if(id){localStorage.setItem("sx_status_job",id); selectedJobId=id; renderStatus();} });
}
function findOrCreateMemberId(phone,name){
  const jobs=getJobs();
  const existing=jobs.find(j=>j.phone && phone && j.phone.trim()===phone.trim());
  return existing?.memberId || uid("M");
}
function getMembers(){
  const map={};
  getJobs().forEach(j=>{
    const key=j.memberId || findOrCreateMemberId(j.phone,j.name);
    if(!map[key]) map[key]={id:key,name:j.name,phone:j.phone,jobs:[],vehicles:new Set(),totalSpent:0,totalProfit:0};
    map[key].name=j.name||map[key].name; map[key].phone=j.phone||map[key].phone; map[key].jobs.push(j); map[key].vehicles.add(j.car); map[key].totalSpent+=Number(j.retailPrice||0)+Number(j.addonPrice||0); map[key].totalProfit+=profit(j);
  });
  return Object.values(map).map(m=>({...m,vehicles:[...m.vehicles]})).sort((a,b)=>b.jobs.length-a.jobs.length);
}
function renderStats(){
  const jobs=getJobs(), f=getFloat(); const revenue=jobs.reduce((s,j)=>s+Number(j.retailPrice||0)+Number(j.addonPrice||0),0), cost=jobs.reduce((s,j)=>s+Number(j.dealerCost||0),0), gp=revenue-cost;
  const active=jobs.filter(j=>!["Delivered / Collected"].includes(j.status)).length; const members=getMembers().length;
  $("stats").innerHTML = `<div class="stat hot"><span>Total Members</span><b>${members}</b></div><div class="stat"><span>Total Leads / Jobs</span><b>${jobs.length}</b></div><div class="stat"><span>Active Jobs</span><b>${active}</b></div><div class="stat"><span>Retail + Add-On Sales</span><b>${money(revenue)}</b></div><div class="stat hot"><span>Gross Profit</span><b>${money(gp)}</b></div>`;
  $("floatTarget").value=f.target; $("floatBalance").value=f.balance;
}
function renderJobs(){
  const q=($("searchJobs")?.value||"").toLowerCase(); const tbody=document.querySelector("#jobsTable tbody"); if(!tbody) return;
  const jobs=getJobs().filter(j=>JSON.stringify(j).toLowerCase().includes(q));
  tbody.innerHTML = jobs.map(j=>`<tr><td><b>${esc(j.id)}</b><br><span class="muted">${new Date(j.created).toLocaleDateString()}</span></td><td><b>${esc(j.name)}</b><br><span class="muted">${esc(j.phone)}</span></td><td>${esc(j.car)}</td><td>${esc(j.source)}</td><td><span class="pill ${statusClass(j.status)}">${esc(j.status)}</span></td><td>${money(j.dealerCost)}</td><td>${money(j.retailPrice)}</td><td><b>${money(profit(j))}</b></td><td>${j.warranty||0} mths</td><td>${j.addon==="Yes"?`<span class="tag green">${esc(j.addonPlan)}</span><br>${money(j.addonPrice)}`:`<span class="tag">No</span>`}</td><td><button class="action-btn" onclick="selectJob('${esc(j.id)}')">Edit</button><br><button class="action-btn" onclick="openJobStatus('${esc(j.id)}')">Status</button></td></tr>`).join("");
}
window.openJobStatus=function(id){selectedJobId=id;localStorage.setItem("sx_status_job",id);$("statusJobId").value=id;goPage("status")}
window.selectJob=function(id){
  selectedJobId=id; const j=getJobs().find(x=>x.id===id); if(!j)return;
  $("selectedJobHint").textContent=`Editing ${j.id} - ${j.name}`; $("jobEditor").classList.remove("hidden");
  $("editName").value=j.name||""; $("editPhone").value=j.phone||""; $("editCar").value=j.car||""; $("editSource").value=j.source||"Direct Customer";
  $("editStatus").innerHTML=""; statusList.forEach(s=>$("editStatus").add(new Option(s,s))); $("editStatus").value=j.status;
  $("editDealerCost").value=j.dealerCost||0; $("editRetailPrice").value=j.retailPrice||0; $("editWarranty").value=j.warranty||6; $("editAgent").value=j.agent||"";
  $("editAddon").value=j.addon||"No"; $("editAddonPlan").value=j.addonPlan||"None"; $("editAddonPrice").value=j.addonPrice||0; $("editDelivery").value=j.delivery||"Self collect";
  $("editNote").value=j.note||"";
  const link = `${location.pathname}?job=${j.id}`;
  $("statusLinkBox").innerHTML = `<b>Status Link:</b> <a href="#" onclick="openJobStatus('${esc(j.id)}');return false;">Open ${esc(j.id)} customer status</a><br><span class="small">Demo link format: ${esc(link)}. Final version will generate a private secure link.</span>`;
}
function saveSelectedJob(){
  const jobs=getJobs(); const idx=jobs.findIndex(j=>j.id===selectedJobId); if(idx<0)return alert("Select a job first.");
  const old=jobs[idx]; const memberId=old.memberId || findOrCreateMemberId($("editPhone").value,$("editName").value);
  jobs[idx]={...old,memberId,name:$("editName").value,phone:$("editPhone").value,car:$("editCar").value,source:$("editSource").value,status:$("editStatus").value,dealerCost:+$("editDealerCost").value,retailPrice:+$("editRetailPrice").value,warranty:+$("editWarranty").value,agent:$("editAgent").value,addon:$("editAddon").value,addonPlan:$("editAddonPlan").value,addonPrice:+$("editAddonPrice").value,delivery:$("editDelivery").value,note:$("editNote").value,updated:new Date().toISOString()};
  if(jobs[idx].status==="Delivered / Collected" && !jobs[idx].collectedAt) jobs[idx].collectedAt=new Date().toISOString();
  setJobs(jobs); localStorage.setItem("sx_status_job",jobs[idx].id); renderAll(); selectJob(jobs[idx].id); alert("Job updated. CRM, membership and status link refreshed.");
}
function deleteSelectedJob(){
  if(!selectedJobId) return alert("Select a job first.");
  if(!confirm(`Delete ${selectedJobId}?`)) return;
  setJobs(getJobs().filter(j=>j.id!==selectedJobId)); selectedJobId=null; $("jobEditor").classList.add("hidden"); renderAll();
}
function copyWhatsapp(){
  const j=getJobs().find(x=>x.id===selectedJobId); if(!j)return alert("Select a job first.");
  const addOn = j.addon==="Yes" ? `\nProtection add-on: ${j.addonPlan} (${money(j.addonPrice)}).` : "";
  const msg=`Hi boss, update for your ${j.car}: ${j.status}.\n\n${j.note || "Our team will update you again once the next step is completed."}\n\nWarranty record: ${j.warranty||6} months.${addOn}\nCollection/Delivery: ${j.delivery||"Self collect"}.\n\nYour status ID: ${j.id}. Thank you.`;
  navigator.clipboard.writeText(msg).then(()=>alert("WhatsApp update copied."));
}
function renderReport(){
  const jobs=getJobs(), revenue=jobs.reduce((s,j)=>s+Number(j.retailPrice||0)+Number(j.addonPrice||0),0), cost=jobs.reduce((s,j)=>s+Number(j.dealerCost||0),0), gp=revenue-cost;
  const bySource={}; const byStatus={}; jobs.forEach(j=>{bySource[j.source]=(bySource[j.source]||0)+1; byStatus[j.status]=(byStatus[j.status]||0)+1;});
  const addonSales=jobs.reduce((s,j)=>s+Number(j.addonPrice||0),0); const f=getFloat();
  $("reportBox").innerHTML=`<h3>Report Summary</h3><p>Total members: <b>${getMembers().length}</b></p><p>Total jobs/leads: <b>${jobs.length}</b></p><p>Total retail sales incl. add-on: <b>${money(revenue)}</b></p><p>Total dealer cost: <b>${money(cost)}</b></p><p>Gross profit: <b>${money(gp)}</b></p><p>Warranty add-on sales: <b>${money(addonSales)}</b></p><p>Float target / balance: <b>${money(f.target)} / ${money(f.balance)}</b></p><h4>Lead Source</h4>${Object.entries(bySource).map(([k,v])=>`<p>${esc(k)}: <b>${v}</b></p>`).join("")}<h4>Status Breakdown</h4>${Object.entries(byStatus).map(([k,v])=>`<p>${esc(k)}: <b>${v}</b></p>`).join("")}<p class="muted small">Use Print Report for monthly/audit file. Export CSV for accountant or yearly tracking.</p>`;
}
function renderStatus(){
  const id=getStatusJobId(); if($("statusJobId")) $("statusJobId").value=id||"";
  const jobs=getJobs(); const j=jobs.find(x=>x.id===id)||jobs[0];
  if(!j){$("customerStatus").innerHTML="<p>No job selected yet.</p>";return;}
  localStorage.setItem("sx_status_job",j.id); selectedJobId=j.id;
  const current=statusList.indexOf(j.status); const warrantyText = j.addon==="Yes" ? `${j.warranty||6} months + ${j.addonPlan}` : `${j.warranty||6} months standard warranty`;
  $("customerStatus").innerHTML=`
    <div class="status-card-hero">
      <p class="eyebrow">Current Job</p>
      <h2>${esc(j.car)}</h2>
      <p class="muted">Hello ${esc(j.name)}, this page shows the latest repair status for your vehicle.</p>
    </div>
    <div class="status-meta">
      <div><span class="muted">Job ID</span><h3>${esc(j.id)}</h3></div>
      <div><span class="muted">Vehicle</span><h3>${esc(j.car)}</h3></div>
      <div><span class="muted">Current Status</span><h3>${esc(j.status)}</h3></div>
      <div><span class="muted">Warranty</span><h3>${esc(warrantyText)}</h3></div>
    </div>
    <div class="timeline">${statusList.slice(1,12).map((s,i)=>`<div class="item ${i<current-1?'done':''} ${i===current-1?'current':''}"><div class="dot"></div><div><b>${esc(s)}</b><p class="muted">${s===j.status?esc(j.note||"Latest update from workshop."):""}</p></div></div>`).join("")}</div>
    <div class="collect-box">
      <h3>Collection Confirmation</h3>
      <p class="muted">When the car is released, backend or customer can mark it as collected. This will update CRM history.</p>
      <p><b>Collection / Delivery:</b> ${esc(j.delivery||"Self collect")}</p>
      ${j.collectedAt?`<p class="tag green">Collected on ${new Date(j.collectedAt).toLocaleString()}</p>`:`<button class="primary" onclick="markCollected('${esc(j.id)}')">Mark as Collected</button>`}
    </div>`;
}
window.markCollected=function(id){
  const jobs=getJobs(); const idx=jobs.findIndex(j=>j.id===id); if(idx<0) return;
  jobs[idx].status="Delivered / Collected"; jobs[idx].collectedAt=new Date().toISOString(); jobs[idx].updated=new Date().toISOString();
  if(!jobs[idx].note.includes("Collected")) jobs[idx].note += " Car collected / delivered successfully.";
  setJobs(jobs); renderAll(); alert("Collection recorded in CRM.");
}
function renderMembers(){
  const q=($("memberSearch")?.value||"").toLowerCase(); const members=getMembers().filter(m=>JSON.stringify({...m,vehicles:m.vehicles}).toLowerCase().includes(q));
  const list=$("memberList"); if(!list) return;
  list.innerHTML=members.map(m=>`<div class="member-card ${m.id===selectedMemberId?'active':''}" onclick="selectMember('${esc(m.id)}')"><b>${esc(m.name)}</b><br><span class="muted">${esc(m.phone)} · ${m.vehicles.length} car(s) · ${m.jobs.length} job(s)</span><br><span class="tag green">Spent ${money(m.totalSpent)}</span><span class="tag">Profit ${money(m.totalProfit)}</span></div>`).join("") || `<p class="muted">No members found.</p>`;
  if(!selectedMemberId && members[0]) selectedMemberId=members[0].id;
  renderMemberProfile();
}
window.selectMember=function(id){selectedMemberId=id; renderMembers(); renderMemberProfile();}
function renderMemberProfile(){
  const box=$("memberProfile"); if(!box) return;
  const m=getMembers().find(x=>x.id===selectedMemberId);
  if(!m){ box.innerHTML=`<p class="muted">Select a member to view profile.</p>`; return; }
  const repeat = m.jobs.length>1;
  box.innerHTML=`<h3>${esc(m.name)}</h3><p class="muted">${esc(m.phone)} · Member ID ${esc(m.id)}</p>
    <div><span class="tag green">${m.vehicles.length} vehicle(s)</span><span class="tag">${m.jobs.length} job(s)</span><span class="tag red">${repeat?'Returning customer':'New customer'}</span></div>
    <p><b>Total Spend:</b> ${money(m.totalSpent)}<br><b>Gross Profit:</b> ${money(m.totalProfit)}</p>
    <h4>Suggested Member Benefit</h4>
    <p class="muted">${repeat?'Offer priority booking, RM200 inspection rebate, or discounted warranty add-on.':'After first completed job, offer membership record and next-car inspection discount.'}</p>
    <h4>Vehicles & Jobs</h4>
    ${m.jobs.map(j=>`<div class="vehicle-card"><b>${esc(j.car)}</b><br><span class="pill ${statusClass(j.status)}">${esc(j.status)}</span> <span class="tag">${money(j.retailPrice)} retail</span> ${j.addon==="Yes"?`<span class="tag green">${esc(j.addonPlan)}</span>`:""}<p class="muted small">${esc(j.note)}</p><button class="action-btn" onclick="selectJob('${esc(j.id)}');goPage('backend')">Edit Job</button> <button class="action-btn" onclick="openJobStatus('${esc(j.id)}')">Open Status</button></div>`).join("")}`;
}
function exportCsv(){
  const jobs=getJobs(); const headers=["ID","Member ID","Name","Phone","Car","Source","Status","Dealer Cost","Retail Price","Add-On","Add-On Plan","Add-On Price","Profit","Warranty","Delivery","Agent","Note","Created","Updated","Collected At"];
  const rows=jobs.map(j=>[j.id,j.memberId,j.name,j.phone,j.car,j.source,j.status,j.dealerCost,j.retailPrice,j.addon,j.addonPlan,j.addonPrice,profit(j),j.warranty,j.delivery,j.agent,j.note,j.created,j.updated,j.collectedAt]);
  const csv=[headers,...rows].map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="suspensionx-jobs-v2.csv"; a.click();
}
function renderAll(){renderStats();renderJobs();renderReport();renderStatus();renderMembers()}
function init(){initNav();initPrice();initForms(); if(!localStorage.getItem("sx_jobs"))setJobs(defaultJobs); if(!localStorage.getItem("sx_status_job"))localStorage.setItem("sx_status_job","SX1001"); renderAll()}
init();
