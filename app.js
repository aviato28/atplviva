const $=s=>document.querySelector(s),app=$('#app'),back=$('#back'),titleEl=$('#title');
const ls={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let D,P=ls.get('p',{}),S=ls.get('s',{timer:false,theme:'dark'}),stack=[],tick;
const save=()=>ls.set('p',P),saveS=()=>ls.set('s',S);
const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const MAST=2,box=(t,i)=>P[t+':'+i]||0,mastered=(t,i)=>box(t,i)>=MAST;
const allCards=()=>D.topics.flatMap(t=>t.cards.map((c,i)=>({...c,t:t.id,i,tt:t.title})));
const topicCards=t=>t.cards.map((c,i)=>({...c,t:t.id,i,tt:t.title}));
const weakList=()=>allCards().filter(c=>P['w:'+c.t+':'+c.i]);
const stats=t=>({n:t.cards.length,m:t.cards.filter((_,i)=>mastered(t.id,i)).length});
const shuf=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const PRAISE=['Nice!','Locked in 🔒','Examiner impressed','Solid','Boom 💥',"That's a keeper"];
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function toast(m){const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),900)}
function theme(){document.documentElement.dataset.theme=S.theme;$('#theme').textContent=S.theme==='dark'?'☀️':'🌙'}
$('#theme').onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';saveS();theme()};
function go(fn,title){stack.push([fn,title]);fn();titleEl.textContent=title;back.hidden=stack.length<2}
back.onclick=()=>{clearInterval(tick);stack.pop();const[f,t]=stack[stack.length-1];f();titleEl.textContent=t;back.hidden=stack.length<2;scrollTo(0,0)};
const setCards=(list,o={})=>go(()=>cards(list,o),o.title||'Cards');

function home(){
  const all=D.topics.reduce((a,t)=>{const s=stats(t);return[a[0]+s.m,a[1]+s.n]},[0,0]);
  const mk=allCards().filter(c=>c.m);
  app.innerHTML=`<button class="btn" id="mock">🎓 Mock viva (20 Qs, scored)</button>
  <div class="row"><button class="btn alt" id="viva">🎤 Viva mode</button><button class="btn alt" id="chain">🔗 Examiner chains</button></div>
  <div class="row"><button class="btn alt" id="top">⭐ Must-know ${mk.length}</button><button class="btn alt" id="num">🔢 Numbers</button></div>
  <div class="row"><button class="btn alt" id="weak">🎯 Weak (${weakList().length})</button><button class="btn alt" id="srch">🔍 Search</button></div>
  <p class="mut">Mastered ${all[0]} / ${all[1]} cards</p><div class="bar"><i style="width:${all[1]?all[0]/all[1]*100:0}%"></i></div>`+
  D.topics.map((t,i)=>{const s=stats(t);return`<button class="card topic" data-i="${i}"><b>${esc(t.title)}</b><div class="mut">${s.m}/${s.n} mastered · ${t.notes.length} notes</div><div class="bar"><i style="width:${s.n?s.m/s.n*100:0}%"></i></div></button>`}).join('')+
  `<div class="card"><label class="sw"><input type="checkbox" id="tm" ${S.timer?'checked':''}> ⏱ 45-second "say it aloud" timer on cards</label>
  <p class="mut">Mic button (if your browser supports it) transcribes what you say so you can compare.</p></div>
  <button class="btn alt" id="reset">Reset progress</button>`;
  app.querySelectorAll('.topic').forEach(b=>b.onclick=()=>{const t=D.topics[b.dataset.i];go(()=>topic(t),t.title)});
  $('#mock').onclick=()=>go(mock,'Mock viva');
  $('#viva').onclick=()=>setCards(allCards(),{shuffle:1,hint:'🎤 Examiner voice: answer OUT LOUD in full sentences, then reveal.',title:'Viva mode'});
  $('#chain').onclick=()=>go(()=>chainList(D.chains),'Examiner chains');
  $('#top').onclick=()=>setCards(mk,{shuffle:1,title:'Must-know',hint:'The classics - the questions most likely to be asked.'});
  $('#num').onclick=()=>setCards(allCards().filter(c=>c.n),{shuffle:1,hint:'Numbers: say it out loud!',title:'Numbers drill'});
  $('#weak').onclick=()=>{const w=weakList();if(!w.length)return alert('No weak cards yet - grade a card Missed or Partial and it lands here.');setCards(w,{shuffle:1,title:'Weak cards'})};
  $('#srch').onclick=()=>go(search,'Search');
  $('#tm').onchange=e=>{S.timer=e.target.checked;saveS()};
  $('#reset').onclick=()=>{if(confirm('Reset all progress?')){P={};save();home()}};
}
function topic(t){
  const ch=D.chains.filter(c=>c.topic===t.title);
  app.innerHTML=`<button class="btn" id="l">📖 Learn (${t.notes.length} chunks)</button><button class="btn alt" id="c">🃏 Flashcards (${t.cards.length})</button>${ch.length?`<button class="btn alt" id="ch">🔗 Examiner chains (${ch.length})</button>`:''}<button class="btn alt" id="n">📄 Re-read all notes</button>`;
  $('#l').onclick=()=>go(()=>learn(t),t.title+' · Learn');
  $('#c').onclick=()=>setCards(topicCards(t),{hint:'Say the answer out loud before revealing.',title:t.title+' · Cards'});
  if(ch.length)$('#ch').onclick=()=>go(()=>chainList(ch),'Chains');
  $('#n').onclick=()=>go(()=>{app.innerHTML=t.notes.map(n=>`<div class="card note"><h2>${esc(n.t)}</h2>${esc(n.b)}</div>`).join('')},t.title+' · Notes');
}
function learn(t,k=0){
  const n=t.notes[k],dots=t.notes.map((_,j)=>`<i class="dot ${j<=k?'on':''}"></i>`).join('');
  app.innerHTML=`<div class="dots">${dots}</div><div class="card note"><h2>${esc(n.t)}</h2>${esc(n.b)}</div><p class="mut">💭 Before you tap Next: can you explain this in your own words, out loud?</p>
  <div class="row"><button class="btn alt" id="p" ${k?'':'disabled'}>Prev</button><button class="btn" id="n">${k<t.notes.length-1?'Next':'Done → Cards'}</button></div>`;
  $('#p').onclick=()=>learn(t,k-1);
  $('#n').onclick=()=>k<t.notes.length-1?learn(t,k+1):setCards(topicCards(t),{hint:'Say the answer out loud before revealing.',title:t.title+' · Cards'});
  scrollTo(0,0);
}
// ---- voice + timer helpers
function startAid(){
  let said='',rec=null;
  const timerOn=S.timer,mic=!!SR;
  const html=(timerOn?`<div class="bar big"><i id="tb"></i></div><p class="mut" id="tt">45s</p>`:'')+(mic?`<button class="btn alt" id="mic">🎙 Answer by voice</button><div id="said" class="mut"></div>`:'');
  const wire=()=>{
    if(timerOn){const b=$('#tb');if(b){b.style.transition='none';b.style.width='100%';requestAnimationFrame(()=>requestAnimationFrame(()=>{b.style.transition='width 45s linear';b.style.width='0'}));let s=45;clearInterval(tick);tick=setInterval(()=>{s--;const e=$('#tt');if(e)e.textContent=s>0?s+'s':'Time! Reveal when ready';if(s<=0)clearInterval(tick)},1000)}}
    if(mic&&$('#mic'))$('#mic').onclick=()=>{
      if(rec){rec.stop();return}
      try{rec=new SR();rec.lang='en-IN';rec.continuous=true;rec.interimResults=true;
        rec.onresult=e=>{said=[...e.results].map(r=>r[0].transcript).join(' ');const x=$('#said');if(x)x.textContent='🗣 '+said};
        rec.onend=()=>{rec=null;const m=$('#mic');if(m)m.textContent='🎙 Answer by voice'};
        rec.start();$('#mic').textContent='⏹ Stop'}catch(e){rec=null}};
  };
  const stop=()=>{clearInterval(tick);if(rec)try{rec.stop()}catch(e){}};
  return{html,wire,stop,said:()=>said};
}
// ---- card engine: 3-level grading, rotating queue
function grade(c,lvl){const k=c.t+':'+c.i;
  if(lvl==='n'){P[k]=box(c.t,c.i)+1;delete P['w:'+k]}
  else if(lvl==='p'){P[k]=Math.max(box(c.t,c.i),0);P['w:'+k]=1}
  else{P[k]=0;P['w:'+k]=1}
  save()}
function cards(list,o={},q){
  clearInterval(tick);
  if(!q){q=list.filter(c=>!mastered(c.t,c.i));if(o.shuffle)q=shuf(q)}
  if(!q.length){app.innerHTML=`<div class="card big">🎉 Set complete!<br><span class="mut">Everything here is mastered. Go again on Weak cards or try a Mock viva.</span></div><button class="btn alt" id="r">Review everything again</button>`;
    $('#r').onclick=()=>{list.forEach(c=>{delete P[c.t+':'+c.i];delete P['w:'+c.t+':'+c.i]});save();cards(list,o)};return}
  const c=q[0],aid=startAid();
  app.innerHTML=`<p class="mut">${q.length} left in this round${c.m?' · ⭐ must-know':''}</p><div class="card q">${esc(c.q)}</div>${o.hint?`<p class="mut">${o.hint}</p>`:''}${aid.html}<div id="ans"></div><button class="btn" id="show">Show answer</button>`;
  aid.wire();
  $('#show').onclick=()=>{
    aid.stop();const said=aid.said();
    $('#ans').innerHTML=(said?`<div class="card said">🗣 You said: ${esc(said)}</div>`:'')+`<div class="card a">${esc(c.a)}</div>`+(c.tip?`<div class="card tip">💡 ${esc(c.tip)}</div>`:'');
    $('#show').outerHTML=`<p class="mut">How did you do?</p><div class="row3"><button class="btn bad" data-g="m">Missed</button><button class="btn part" data-g="p">Partial</button><button class="btn ok" data-g="n">Nailed</button></div>`;
    app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{
      const g=b.dataset.g,rest=q.slice(1);grade(c,g);
      if(g==='n'){toast(PRAISE[Math.random()*PRAISE.length|0]);if(!mastered(c.t,c.i))rest.splice(Math.min(8,rest.length),0,c)}
      else rest.splice(Math.min(g==='p'?5:3,rest.length),0,c);
      cards(list,o,rest)});
  };
  scrollTo(0,0);
}
// ---- examiner chains
function chainList(list){
  app.innerHTML=`<p class="mut">A real viva is never one question. The examiner keeps digging - practise the whole chain.</p>`+list.map((c,i)=>`<button class="card topic" data-i="${i}"><b>🔗 ${esc(c.title)}</b><div class="mut">${c.steps.length} questions · ${esc(c.topic)}</div></button>`).join('');
  app.querySelectorAll('.topic').forEach(b=>b.onclick=()=>go(()=>chain(list[b.dataset.i],0),list[b.dataset.i].title));
}
function chain(c,k){
  clearInterval(tick);
  const s=c.steps[k],aid=startAid();
  app.innerHTML=`<div class="dots">${c.steps.map((_,j)=>`<i class="dot ${j<=k?'on':''}"></i>`).join('')}</div>
  <p class="mut">${k?'👨‍✈️ Examiner follows up:':'👨‍✈️ Examiner asks:'}</p><div class="card q">${esc(s.q)}</div>${aid.html}<div id="ans"></div><button class="btn" id="show">Show model answer</button>`;
  aid.wire();
  $('#show').onclick=()=>{aid.stop();const said=aid.said();
    $('#ans').innerHTML=(said?`<div class="card said">🗣 You said: ${esc(said)}</div>`:'')+`<div class="card a">${esc(s.a)}</div>`;
    const last=k===c.steps.length-1;
    $('#show').outerHTML=`<button class="btn" id="nx">${last?'Finish chain ✓':'Next follow-up →'}</button>`;
    $('#nx').onclick=()=>last?(toast('Chain complete 🔗'),back.onclick()):chain(c,k+1)};
  scrollTo(0,0);
}
// ---- mock viva
function mock(){
  const mk=shuf(allCards().filter(c=>c.m)),rest=shuf(allCards().filter(c=>!c.m));
  const w=shuf(weakList());
  const pick=[...w.slice(0,5),...mk,...rest].filter((c,i,a)=>a.findIndex(x=>x.t===c.t&&x.i===c.i)===i).slice(0,20);
  const res=[];
  const step=k=>{
    if(k>=pick.length)return done();
    const c=pick[k],aid=startAid();
    app.innerHTML=`<div class="dots">${pick.map((_,j)=>`<i class="dot ${j<=k?'on':''}"></i>`).join('')}</div><p class="mut">Question ${k+1} of ${pick.length}</p><div class="card q">${esc(c.q)}</div><p class="mut">Answer aloud as if the examiner is in front of you.</p>${aid.html}<div id="ans"></div><button class="btn" id="show">Show answer</button>`;
    aid.wire();
    $('#show').onclick=()=>{aid.stop();const said=aid.said();
      $('#ans').innerHTML=(said?`<div class="card said">🗣 ${esc(said)}</div>`:'')+`<div class="card a">${esc(c.a)}</div>`;
      $('#show').outerHTML=`<div class="row3"><button class="btn bad" data-g="m">Missed</button><button class="btn part" data-g="p">Partial</button><button class="btn ok" data-g="n">Nailed</button></div>`;
      app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{grade(c,b.dataset.g);res.push([c,b.dataset.g]);step(k+1)})};
    scrollTo(0,0)};
  const done=()=>{
    const pts=res.reduce((a,[,g])=>a+(g==='n'?1:g==='p'?.5:0),0),pct=Math.round(pts/res.length*100);
    const miss=res.filter(([,g])=>g!=='n');
    const verdict=pct>=85?'🏆 Examiner-ready':pct>=65?'👍 Getting there - review the misses':'📚 More work needed - drill the misses below';
    app.innerHTML=`<div class="card big">${pct}%<br><span class="mut">${pts} / ${res.length} · ${verdict}</span></div>
    ${miss.length?`<h2>Review these</h2>`+miss.map(([c,g])=>`<div class="card"><span class="mut">${g==='m'?'❌ Missed':'🟡 Partial'} · ${esc(c.tt)}</span><p class="q2">${esc(c.q)}</p><div class="a">${esc(c.a)}</div></div>`).join(''):'<div class="card">Clean sweep! 🎉</div>'}
    <button class="btn" id="again">Another mock viva</button>`;
    $('#again').onclick=()=>mock();scrollTo(0,0)};
  step(0);
}
// ---- search
function search(){
  app.innerHTML=`<input id="q" class="inp" placeholder="Search notes and Q&A (e.g. V1, RVR, 7600)" autofocus><div id="res"></div>`;
  $('#q').oninput=e=>{
    const v=e.target.value.trim().toLowerCase();if(v.length<2){$('#res').innerHTML='';return}
    const hits=[];
    D.topics.forEach(t=>{
      t.cards.forEach(c=>{if((c.q+' '+c.a).toLowerCase().includes(v))hits.push(`<div class="card"><span class="mut">Q&A · ${esc(t.title)}</span><p class="q2">${esc(c.q)}</p><div class="a">${esc(c.a)}</div></div>`)});
      t.notes.forEach(n=>{if((n.t+' '+n.b).toLowerCase().includes(v))hits.push(`<div class="card note"><span class="mut">Note · ${esc(t.title)}</span><h2>${esc(n.t)}</h2>${esc(n.b)}</div>`)});
    });
    $('#res').innerHTML=hits.length?hits.slice(0,25).join('')+(hits.length>25?`<p class="mut">+${hits.length-25} more - refine your search</p>`:''):'<p class="mut">Nothing found.</p>';
  };
}
theme();
fetch('content.json').then(r=>r.json()).then(d=>{D=d;go(home,D.title||'ATPL Viva')});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
