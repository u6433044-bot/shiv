const KEY="shivaya_tasks";let tasks=JSON.parse(localStorage.getItem(KEY)||"null")||[
{id:"1",title:"Complete ML assignment",type:"Assignment",priority:"High",date:"2026-08-24T19:00",repeat:"none",done:false,notes:""},
{id:"2",title:"DSA revision",type:"Study",priority:"Medium",date:"2026-08-24T21:00",repeat:"none",done:false,notes:""},
{id:"3",title:"DBMS project presentation",type:"Event",priority:"High",date:"2026-08-26T10:00",repeat:"none",done:false,notes:""},
{id:"4",title:"Aarav's Birthday",type:"Birthday",priority:"Low",date:"2026-08-29T09:00",repeat:"yearly",done:false,notes:""}];
let filter="all";
const $=x=>document.getElementById(x),save=()=>{localStorage.setItem(KEY,JSON.stringify(tasks));render()},same=(a,b)=>a.toDateString()===b.toDateString();
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmt(d){return new Date(d).toLocaleString("en-IN",{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}
function card(t){return `<div class="task"><button class="check ${t.done?"done":""}" onclick="toggleTask('${t.id}')">${t.done?"✓":""}</button><div class="info"><b class="${t.done?"strike":""}">${esc(t.title)}</b><small>${fmt(t.date)}${t.repeat!=="none"?" • ↻ "+t.repeat:""}</small></div><span class="tag">${t.type}</span><span class="pri ${t.priority.toLowerCase()}">${t.priority}</span><button class="del" onclick="deleteTask('${t.id}')">×</button></div>`}
function render(){
 let now=new Date(),today=tasks.filter(t=>same(new Date(t.date),now)).sort((a,b)=>new Date(a.date)-new Date(b.date)),up=tasks.filter(t=>new Date(t.date)>now&&!same(new Date(t.date),now)).sort((a,b)=>new Date(a.date)-new Date(b.date));
 $("done").textContent=tasks.filter(t=>t.done).length;$("pending").textContent=tasks.filter(t=>!t.done).length;$("high").textContent=tasks.filter(t=>!t.done&&t.priority==="High").length;$("heroText").textContent=`You have ${tasks.filter(t=>!t.done).length} pending item(s) across your schedule.`;
 $("today").innerHTML=today.length?today.map(card).join(""):"<div class='card'>Nothing planned for today. Add something meaningful.</div>";
 $("upcoming").innerHTML=up.length?up.slice(0,5).map(card).join(""):"<div class='card'>No upcoming events.</div>";
 let q=($("search")?.value||"").toLowerCase();let all=tasks.filter(t=>(filter==="all"||t.type===filter)&&(t.title+" "+t.type+" "+t.notes).toLowerCase().includes(q)).sort((a,b)=>new Date(a.date)-new Date(b.date));$("all").innerHTML=all.length?all.map(card).join(""):"<div class='card'>No matching reminders.</div>";
 $("academic").innerHTML=tasks.filter(t=>["Assignment","Exam","Study"].includes(t.type)).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(t=>`<div class="task"><div class="info"><b>${esc(t.title)}</b><small>${t.type} • ${fmt(t.date)}</small></div></div>`).join("")||"<p>No academic work yet.</p>";
 calendar();
}
function calendar(){
 let n=new Date(),first=new Date(n.getFullYear(),n.getMonth(),1),last=new Date(n.getFullYear(),n.getMonth()+1,0);$("month").textContent=n.toLocaleDateString("en-IN",{month:"long",year:"numeric"}).toUpperCase();let s=first.getDay(),total=Math.ceil((s+last.getDate())/7)*7,h="";
 for(let i=0;i<total;i++){let d=i-s+1;if(d<1||d>last.getDate()){h+='<div class="day"></div>';continue}let date=new Date(n.getFullYear(),n.getMonth(),d),hits=tasks.filter(t=>same(new Date(t.date),date));h+=`<div class="day ${same(date,n)?"today":""}"><b>${d}</b>${hits.map(t=>`<span class="event">${esc(t.title)}</span>`).join("")}</div>`}$("grid").innerHTML=h;
}
function toggleTask(id){tasks=tasks.map(t=>t.id===id?{...t,done:!t.done}:t);save();say("Task updated")}
function deleteTask(id){tasks=tasks.filter(t=>t.id!==id);save();say("Removed from Shivaya")}
window.toggleTask=toggleTask;window.deleteTask=deleteTask;
function say(t){$("msg").textContent=t;$("msg").style.display="block";setTimeout(()=>$("msg").style.display="none",2200)}
function openModal(type="Task"){$("modal").classList.add("open");$("type").value=type;let d=new Date(Date.now()+3600000);$("date").value=d.toISOString().slice(0,16);$("taskTitle").focus()}
function closeModal(){$("modal").classList.remove("open");$("form").reset()}
window.openModal=openModal;
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".page").forEach(p=>p.classList.remove("show"));$(b.dataset.page).classList.add("show");document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("title").textContent=b.dataset.page==="home"?"Good evening 👋":b.dataset.page[0].toUpperCase()+b.dataset.page.slice(1)});
document.querySelectorAll(".filters button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;render()});
$("search").oninput=render;$("notify").onclick=enableNotifications;
$("form").onsubmit=e=>{e.preventDefault();let t={id:Date.now().toString(),title:$("taskTitle").value.trim(),type:$("type").value,priority:$("priority").value,date:$("date").value,repeat:$("repeat").value,notes:$("notes").value,done:false};tasks.push(t);save();closeModal();say("Added to Shivaya")};
async function enableNotifications(){if(!("Notification"in window)){say("Notifications are not supported in this browser.");return}let p=await Notification.requestPermission();if(p==="granted"){new Notification("Shivaya",{body:"Your reminders are ready."});say("Notifications enabled")}else say("Notification permission was not granted")}
render();