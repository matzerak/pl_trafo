'use strict';
(() => {
 const $ = id => document.getElementById(id);
 const KEY = 'physiklabor-transformator-v1';
 const texts = ['initial','rule','dc-answer','extension','answer-A','answer-B','conclusion'];
 const presets = [
  {n2:100,title:'Gleich viele Windungen',task:'U₁ = 6 V. Beide Spulen haben 100 Windungen. Welche Sekundärspannung erwartest du?'},
  {n2:200,title:'Doppelt so viele Sekundärwindungen',task:'U₁ = 6 V und N₁ = 100 bleiben gleich. N₂ = 200. Was erwartest du für U₂?'},
  {n2:50,title:'Halb so viele Sekundärwindungen',task:'U₁ = 6 V und N₁ = 100 bleiben gleich. N₂ = 50. Welche Spannung erwartest du jetzt?'}
 ];
 const fresh = () => ({version:1,texts:{},choices:{},trials:[null,null,null],first:[null,null,null],lineSamples:[],chargerSamples:[],expert:null,tab:0,experiment:0,u1:6,n1:100,n2:100,lineVoltage:20000,chargerTurns:460,started:false});
 let storageOK = true;
 let free = false, phase = 0, lastFrame = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches, dc = false, printing = false;
 const fmt = (n,d=1) => new Intl.NumberFormat('de-DE',{maximumFractionDigits:d}).format(n);
 const finitePrediction = n => typeof n === 'number' && Number.isFinite(n) && n>=0 && n<=1e6;
 let state = load();
 const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function load() {
  const base = fresh();
  try {
   const raw = localStorage.getItem(KEY);
   if(!raw) return base;
   const saved = JSON.parse(raw);
   if(!saved || saved.version!==1) return base;
   for(const key of texts) if(typeof saved.texts?.[key]==='string') base.texts[key]=saved.texts[key].slice(0,2000);
   for(const key of texts) if(Array.isArray(saved.choices?.[key])) base.choices[key]=saved.choices[key];
   for(let i=0;i<3;i++) {
    if(finitePrediction(saved.trials?.[i])) base.trials[i]=saved.trials[i];
    if(finitePrediction(saved.first?.[i])) base.first[i]=saved.first[i];
   }
   const lineValues=[20000,110000,220000,380000], turnValues=[10,20,40,80,460];
   if(Array.isArray(saved.lineSamples)) base.lineSamples=[...new Set(saved.lineSamples.filter(v=>lineValues.includes(v)))];
   if(Array.isArray(saved.chargerSamples)) base.chargerSamples=[...new Set(saved.chargerSamples.filter(v=>turnValues.includes(v)))];
   if(['A','B'].includes(saved.expert)) base.expert=saved.expert;
   for(const key of ['tab','experiment']) if([0,1,2].includes(saved[key])) base[key]=saved[key];
   if(lineValues.includes(saved.lineVoltage)) base.lineVoltage=saved.lineVoltage;
   if(turnValues.includes(saved.chargerTurns)) base.chargerTurns=saved.chargerTurns;
   base.started=saved.started===true;
   return base;
  } catch {storageOK=false;return base;}
 }
 function save() {
  try {localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}
  catch {storageOK=false;}
  storageLabel();
 }
 function storageLabel() {
  $('storage-status').hidden=storageOK;
  $('storage-status').textContent=storageOK?'':'Speichern nicht möglich · nutze „Ergebnisse sichern ↓“ im Austauschbereich.';
 }
 function feedback(id,message,type='') {
  $(id).textContent=message;$(id).className='feedback'+(type?' '+type:'');
 }
 function showTab(index,focus=false) {
  state.tab=index;
  for(let i=0;i<3;i++) {
   $('panel-'+i).hidden=i!==index;
   $('tab-'+i).setAttribute('aria-selected',String(i===index));
   $('tab-'+i).tabIndex=i===index?0:-1;
  }
  if(index===2) renderSummary();
  if(focus) {$('tab-'+index).focus();$('tab-'+index).scrollIntoView({block:'start',behavior:'auto'});}
  save();
 }
 function coil(id,x,y,width,height,count,color) {
  const turns=Math.max(2,Math.min(16,Math.round(count)));
  let paths='';
  for(let i=0;i<turns;i++) {
   const cy=y+i*height/turns;
   paths+=`<path d="M${x-width/2} ${cy} C${x-width/2-12} ${cy-9} ${x+width/2+12} ${cy-9} ${x+width/2} ${cy+5}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  }
  $(id).innerHTML=paths;
 }
 function selectExperiment(index) {
  state.experiment=index;free=false;
  state.u1=6;state.n1=100;state.n2=presets[index].n2;
  $('prediction').value=state.first[index]===null?'':String(state.first[index]).replace('.',',');
  $('experiment-title').textContent=presets[index].title;
  $('experiment-task').textContent=presets[index].task;
  document.querySelectorAll('[data-experiment]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.experiment===index)));
  $('measure').textContent=state.trials[index]!==null?'Erneut vergleichen':state.first[index]!==null?'Jetzt messen':'Überprüfen';
  feedback('prediction-feedback',state.trials[index]!==null?'Diese Messung steht bereits in deinem Protokoll. Deine erste Vermutung bleibt erhalten.':'Deine erste Vermutung bleibt im Protokoll erhalten.');
  resetHint('lab');renderLab();save();
 }
 function renderLab() {
  for(const key of ['u1','n1','n2']) $(key).value=state[key];
  $('u1-out').textContent=fmt(state.u1)+' V';$('n1-out').textContent=fmt(state.n1,0);$('n2-out').textContent=fmt(state.n2,0);
  $('u1-value').textContent=fmt(state.u1);
  const revealed=free||state.trials[state.experiment]!==null;
  $('u2-value').textContent=revealed?fmt(Physics.secondary(state.u1,state.n1,state.n2),2):'—';
  $('u2-note').textContent=revealed?'Effektivwert · ideale Wechselspannung':'Erst vermuten, dann messen';
  $('lab-mode').textContent=free?'Freies Experiment':'Versuch '+(state.experiment+1);
  $('coil-label-1').textContent='N₁ = '+fmt(state.n1,0);$('coil-label-2').textContent='N₂ = '+fmt(state.n2,0);
  $('transformer-desc').textContent=`Primärspule mit ${state.n1} Windungen, Sekundärspule mit ${state.n2} Windungen. Beide umschließen einen gemeinsamen Eisenkern. Primärspannung ${fmt(state.u1)} Volt Wechselspannung. ${revealed?'Sekundärspannung '+fmt(Physics.secondary(state.u1,state.n1,state.n2),2)+' Volt.':'Sekundärspannung nach der Vorhersage sichtbar.'}`;
  coil('primary-coil',207,112,65,115,state.n1/25,'#4b8dd3');coil('secondary-coil',433,112,65,115,state.n2/25,'#e58a43');
  const completed=state.trials.filter(v=>v!==null).length;
  $('lab-progress').textContent=completed+' / 3 Versuche';$('free-controls').disabled=completed!==3;
  $('trial-rows').innerHTML=state.trials.map((value,i)=>value===null?'':`<tr><td>${i+1}</td><td>${presets[i].n2}</td><td>${fmt(value,2)} V</td><td>${fmt(Physics.secondary(6,100,presets[i].n2))} V</td></tr>`).join('')||'<tr class="empty-row"><td colspan="4">Deine Messungen erscheinen hier.</td></tr>';
  drawField();
 }
 function measure() {
  if(free) {selectExperiment(state.experiment);feedback('prediction-feedback','Zurück zum gewählten Vergleichsversuch. Gib deine Vermutung ein.');return;}
  const value=$('prediction').value.trim().replace(',','.');
  const predicted=Number(value),i=state.experiment,actual=Physics.secondary(6,100,presets[i].n2);
  if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)||!finitePrediction(predicted)) {
   feedback('prediction-feedback','Trage zuerst eine Vermutung als Zahl zwischen 0 und 1.000.000 V ein. Ein Komma ist erlaubt.','warning');$('prediction').focus();return;
  }
  const correct=Math.abs(predicted-actual)<0.01;
  const first=state.first[i]===null;
  if(first) state.first[i]=predicted;
  if(!correct&&first) {
   feedback('prediction-feedback','Denkimpuls: Vergleiche N₂ mit N₁. Ist das Verhältnis gleich, doppelt oder halb so groß? Überarbeite deine Vermutung oder klicke „Jetzt messen“.','warning');
   $('measure').textContent='Jetzt messen';save();return;
  }
  if(state.trials[i]===null) state.trials[i]=state.first[i];
  feedback('prediction-feedback',correct?`Deine Vorhersage passt: U₂ = ${fmt(actual)} V. Vergleiche jetzt die beiden Windungszahlen.`:`Gemessen: ${fmt(actual)} V. Deine erste Vermutung war ${fmt(state.first[i],2)} V. Welche Änderung des Windungsverhältnisses erklärt den Unterschied?`,correct?'success':'');
  $('measure').textContent='Erneut vergleichen';renderLab();save();
 }
 const hints={
  lab:['Vergleiche die Windungszahl der Sekundärspule mit der Primärspule. Was bleibt unverändert?','Vergleiche die drei Fälle: gleich viele, doppelt so viele, halb so viele Windungen. Ändere nur diese eine Größe.','Bei gleicher Primärspannung wächst die Sekundärspannung im Verhältnis N₂/N₁. Bei 6 V und 100 : 200 erhältst du 12 V.'],
  rule:['Welche Veränderung hast du zwischen den drei Versuchen gesehen?','Wähle für beide Lücken die passende Spannungsänderung. Vergleiche jeweils Windungszahl UND Spannung.','Bei gleichem U₁ und N₁ gilt: Doppelte Sekundärwindungszahl bedeutet doppelte Spannung; halbe Sekundärwindungszahl bedeutet halbe Spannung.'],
  dc:['Erinnere dich an die Induktion: Reicht ein Magnetfeld allein aus?','Vergleiche ein unverändertes Feld mit einem zeitlich veränderlichen Feld. Was geschieht in der Sekundärspule?','Nur eine Änderung des magnetischen Flusses induziert eine Spannung. Bei stationärem Gleichstrom bleibt der Fluss konstant: U₂ = 0. Beim Ein- oder Ausschalten gibt es kurzzeitig Induktion.'],
  A:['Die Leistung am Leitungsende bleibt gleich. Welche zwei Messwerte ändern sich, wenn U größer wird?','Für die Leistung gilt P = U · I. Wenn P gleich bleibt und U größer wird, muss I kleiner werden.','Die Wärmeverluste sind I² · R. Weniger Strom bedeutet bei gleichem Widerstand deutlich weniger Wärmeverluste. Eine doppelte Spannung halbiert I und viertelt die Verluste.'],
  B:['Vergleiche N₂ mit N₁. Welche Spule muss weniger Windungen haben, damit die Spannung sinkt?','Für das Verhältnis gilt U₂/U₁ = N₂/N₁. Probiere wenige Sekundärwindungen und beobachte die Spannung.','Im Prinzipmodell ergeben 460 : 10 Windungen aus 230 V ~ genau 5 V ~. Das ist noch keine geregelte Gleichspannung. Ein echtes Ladegerät benötigt weitere Elektronik.']
 };
 const hintLevels={};
 function canRevealHint(key) {
  if(key==='lab') return state.first[state.experiment]!==null;
  const field={rule:'rule',dc:'dc-answer',A:'answer-A',B:'answer-B'}[key];
  return $(field).value.trim().length>0;
 }
 function resetHint(key) {
  hintLevels[key]=0;
  const box=document.querySelector(`[data-hint="${key}"]`);
  box.innerHTML='<button type="button" aria-expanded="false">+ Denkimpuls · Hilfe 1 von 3</button><div class="hint-body" role="status"></div>';
  box.querySelector('button').addEventListener('click',()=>{
   const level=hintLevels[key],button=box.querySelector('button'),body=box.querySelector('.hint-body');
   if(level===2&&!canRevealHint(key)) {body.textContent='Mache zunächst einen eigenen Lösungsversuch: Gib einen vermuteten Messwert ein oder wähle passende Satzbausteine. Die ausführliche Erklärung kannst du danach öffnen.';return;}
   if(level<3) {
    hintLevels[key]++;
    body.innerHTML=hints[key].slice(0,level+1).map((text,i)=>`<p><strong>Stufe ${i+1}</strong> · ${text}</p>`).join('');
    button.setAttribute('aria-expanded','true');
    button.textContent=level===2?'− Hilfen einklappen':level===0?'+ Fachliche Unterstützung · Hilfe 2 von 3':'+ Ausführliche Erklärung · Hilfe 3 von 3';
   } else resetHint(key);
  });
 }
 function checkRule() {
  if(state.trials.some(v=>v===null)) {feedback('rule-feedback','Führe zuerst alle drei Versuche durch. Vergleiche dann die Ergebnisse.','warning');return;}
  const result=GuidedAnswers.evaluate('rule');
  feedback('rule-feedback',result.message,result.correct?'success':'warning');
  if(!result.complete)return;
  $('rule-solution').disabled=false;
 }
 function renderLine() {
  const r=Physics.transmission(state.lineVoltage);
  $('line-current').textContent=fmt(r.current,1)+' A';$('line-loss').textContent=fmt(r.loss/1000,2)+' kW';
  $('loss-bar').style.width=(r.loss/2500000*100)+'%';$('heat-waves').style.opacity=String(r.loss/2500000);
  $('line-balance').textContent=`Bilanz: ${fmt(r.sent/1e6,4)} MW Einspeisung = 10 MW am Empfang + ${fmt(r.loss/1e6,4)} MW Wärme. Einspeisespannung: ${fmt(r.sourceVoltage/1000,2)} kV.`;
  $('A-rows').innerHTML=state.lineSamples.map(u=>{const m=Physics.transmission(u);return `<tr><td>${fmt(u/1000)} kV</td><td>${fmt(m.current)} A</td><td>${fmt(m.loss/1000,2)} kW</td></tr>`;}).join('')||'<tr class="empty-row"><td colspan="3">Notiere zwei Einstellungen.</td></tr>';
 }
 function renderCharger() {
  const u=Physics.secondary(230,460,state.chargerTurns);
  $('charger-voltage').textContent=fmt(u);$('charger-n2').textContent='N₂ = '+state.chargerTurns;
  $('target-status').textContent=u===5?'Modellziel erreicht: 5 V ~. Noch keine geregelte Gleichspannung!':'Verringere N₂ und beobachte die Wechselspannung.';
  coil('b-primary',50,57,35,62,16,'#4b8dd3');coil('b-secondary',170,57,35,62,2+state.chargerTurns/35,'#e58a43');
  $('B-rows').innerHTML=state.chargerSamples.map(n=>`<tr><td>460 : ${n}</td><td>${fmt(Physics.secondary(230,460,n))} V ~</td></tr>`).join('')||'<tr class="empty-row"><td colspan="2">Notiere zwei Einstellungen.</td></tr>';
 }
 function chooseExpert(expert) {
  state.expert=expert;
  for(const key of ['A','B']) {$('expert-'+key).hidden=key!==expert;$('choose-'+key).setAttribute('aria-pressed',String(key===expert));}
  $('expert-empty').hidden=expert!==null;save();
 }
 function recordExpert(expert) {
  const key=expert==='A'?'lineSamples':'chargerSamples',value=expert==='A'?state.lineVoltage:state.chargerTurns;
  const duplicate=state[key].includes(value);
  if(!duplicate) state[key].push(value);
  feedback(expert+'-save-feedback',duplicate?'Diese Einstellung steht bereits im Protokoll. Wähle eine andere.':'Einstellung notiert. Vergleiche mindestens zwei unterschiedliche Einstellungen.',duplicate?'':'success');
  if(expert==='A') renderLine();else renderCharger();save();
 }
 function checkExpert(expert) {
  const samples=expert==='A'?state.lineSamples:state.chargerSamples;
  if(samples.length<2) {feedback(expert+'-feedback','Notiere zuerst zwei unterschiedliche Einstellungen. Vergleiche ihre Messwerte.','warning');return;}
  if(expert==='B'&&!samples.includes(10)) {feedback('B-feedback','Untersuche auch das Modellziel 5 V ~ und notiere die passende Einstellung.','warning');return;}
  const result=GuidedAnswers.evaluate('answer-'+expert);
  feedback(expert+'-feedback',result.message,result.correct?'success':'warning');
  if(!result.complete)return;
  $(expert+'-solution').disabled=false;
 }
 function paragraph(value,empty='Noch nicht notiert.') {return value?.trim()?`<p class="user-text">${esc(value)}</p>`:`<p class="missing">${empty}</p>`;}
 function renderSummary() {
  const e=state.expert;
  let content='<p class="eyebrow">DEIN LERNPRODUKT</p><h3>Meine Untersuchung'+(e?' · Auftrag '+e:'')+'</h3>';
  if(!e) content+='<p class="missing">Du hast noch keinen Expertenauftrag gewählt.</p>';
  else {
   content+='<h4>Mein Problem</h4><p>'+(e==='A'?'Warum übertragen wir elektrische Energie mit hoher Spannung?':'Wie wird aus einer hohen Wechselspannung eine kleinere, die anschließend für das Smartphone angepasst werden kann?')+'</p>';
   content+='<h4>Das habe ich verändert</h4><p>'+(e==='A'?'Spannung am Leitungsende; Empfangsleistung und Leitungswiderstand blieben gleich.':'Sekundärwindungszahl; Primärspannung und Primärwindungszahl blieben gleich.')+'</p>';
   content+='<h4>Meine Beobachtungen</h4><table><thead>'+(e==='A'?'<tr><th>U</th><th>I</th><th>Verlust</th></tr>':'<tr><th>N₁ : N₂</th><th>U₂</th></tr>')+'</thead><tbody>'+$(e+'-rows').innerHTML+'</tbody></table>';
   content+='<h4>Meine physikalische Erklärung</h4>'+paragraph($('answer-'+e).value);
   const count=e==='A'?state.lineSamples.length:state.chargerSamples.length;
   if(count<2) content+='<p class="missing">Für einen Vergleich fehlen noch zwei unterschiedliche Einstellungen.</p>';
   if(e==='B'&&!state.chargerSamples.includes(10)) content+='<p class="missing">Die Messung zum Modellziel 5 V ~ fehlt noch.</p>';
  }
  content+='<h4>Meine Transformatorregel</h4>'+paragraph($('rule').value);
  content+='<h4>Meine anfängliche Vermutung</h4>'+paragraph($('initial').value,'Noch keine Aussage ausgewählt.');
  $('summary-content').innerHTML=content;
 }
 function buildPrint() {
  renderSummary();
  $('print-content').innerHTML='<h1>Vom Kraftwerk zum Smartphone</h1><p>Meine Forschungsergebnisse · Physiklabor</p>'+$('summary-content').innerHTML+'<h3>Gemeinsames Labor</h3><p>U₁ = 6 V; N₁ = 100. Spannungen: Effektivwerte.</p><table><thead><tr><th>Versuch</th><th>N₂</th><th>Vermutung</th><th>U₂</th></tr></thead><tbody>'+$('trial-rows').innerHTML+'</tbody></table><h4>Wechselndes und konstantes Feld</h4>'+paragraph($('dc-answer').value)+'<h4>Gemeinsames Fazit</h4>'+paragraph($('conclusion').value);
 }
 function exportResults() {
  buildPrint();
  const headings={initial:'Erste Vermutung',rule:'Transformatorregel','dc-answer':'Wechselstrom / stationärer Gleichstrom',extension:'Freiwillige Vertiefung','answer-A':'Erklärung A','answer-B':'Erklärung B',conclusion:'Gemeinsames Fazit'};
  let text='VOM KRAFTWERK ZUM SMARTPHONE\nMeine Forschungsergebnisse\n\n';
  text+='Versuche: U₁ = 6 V; N₁ = 100\n';
  state.trials.forEach((v,i)=>{if(v!==null)text+=`Versuch ${i+1}: N₂ = ${presets[i].n2}, erste Vermutung ${fmt(v,2)} V, Messung ${fmt(Physics.secondary(6,100,presets[i].n2))} V\n`;});
  text+='\nAuftrag A – Fernleitung (10 MW Empfangsleistung, 10 Ω)\n';
  state.lineSamples.forEach(u=>{const r=Physics.transmission(u);text+=`${fmt(u/1000)} kV; ${fmt(r.current)} A; ${fmt(r.loss/1000,2)} kW Wärmeverlust\n`;});
  text+='\nAuftrag B – Prinzipmodell (230 V ~, N₁ = 460)\n';
  state.chargerSamples.forEach(n=>text+=`N₂ = ${n}; U₂ = ${fmt(Physics.secondary(230,460,n))} V ~\n`);
  for(const key of texts)text+='\n'+headings[key]+'\n'+($(key).value.trim()||'(nicht notiert)')+'\n';
  const link=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));
  link.href=url;link.download='Transformator_Meine_Ergebnisse.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function drawField() {
  const w=Physics.wave(state.u1,state.n1,state.n2,phase,false),strength=Math.min(1,Math.abs(w.flux)/0.06);
  $('field-loop').style.opacity=String(strength);$('field-vector').style.opacity=String(strength);
  $('field-vector').setAttribute('d',w.flux>=0?'M286 77H354':'M354 77H286');
  const c=Physics.wave(6,100,100,phase,dc);
  $('comparison-arrow').setAttribute('d',c.flux>=0?'M45 15H95':'M95 15H45');$('comparison-arrow').style.opacity=String(Math.abs(c.flux)/0.06);
 }
 function animation(time) {
  if(!paused&&!printing&&!document.hidden&&state.tab===0) {phase+=(lastFrame?Math.min((time-lastFrame)/1000,0.05):0)*6.4;drawField();}
  lastFrame=time;requestAnimationFrame(animation);
 }
 function renderPause() {
  $('pause').textContent=paused?'Animation fortsetzen':'Animation pausieren';$('pause').setAttribute('aria-pressed',String(paused));
  $('field-state').textContent=paused?'Animation angehalten · kein Gleichstrom':'Wechselndes Feld · stark verlangsamt';
 }
 GuidedAnswers.mount(state.choices,state.texts,(key,values)=>{state.choices[key]=values;});
 for(const key of texts) {
  $(key).value=state.texts[key]||'';
  $(key).addEventListener('input',()=>{
   state.texts[key]=$(key).value;
   if(key==='rule') {$('rule-solution').disabled=true;$('rule-model').hidden=true;feedback('rule-feedback','');}
   if(['answer-A','answer-B'].includes(key)) {const e=key.slice(-1);$(e+'-solution').disabled=true;$(e+'-model').hidden=true;feedback(e+'-feedback','');}
   const feedbackId={'dc-answer':'dc-feedback',extension:'extension-feedback',conclusion:'conclusion-feedback'}[key];
   if(feedbackId)feedback(feedbackId,'');
   if(state.tab===2)renderSummary();save();
  });
 }
 for(let i=0;i<3;i++) $('tab-'+i).addEventListener('click',()=>showTab(i));
 document.querySelector('.tabs').addEventListener('keydown',event=>{
  let target=state.tab;
  if(event.key==='ArrowRight')target=(target+1)%3;
  else if(event.key==='ArrowLeft')target=(target+2)%3;
  else if(event.key==='Home')target=0;
  else if(event.key==='End')target=2;
  else return;
  event.preventDefault();showTab(target,true);
 });
 document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showTab(+b.dataset.go,true)));
 document.querySelectorAll('[data-experiment]').forEach(b=>b.addEventListener('click',()=>selectExperiment(+b.dataset.experiment)));
 $('begin').addEventListener('click',()=>{state.started=true;$('entry').open=false;showTab(0,true);});
 $('measure').addEventListener('click',measure);$('prediction').addEventListener('keydown',e=>{if(e.key==='Enter')measure();});
 for(const key of ['u1','n1','n2']) $(key).addEventListener('input',()=>{state[key]=+$(key).value;free=true;renderLab();feedback('prediction-feedback','Freies Experiment: Die Anzeige reagiert sofort. Deine drei Vergleichsmessungen bleiben unverändert.');save();});
 $('check-rule').addEventListener('click',checkRule);$('rule-solution').addEventListener('click',()=>{$('rule-model').hidden=!$('rule-model').hidden;});
 $('pause').addEventListener('click',()=>{paused=!paused;renderPause();});
 for(const mode of ['ac','dc']) $(mode+'-mode').addEventListener('click',()=>{
  dc=mode==='dc';$('dc-mode').setAttribute('aria-pressed',String(dc));$('ac-mode').setAttribute('aria-pressed',String(!dc));
  $('dc-observation').textContent=dc?'Das Feld bleibt konstant. Nach dem Einschwingen: keine dauerhafte Sekundärspannung, U₂ = 0 V.':'Das Feld ändert Stärke und Richtung. An der Sekundärspule entsteht eine Wechselspannung.';drawField();
 });
 for(const e of ['A','B']) {
  $('choose-'+e).addEventListener('click',()=>chooseExpert(e));$('save-'+e).addEventListener('click',()=>recordExpert(e));
  $('check-'+e).addEventListener('click',()=>checkExpert(e));$(e+'-solution').addEventListener('click',()=>{$(e+'-model').hidden=!$(e+'-model').hidden;});
 }
 $('line-voltage').value=state.lineVoltage;$('charger-turns').value=state.chargerTurns;
 $('line-voltage').addEventListener('change',()=>{state.lineVoltage=+$('line-voltage').value;feedback('A-save-feedback','');renderLine();save();});
 $('charger-turns').addEventListener('change',()=>{state.chargerTurns=+$('charger-turns').value;feedback('B-save-feedback','');renderCharger();save();});
 for(const [key,button,target] of [['extension','check-extension','extension-feedback'],['conclusion','check-conclusion','conclusion-feedback'],['dc-answer','check-dc','dc-feedback']]) {
  $(button).addEventListener('click',()=>{const result=GuidedAnswers.evaluate(key);feedback(target,result.message,result.correct?'success':'warning');});
 }
 $('export-top').addEventListener('click',exportResults);$('print-results').addEventListener('click',()=>{buildPrint();window.print();});
 window.addEventListener('beforeprint',()=>{printing=true;buildPrint();});
 window.addEventListener('afterprint',()=>{printing=false;lastFrame=0;});
 $('model-info').addEventListener('click',()=>$('info-dialog').showModal());
 $('reset').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
 $('confirm-reset').addEventListener('click',()=>{
  state=fresh();save();
  for(const key of texts) $(key).value='';
  GuidedAnswers.reset();
  for(const id of ['rule','A','B']) {$(id+'-model').hidden=true;$(id+'-solution').disabled=true;}
  document.querySelectorAll('.feedback').forEach(el=>{el.textContent='';});
  for(const key of Object.keys(hints))resetHint(key);
  $('line-voltage').value=20000;$('charger-turns').value=460;
  $('entry').open=true;dc=false;$('ac-mode').click();selectExperiment(0);renderLine();renderCharger();chooseExpert(null);showTab(0);$('reset-dialog').close();
 });
 for(const key of Object.keys(hints))resetHint(key);
 $('entry').open=!state.started;renderLine();renderCharger();selectExperiment(state.experiment);chooseExpert(state.expert);showTab(state.tab);renderPause();storageLabel();
 requestAnimationFrame(animation);
})();
