'use strict';
// Sentence choices keep the investigation usable without an on-screen keyboard.
globalThis.GuidedAnswers = (() => {
 const activities = {
  initial: {
   name:'Erste Vermutung',
   statements:[
    'Verschiedene Geräte und Leitungen benötigen unterschiedliche Spannungen.',
    'Für den Transport und für jedes Gerät sollte die Spannung gleich bleiben.',
    'Eine höhere Spannung erzeugt zusätzliche elektrische Energie.',
    'Ich bin noch unsicher und möchte es im Labor untersuchen.'
   ]
  },
  rule: {
   name:'Transformatorregel',
   parts:['Bei gleicher Primärspannung U₁ und gleicher Primärwindungszahl N₁ führen mehr Sekundärwindungen zu einer ',{label:'Spannung bei mehr Sekundärwindungen',options:['niedrigeren','gleich hohen','höheren'],correct:'höheren'},' Sekundärspannung. Weniger Sekundärwindungen führen zu einer ',{label:'Spannung bei weniger Sekundärwindungen',options:['höheren','niedrigeren','gleich hohen'],correct:'niedrigeren'},' Sekundärspannung.'],
   hint:'Vergleiche deine Messungen bei 100, 200 und 50 Sekundärwindungen.'
  },
  'dc-answer': {
   name:'Induktion',
   parts:['Eine Spannung wird durch Induktion erzeugt, wenn sich das Magnetfeld in der Sekundärspule ',{label:'Magnetfeld',options:['nicht ändert','ändert'],correct:'ändert'},'. Bei konstantem Magnetfeld entsteht nach dem Einschalten ',{label:'Spannung bei konstantem Feld',options:['eine dauerhafte','keine dauerhafte'],correct:'keine dauerhafte'},' Sekundärspannung.'],
   hint:'Vergleiche die Beobachtungen beim wechselnden und beim konstanten Feld.'
  },
  extension: {
   name:'Energieerhaltung',
   parts:['Beim idealen Transformator bleibt die Leistung ',{label:'Leistung',options:['gleich','nicht gleich'],correct:'gleich'},'. Wird die Spannung verdoppelt, muss sich bei gleicher Leistung die Stromstärke ',{label:'Stromstärke',options:['verdoppeln','halbieren','nicht ändern'],correct:'halbieren'},'. Denn es gilt P = U · I.'],
   hint:'Setze gedanklich die doppelte Spannung in P = U · I ein. Die Leistung soll gleich bleiben.'
  },
  'answer-A': {
   name:'Erklärung zur Fernleitung',
   parts:['Bei gleicher übertragener Leistung führt eine höhere Spannung zu einer ',{label:'Stromstärke',options:['höheren','geringeren','unveränderten'],correct:'geringeren'},' Stromstärke. Dadurch entstehen ',{label:'Wärmeverluste',options:['weniger','mehr','gleich viele'],correct:'weniger'},' Wärmeverluste in der Leitung. Deshalb wird die Spannung vor der Fernleitung ',{label:'Spannungsanpassung vor der Fernleitung',options:['verringert','nicht verändert','erhöht'],correct:'erhöht'},'.'],
   hint:'Vergleiche die notierten Werte für Stromstärke und Wärmeverluste. Die Leistung am Leitungsende bleibt gleich.'
  },
  'answer-B': {
   name:'Erklärung zum Ladegerät',
   parts:['Hat die Sekundärspule ',{label:'Sekundärwindungen',options:['mehr','gleich viele','weniger'],correct:'weniger'},' Windungen als die Primärspule, wird die Spannung ',{label:'Sekundärspannung',options:['kleiner','größer','nicht verändert'],correct:'kleiner'},'. Der Transformator allein liefert weiterhin ',{label:'Spannungsart nach dem Transformator',options:['Gleichspannung','Wechselspannung'],correct:'Wechselspannung'},'. Zusätzliche Elektronik erzeugt die benötigte ',{label:'Spannungsart für das Smartphone',options:['geregelte Gleichspannung','Netzwechselspannung'],correct:'geregelte Gleichspannung'},'.'],
   hint:'Vergleiche N₁ und N₂ sowie das Zeichen ~ an der Anzeige. Welche zusätzliche Aufgabe hat die Elektronik?'
  },
  conclusion: {
   name:'Gemeinsames Fazit',
   parts:['Transformatoren verändern mithilfe der Induktion die ',{label:'Spannungsart',options:['Gleichspannung','Wechselspannung'],correct:'Wechselspannung'},'. Für die Fernleitung wird sie ',{label:'Vor der Fernleitung',options:['erhöht','verringert'],correct:'erhöht'},', damit die Wärmeverluste kleiner werden. Vor den Haushalten wird sie in mehreren Stufen ',{label:'Vor den Haushalten',options:['erhöht','verringert'],correct:'verringert'},'; an der Steckdose liegen ',{label:'Spannung an der Steckdose',options:['380.000 V ~','230 V ~','5 V Gleichspannung'],correct:'230 V ~'},' an.'],
   hint:'Verbindet eure Messungen: hohe Spannung für die Fernleitung, passende niedrigere Spannung für die Haushalte.'
  }
 };
 const mounted = new Map();
 function valuesFor(key) {
  const box=mounted.get(key);
  return activities[key].statements ? [box.querySelector('input:checked')?.value||''] : [...box.querySelectorAll('select')].map(el=>el.value);
 }
 function sentence(key,values) {
  const definition=activities[key];
  if(!values.some(Boolean)) return '';
  if(definition.statements) return values[0];
  let index=0;
  return definition.parts.map(part=>typeof part==='string'?part:(values[index++]||'[…]')).join('');
 }
 function makeSelect(key,part,index) {
  const select=document.createElement('select');
  select.id=key+'-'+index;
  select.setAttribute('aria-label',activities[key].name+' – '+part.label);
  select.add(new Option('Auswählen …',''));
  part.options.forEach(value=>select.add(new Option(value,value)));
  return select;
 }
 function mount(choices,texts,onChange) {
  for(const [key,definition] of Object.entries(activities)) {
   const original=document.getElementById(key),label=document.querySelector(`label[for="${key}"]`);
   const box=document.createElement('fieldset'),legend=document.createElement('legend'),input=document.createElement('input');
   box.className='guided-answer';box.dataset.answer=key;
   legend.textContent=label.textContent;box.append(legend);label.remove();
   input.type='hidden';input.id=key;input.value=texts[key]||'';
   original.replaceWith(input,box);mounted.set(key,box);
   if(definition.statements) {
    definition.statements.forEach((statement,index)=>{
     const item=document.createElement('label'),radio=document.createElement('input'),text=document.createElement('span');
     radio.type='radio';radio.name=key;radio.id=key+'-'+index;radio.value=statement;
     text.textContent=statement;item.className='statement-option';item.append(radio,text);box.append(item);
    });
   } else {
    const paragraph=document.createElement('p');paragraph.className='cloze-text';let index=0;
    for(const part of definition.parts)paragraph.append(typeof part==='string'?document.createTextNode(part):makeSelect(key,part,index++));
    box.append(paragraph);
   }
   const saved=Array.isArray(choices[key])?choices[key]:[];
   if(definition.statements) {
    for(const radio of box.querySelectorAll('input'))radio.checked=radio.value===saved[0];
   } else {
    [...box.querySelectorAll('select')].forEach((select,i)=>{select.value=[...select.options].some(option=>option.value===saved[i])?saved[i]:'';});
   }
   const selected=valuesFor(key);
   if(selected.some(Boolean)) {input.value=sentence(key,selected);texts[key]=input.value;}
   else if(texts[key]) {
    // Keep earlier free-text work readable without forcing it into fixed choices.
    const legacy=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');
    legacy.className='legacy-answer';summary.textContent='Frühere Texteingabe ansehen';text.textContent=texts[key];legacy.append(summary,text);box.append(legacy);
   }
   choices[key]=selected;
   box.addEventListener('change',()=>{
    const values=valuesFor(key);input.value=sentence(key,values);onChange(key,values);
    input.dispatchEvent(new Event('input',{bubbles:true}));
   });
  }
 }
 function evaluate(key) {
  const definition=activities[key],values=valuesFor(key);
  if(values.some(value=>!value))return {complete:false,correct:false,message:'Wähle zuerst für alle Lücken einen Vorschlag aus.'};
  const blanks=definition.parts.filter(part=>typeof part!=='string');
  const correct=blanks.every((part,index)=>part.correct===values[index]);
  return {complete:true,correct,message:correct?'Deine Auswahl passt zum physikalischen Zusammenhang.':'Deine Auswahl passt noch nicht überall. '+definition.hint};
 }
 function reset() {
  for(const box of mounted.values()) {
   box.querySelectorAll('select').forEach(select=>{select.value='';});
   box.querySelectorAll('input').forEach(input=>{input.checked=false;});
   box.querySelectorAll('.legacy-answer').forEach(el=>el.remove());
  }
 }
 return {mount,evaluate,reset};
})();
