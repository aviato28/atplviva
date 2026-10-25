const $=s=>document.querySelector(s),app=$('#app'),back=$('#back'),titleEl=$('#title');
let D,P=JSON.parse(localStorage.getItem('p')||'{}'),stack=[];
const save=()=>localStorage.setItem('p',JSON.stringify(P));
const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const box=(t,i)=>P[t+':'+i]||0, mastered=(t,i)=>box(t,i)>=3;
const allCards=()=>D.topics.flatMap(t=>t.cards.map((c,i)=>({...c,t:t.id,i})));
const weakList=()=>allCards().filter(c=>P['w:'+c.t+':'+c.i]);
const PRAISE=['Nice!','Locked in 🔒','Examiner impressed','Solid','Boom 💥','That\'s a keeper'];
const stats=t=>{const n=t.cards.length;return{n,m:t.cards.filter((_,i)=>mastered(t.id,i)).length}};
function go(fn,title){stack.push([fn,title]);fn();titleEl.textContent=title;back.hidden=stack.length<2}
back.onclick=()=>{stack.pop();const[f,t]=stack[stack.length-1];f();titleEl.textContent=t;back.hidden=stack.length<2};
function home(){
  const all=D.topics.reduce((a,t)=>{const s=stats(t);return[a[0]+s.m,a[1]+s.n]},[0,0]);
  app.innerHTML=`<button class="btn" id="viva">🎤 Viva mode (random, all topics)</button>
  <div class="row"><button class="btn alt" id="num">🔢 Numbers drill</button><button class="btn alt" id="weak">🎯 Weak cards (${weakList().length})</button></div>
  <p class="mut">Mastered ${all[0]} / ${all[1]} cards</p><div class="bar"><i style="width:${all[1]?all[0]/all[1]*100:0}%"></i></div>`+D.topics.map((t,i)=>{const s=stats(t);
  return`<button class="card topic" data-i="${i}"><b>${esc(t.title)}</b><div class="mut">${s.m}/${s.n} mastered · ${t.notes.length} notes</div><div class="bar"><i style="width:${s.n?s.m/s.n*100:0}%"></i></div></button>`}).join('')+
  `<button class="btn alt" id="reset">Reset progress</button>`;
  app.querySelectorAll('.topic').forEach(b=>b.onclick=()=>go(()=>topic(D.topics[b.dataset.i]),D.topics[b.dataset.i].title));
  $('#viva').onclick=()=>go(()=>cards(allCards(),true,'🎤 Examiner voice: answer OUT LOUD in full sentences, then reveal.'),'Viva mode');
  $('#num').onclick=()=>go(()=>cards(allCards().filter(c=>c.n),true,'Numbers: say it out loud!'),'Numbers drill');
  $('#weak').onclick=()=>{const w=weakList();if(!w.length)return alert('No weak cards yet - tap "Again" on cards you miss.');go(()=>cards(w,true),'Weak cards')};
  $('#reset').onclick=()=>{if(confirm('Reset all progress?')){P={};save();home()}};
}
function topic(t){
  app.innerHTML=`<button class="btn" id="l">📖 Learn (${t.notes.length} chunks)</button><button class="btn alt" id="c">🃏 Flashcards (${t.cards.length})</button>`;
  $('#l').onclick=()=>go(()=>learn(t),t.title+' · Learn');
  $('#c').onclick=()=>go(()=>cards(t.cards.map((c,i)=>({...c,t:t.id,i})),false,'Say the answer out loud before revealing.'),t.title+' · Cards');
}
function learn(t,k=0){
  const n=t.notes[k];const dots=t.notes.map((_,j)=>`<i class="dot ${j<=k?'on':''}"></i>`).join('');
  app.innerHTML=`<div class="dots">${dots}</div><div class="card note"><h2>${esc(n.t)}</h2>${esc(n.b)}</div><p class="mut">💭 Before you tap Next: can you explain this in your own words, out loud?</p>
  <div class="row"><button class="btn alt" id="p" ${k?'':'disabled'}>Prev</button><button class="btn" id="n">${k<t.notes.length-1?'Next':'Done → Cards'}</button></div>`;
  $('#p').onclick=()=>learn(t,k-1);
  $('#n').onclick=()=>k<t.notes.length-1?learn(t,k+1):go(()=>cards(t.cards.map((c,i)=>({...c,t:t.id,i})),false,'Say the answer out loud before revealing.'),t.title+' · Cards');
  scrollTo(0,0);
}
function cards(list,shuffle,hint){
  let q=list.filter(c=>!mastered(c.t,c.i));
  if(!q.length){app.innerHTML=`<div class="card">🎉 All cards in this set mastered.</div><button class="btn alt" id="r">Review everything anyway</button>`;
    $('#r').onclick=()=>{list.forEach(c=>{delete P[c.t+':'+c.i];delete P['w:'+c.t+':'+c.i]});save();cards(list,shuffle,hint)};return}
  if(shuffle)q.sort(()=>Math.random()-.5);
  const c=q[0];
  app.innerHTML=`<p class="mut">${q.length} left · box ${box(c.t,c.i)}/3</p><div class="card q">${esc(c.q)}</div>${hint?`<p class="mut">${hint}</p>`:''}<div id="ans"></div><button class="btn alt" id="show">Show answer</button>`;
  $('#show').onclick=()=>{
    $('#ans').innerHTML=`<div class="card a">${esc(c.a)}</div>`+(c.tip?`<div class="card tip">💡 ${esc(c.tip)}</div>`:'');
    $('#show').outerHTML=`<div class="row"><button class="btn bad" id="no">Again</button><button class="btn ok" id="yes">Got it</button></div>`;
    $('#no').onclick=()=>{P[c.t+':'+c.i]=0;P['w:'+c.t+':'+c.i]=1;save();cards(list,shuffle,hint)};
    $('#yes').onclick=()=>{P[c.t+':'+c.i]=box(c.t,c.i)+1;delete P['w:'+c.t+':'+c.i];save();toast(PRAISE[Math.random()*PRAISE.length|0]);cards(list,shuffle,hint)};
  };
  scrollTo(0,0);
}
function toast(m){const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),900)}
fetch('content.json').then(r=>r.json()).then(d=>{D=d;go(home,D.title||'ATPL Viva')});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
