const $ = (selector) => document.querySelector(selector);
const today = new Date();
const todayString = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
const dayNumber = (iso) => {
  if (!iso) return NaN;
  const part=iso.split('-').map(Number);
  return Math.floor(Date.UTC(part[0],part[1]-1,part[2])/86400000);
};
const fromDayNumber = (number) => new Date(number*86400000).toISOString().slice(0,10);
const formatDate = (iso) => iso ? new Date(iso+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : 'Not entered';
let data={periods:[],flows:[],moods:[],settings:{cycleLength:28,periodLength:5}};
$('#period-start').max=todayString;$('#period-end').max=todayString;$('#flow-date').max=todayString;
$('#mood-date').value=todayString;$('#mood-date').max=todayString;

async function api(path, options={}) {
  const response=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{})}});
  let body={};
  try{body=await response.json();}catch{}
  if(!response.ok)throw new Error(body.error||'Could not connect to the tracker.');
  return body;
}
function feedback(message){$('#auth-feedback').textContent=message;}
function showUnlocked(){
  $('#tracker-auth').hidden=true;$('#tracker-content').hidden=false;$('#lock-tracker').hidden=false;
  $('#cycle-length').value=data.settings.cycleLength;$('#period-length').value=data.settings.periodLength;
  $('#mood-date').value=todayString;renderAll();
}
function displayGate(status){
  $('#tracker-auth').hidden=false;$('#tracker-content').hidden=true;$('#lock-tracker').hidden=true;
  $('#setup-form').hidden=true;$('#login-form').hidden=true;
  if(!status.ready){$('#auth-title').textContent='Tracker setup needed';$('#auth-copy').textContent='This page needs its Cloudflare database and secret settings before it can save shared entries.';feedback('Open tracker.html through your published Cloudflare Pages site after connecting the backend.');return;}
  if(status.authenticated){loadData().then(showUnlocked).catch(error=>feedback(error.message));return;}
  if(status.configured){$('#auth-title').textContent='Unlock cycle notes';$('#auth-copy').textContent='Enter your shared passphrase to continue.';$('#login-form').hidden=false;feedback('');return;}
  $('#auth-title').textContent='Set your shared passcode';$('#auth-copy').textContent='Enter the secret phrase you configured in Cloudflare. That phrase becomes the shared passcode.';$('#setup-form').hidden=!status.setupAvailable;
  if(!status.setupAvailable)feedback('The setup phrase and session secret still need to be added in Cloudflare.');
  else feedback('Enter the same private secret phrase you saved in Cloudflare (at least 20 characters).');
}
async function loadData(){data=await api('/api/tracker/data');}
async function refreshData(){await loadData();renderAll();}
$('#login-form').addEventListener('submit',async(event)=>{
  event.preventDefault();feedback('Checking passphrase…');
  try{await api('/api/tracker/session',{method:'POST',body:JSON.stringify({passcode:$('#login-passcode').value})});$('#login-passcode').value='';await refreshData();showUnlocked();feedback('');}
  catch(error){feedback(error.message);}
});
$('#setup-form').addEventListener('submit',async(event)=>{
  event.preventDefault();feedback('Setting your shared passcode…');
  try{await api('/api/tracker/setup',{method:'POST',body:JSON.stringify({setupPhrase:$('#setup-phrase').value})});$('#setup-form').reset();await refreshData();showUnlocked();feedback('');}
  catch(error){feedback(error.message);}
});
$('#lock-tracker').addEventListener('click',async()=>{
  try{await api('/api/tracker/session',{method:'DELETE'});}catch{}
  $('#tracker-content').hidden=true;$('#lock-tracker').hidden=true;
  displayGate({ready:true,configured:true,authenticated:false});
});
async function start(){
  try{displayGate(await api('/api/tracker/status'));}
  catch{displayGate({ready:false});}
}
function getCycleLength(starts){
  const sorted=starts.slice().sort((a,b)=>dayNumber(a)-dayNumber(b)),intervals=[];
  for(let i=1;i<sorted.length;i++){const n=dayNumber(sorted[i])-dayNumber(sorted[i-1]);if(n>=18&&n<=45)intervals.push(n);}
  if(!intervals.length)return Number(data.settings.cycleLength)||28;
  const recent=intervals.slice(-6);return Math.round(recent.reduce((sum,n)=>sum+n,0)/recent.length);
}
function renderPhase(){
  const starts=data.periods.map(item=>item.startDate).filter(Boolean).sort((a,b)=>dayNumber(a)-dayNumber(b));
  const hero=$('#phase-card'),next=$('#next-period'),length=getCycleLength(starts);
  $('#cycle-length-display').textContent=length;$('#cycle-count').textContent=starts.length.toLocaleString();
  if(!starts.length){hero.className='cycle-hero phase-menstrual';$('#phase-kicker').textContent='YOUR CYCLE, YOUR NOTES';$('#phase-name').textContent='Your cycle, gently.';$('#phase-description').textContent='Log a period start to see an estimated phase here.';$('#phase-day').textContent='';next.textContent='—';return;}
  const start=starts[starts.length-1],cycleDay=dayNumber(todayString)-dayNumber(start)+1,expected=fromDayNumber(dayNumber(start)+length);
  const currentPeriod=data.periods.find(item=>item.startDate===start);
  const noBleed=data.flows.filter(item=>item.date>=start&&item.date<=todayString&&item.flow==='No bleeding').sort((a,b)=>dayNumber(a.date)-dayNumber(b.date));
  const lastNoBleed=noBleed.length?noBleed[noBleed.length-1]:null;
  const estimatedBleedDays=currentPeriod&&currentPeriod.endDate?dayNumber(currentPeriod.endDate)-dayNumber(start)+1:(lastNoBleed?Math.max(1,dayNumber(lastNoBleed.date)-dayNumber(start)):Number(data.settings.periodLength));
  next.textContent=formatDate(expected);
  const ovulationDay=Math.max(8,length-14);let key,name,description;
  if(cycleDay<=estimatedBleedDays){key='menstrual';name='Menstrual phase';description='A softer pace and a little extra care may feel good today.';}
  else if(cycleDay<ovulationDay-2){key='follicular';name='Follicular phase · estimate';description='This phase is estimated from the cycle dates logged.';}
  else if(cycleDay<=ovulationDay+1){key='ovulatory';name='Ovulatory phase · estimate';description='Calendar estimate only; period dates cannot confirm ovulation.';}
  else if(cycleDay<=length){key='luteal';name='Luteal phase · estimate';description='This phase is estimated from the cycle dates logged.';}
  else{key='luteal';name='Past the estimated date';description='Cycles can vary. Log the next period when it starts to update this estimate.';}
  hero.className='cycle-hero phase-'+key;$('#phase-kicker').textContent='AN ESTIMATE FROM YOUR LOG';$('#phase-name').textContent=name;$('#phase-description').textContent=description;
  $('#phase-day').textContent='Cycle day '+cycleDay+' · next period estimate: '+formatDate(expected);
}
function renderPeriods(){
  const list=$('#period-list');list.replaceChildren();
  data.periods.slice().sort((a,b)=>dayNumber(b.startDate)-dayNumber(a.startDate)).slice(0,8).forEach(item=>{
    const li=document.createElement('li');li.textContent='Started '+formatDate(item.startDate)+(item.endDate?' · Ended '+formatDate(item.endDate):' · End date not entered');list.append(li);
  });
  if(!list.children.length){const li=document.createElement('li');li.className='empty-state';li.textContent='Your saved period dates will show here.';list.append(li);}
}
function renderFlows(){
  const list=$('#flow-list');list.replaceChildren();
  data.flows.slice().sort((a,b)=>dayNumber(b.date)-dayNumber(a.date)).slice(0,10).forEach(item=>{
    const li=document.createElement('li');li.className='flow-entry';const date=document.createElement('strong'),flow=document.createElement('span');
    date.textContent=formatDate(item.date);flow.textContent=item.flow;li.append(date,flow);list.append(li);
  });
  if(!list.children.length){const li=document.createElement('li');li.className='empty-state';li.textContent='Daily flow entries will show here.';list.append(li);}
}
function renderMoods(){
  const list=$('#mood-list');list.replaceChildren();
  data.moods.slice().sort((a,b)=>dayNumber(b.date)-dayNumber(a.date)).slice(0,7).forEach(item=>{
    const li=document.createElement('li'),head=document.createElement('div'),date=document.createElement('strong'),mood=document.createElement('em');
    head.className='mood-entry';date.textContent=formatDate(item.date);mood.textContent=item.mood;head.append(date,mood);li.append(head);
    if(item.note){const note=document.createElement('span');note.className='mood-entry-note';note.textContent=item.note;li.append(note);}list.append(li);
  });
  if(!list.children.length){const li=document.createElement('li');li.className='empty-state';li.textContent='Your mood notes will show here.';list.append(li);}
}
function renderAll(){renderPeriods();renderFlows();renderMoods();renderPhase();}
$('#period-form').addEventListener('submit',async(event)=>{
  event.preventDefault();const startDate=$('#period-start').value,endDate=$('#period-end').value;
  if(!startDate||dayNumber(startDate)>dayNumber(todayString)||(endDate&&(dayNumber(endDate)<dayNumber(startDate)||dayNumber(endDate)>dayNumber(todayString)))){alert('Please check the dates. The end date must be on or after the start date.');return;}
  try{await api('/api/tracker/data',{method:'POST',body:JSON.stringify({type:'period',startDate,endDate})});await refreshData();event.currentTarget.reset();}
  catch(error){alert(error.message);}
});
$('#flow-form').addEventListener('submit',async(event)=>{
  event.preventDefault();const form=new FormData(event.currentTarget),flow=form.get('flow'),date=$('#flow-date').value;
  if(!flow||!date||dayNumber(date)>dayNumber(todayString))return;
  try{await api('/api/tracker/data',{method:'POST',body:JSON.stringify({type:'flow',date,flow})});await refreshData();event.currentTarget.reset();$('#flow-date').value=todayString;}
  catch(error){alert(error.message);}
});
$('#mood-form').addEventListener('submit',async(event)=>{
  event.preventDefault();const form=new FormData(event.currentTarget),mood=form.get('mood'),date=$('#mood-date').value;
  if(!mood||!date||dayNumber(date)>dayNumber(todayString))return;
  try{await api('/api/tracker/data',{method:'POST',body:JSON.stringify({type:'mood',date,mood,note:$('#mood-note').value.trim()})});await refreshData();event.currentTarget.reset();$('#mood-date').value=todayString;}
  catch(error){alert(error.message);}
});
$('#change-passcode-form').addEventListener('submit',async(event)=>{
  event.preventDefault();const feedback=$('#passcode-feedback'),next=$('#changed-passcode').value;
  if(next!==$('#confirm-changed-passcode').value){feedback.textContent='Those passphrases don’t match.';return;}
  feedback.textContent='Updating…';
  try{await api('/api/tracker/passcode',{method:'POST',body:JSON.stringify({currentPasscode:$('#current-passcode').value,newPasscode:next})});event.currentTarget.reset();feedback.textContent='Shared passphrase updated.';}
  catch(error){feedback.textContent=error.message;}
});
$('#save-settings').addEventListener('click',async()=>{
  try{await api('/api/tracker/data',{method:'POST',body:JSON.stringify({type:'settings',cycleLength:Number($('#cycle-length').value),periodLength:Number($('#period-length').value)})});await refreshData();}
  catch(error){alert(error.message);}
});
async function clearHistory(type,message){
  if(!confirm(message))return;
  try{await api('/api/tracker/data?type='+encodeURIComponent(type),{method:'DELETE'});await refreshData();}
  catch(error){alert(error.message);}
}
$('#clear-periods').addEventListener('click',()=>clearHistory('periods','Clear all saved period dates?'));
$('#clear-flows').addEventListener('click',()=>clearHistory('flows','Clear all daily flow logs?'));
$('#clear-moods').addEventListener('click',()=>clearHistory('moods','Clear all daily mood logs?'));
start();
