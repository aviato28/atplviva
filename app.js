const $=s=>document.querySelector(s),app=$('#app'),back=$('#back'),titleEl=$('#title');
let D,P=JSON.parse(localStorage.getItem('p')||'{}'),stack=[];
const save=()=>localStorage.setItem('p',JSON.stringify(P));
const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const box=(t,i)=>P[t+':'+i]||0, mastered=(t,i)=>box(t,i)>=3;
const stats=t=>{const n=t.cards.length;return{n,m:t.cards.filter((_,i)=>mastered(t.id,i)).length}};
function go(fn,title){stack.push([fn,title]);fn();titleEl.textContent=title;back.hidden=stack.length<2}
back.onclick=()=>{stack.pop();const[f,t]=stack[stack.length-1];f();titleEl.textContent=t;back.hidden=stack.length<2};
function home(){
  const all=D.topics.reduce((a,t)=>{const s=stats(t);return[a[0]+s.m,a[1]+s.n]},[0,0]);
  app.innerHTML=`<button class="btn" id="viva">🎤 Viva mode (random, all topics)</button>
  <p class="mut">Mastered ${all[0]} / ${all[1]} cards</p>`+D.topics.map((t,i)=>{const s=stats(t);
  return`<button class="card topic" data-i="${i}"><b>${esc(t.title)}</b><div class="mut">${s.m}/${s.n} mastered · ${t.notes.length} notes</div><div class="bar"><i style="width:${s.n?s.m/s.n*100:0}%"></i></div></button>`}).join('')+
  `<button class="btn alt" id="reset">Reset progress</button>`;
  app.querySelectorAll('.topic').forEach(b=>b.onclick=()=>go(()=>topic(D.topics[b.dataset.i]),D.topics[b.dataset.i].title));
  $('#viva').onclick=()=>go(()=>cards(D.topics.flatMap(t=>t.cards.map((c,i)=>({...c,t:t.id,i}))),true),'Viva mode');
  $('#reset').onclick=()=>{if(confirm('Reset all progress?')){P={};save();home()}};
}
function topic(t){
  app.innerHTML=`<button class="btn" id="l">📖 Learn (${t.notes.length} chunks)</button><button class="btn alt" id="c">🃏 Flashcards (${t.cards.length})</button>`;
  $('#l').onclick=()=>go(()=>learn(t),t.title+' · Learn');
  $('#c').onclick=()=>go(()=>cards(t.cards.map((c,i)=>({...c,t:t.id,i}))),t.title+' · Cards');
}
function learn(t,k=0){
  const n=t.notes[k];
  app.innerHTML=`<p class="mut">${k+1} / ${t.notes.length}</p><div class="card note">${esc(n)}</div>
  <div class="row"><button class="btn alt" id="p" ${k?'':'disabled'}>Prev</button><button class="btn" id="n">${k<t.notes.length-1?'Next':'Done → Cards'}</button></div>`;
  $('#p').onclick=()=>learn(t,k-1);
  $('#n').onclick=()=>k<t.notes.length-1?learn(t,k+1):go(()=>cards(t.cards.map((c,i)=>({...c,t:t.id,i}))),t.title+' · Cards');
  scrollTo(0,0);
}
function cards(list,shuffle){
  let q=list.filter(c=>!mastered(c.t,c.i));
  if(!q.length){app.innerHTML=`<div class="card">🎉 All cards in this set mastered.</div><button class="btn alt" id="r">Review everything anyway</button>`;
    $('#r').onclick=()=>{list.forEach(c=>delete P[c.t+':'+c.i]);save();cards(list,shuffle)};return}
  if(shuffle)q.sort(()=>Math.random()-.5);
  const c=q[0];
  app.innerHTML=`<p class="mut">${q.length} left · box ${box(c.t,c.i)}/3</p><div class="card q">${esc(c.q)}</div><div id="ans"></div><button class="btn alt" id="show">Show answer</button>`;
  $('#show').onclick=()=>{
    $('#ans').innerHTML=`<div class="card a">${esc(c.a)}</div>`;
    $('#show').outerHTML=`<div class="row"><button class="btn bad" id="no">Again</button><button class="btn ok" id="yes">Got it</button></div>`;
    $('#no').onclick=()=>{P[c.t+':'+c.i]=0;save();cards(list,shuffle)};
    $('#yes').onclick=()=>{P[c.t+':'+c.i]=box(c.t,c.i)+1;save();cards(list,shuffle)};
  };
  scrollTo(0,0);
}
fetch('content.json').then(r=>r.json()).then(d=>{D=d;go(home,D.title||'ATPL Viva')});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
