/* A year-group worksheet (app/yearWorksheets.ts) as one self-contained,
   interactive page: the passage at the top with a 🔊 to hear each part, then
   the questions as bright cards, each a different kind (tap a choice, true or
   false, fill the gap, put in order, match, find a word, write, draw).

   "Check my answers" marks everything at once — a tick or a cross on every
   card and "You scored 7 out of 9" — and the child can change answers and
   check again. Writing and drawing aren't marked; the teacher reads them.

   It runs as an assignment lesson (lib/lessonFrame.ts), sandboxed with no
   access to the app, so it carries everything it needs. Choices are buttons
   with aria-pressed, the order is written into a read-only box and every
   answer box has a label, so the collector reads back exactly what the
   child did; the score is left in window.zeraResult. */

import type { YearWorksheet } from "@/app/yearWorksheets";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function yearWorksheetHtml(ws: YearWorksheet): string {
  const [c1, c2] = ws.colours;
  // the data goes in a script, so no "<" may close it early
  const data = JSON.stringify(ws).replace(/</g, "\\u003c");
  const young = ws.key === "y1" || ws.key === "y2";
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(ws.year)} · ${esc(ws.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<style>
:root{--c1:${c1};--c2:${c2};--ink:#2b2340;--soft:#6b6385;--card:#fff;--ok:#16a34a;--bad:#e11d48}
*{box-sizing:border-box}
body{margin:0;font-family:Nunito,system-ui,sans-serif;color:var(--ink);background:
 radial-gradient(circle at 10% 10%,color-mix(in srgb,var(--c1) 30%,transparent) 0 18%,transparent 19%),
 radial-gradient(circle at 92% 22%,color-mix(in srgb,var(--c2) 30%,transparent) 0 14%,transparent 15%),
 radial-gradient(circle at 85% 88%,color-mix(in srgb,var(--c1) 22%,transparent) 0 16%,transparent 17%),
 linear-gradient(160deg,#fffaf0,#f3f0ff);min-height:100vh}
.wrap{max-width:820px;margin:0 auto;padding:18px 16px 60px}
.banner{position:relative;overflow:hidden;border-radius:28px;padding:22px 22px 20px;color:#fff;
 background:linear-gradient(135deg,var(--c1),var(--c2));box-shadow:0 10px 0 rgba(0,0,0,.12),0 16px 30px rgba(0,0,0,.15)}
.banner:after{content:"";position:absolute;inset:auto -40px -60px auto;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.18)}
.tag{display:inline-block;background:rgba(255,255,255,.95);color:var(--ink);font-weight:800;border-radius:999px;padding:4px 12px;font-size:14px}
h1{font-family:"Baloo 2",Nunito,sans-serif;font-size:clamp(28px,6vw,42px);line-height:1.05;margin:10px 0 4px;text-shadow:0 3px 0 rgba(0,0,0,.15)}
.big{font-size:56px;position:absolute;right:20px;top:14px;animation:bob 3s ease-in-out infinite;z-index:1}
@keyframes bob{50%{transform:translateY(-8px) rotate(-6deg)}}
.focus{font-weight:700;opacity:.95;margin:0;font-size:14px}
.name{margin-top:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.name label{font-weight:800}
.name input{flex:1;min-width:160px;border:0;border-radius:14px;padding:10px 14px;font:inherit;font-weight:800;color:var(--ink)}
.story{margin-top:22px;background:var(--card);border-radius:26px;padding:20px 22px;border:4px solid color-mix(in srgb,var(--c1) 45%,#fff);
 box-shadow:0 8px 0 color-mix(in srgb,var(--c1) 35%,#fff)}
.story h2{font-family:"Baloo 2",Nunito,sans-serif;margin:0 0 6px;font-size:26px;color:color-mix(in srgb,var(--c1) 70%,#000)}
.story p{font-size:${young ? 24 : 19}px;line-height:${young ? 1.7 : 1.65};margin:10px 0;display:flex;gap:10px;align-items:flex-start}
.story p span{flex:1}
.say{flex:none;border:0;background:color-mix(in srgb,var(--c2) 22%,#fff);border-radius:12px;width:38px;height:38px;font-size:18px;cursor:pointer}
.say:active{transform:scale(.9)}
.qs{margin-top:22px;display:grid;gap:18px}
.q{position:relative;background:var(--card);border-radius:24px;padding:18px 18px 16px;box-shadow:0 6px 0 rgba(0,0,0,.07),0 10px 20px rgba(0,0,0,.06);
 border-left:10px solid var(--hue);animation:pop .5s both}
@keyframes pop{from{opacity:0;transform:translateY(14px) scale(.98)}}
.q .head{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
.num{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--hue);color:#fff;font-weight:800}
.kind{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--hue);background:color-mix(in srgb,var(--hue) 14%,#fff);padding:3px 10px;border-radius:999px}
.question{font-size:${young ? 22 : 19}px;font-weight:800;margin:6px 0 12px}
.opts{display:flex;flex-wrap:wrap;gap:10px}
.opt{font:inherit;font-weight:800;font-size:${young ? 20 : 17}px;border:3px solid #e7e3f3;background:#faf9ff;color:var(--ink);border-radius:16px;padding:10px 16px;cursor:pointer;transition:transform .12s,background .12s}
.opt:hover{transform:translateY(-2px);border-color:var(--hue)}
.opt[aria-pressed=true]{background:var(--hue);border-color:var(--hue);color:#fff;transform:translateY(-2px);box-shadow:0 4px 0 rgba(0,0,0,.15)}
.pics .opt{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:110px;font-size:18px}
.pics .opt .e{font-size:44px;line-height:1}
.gap{font-size:${young ? 22 : 19}px;font-weight:700;line-height:2}
.blank{display:inline-block;min-width:90px;border-bottom:4px dashed var(--hue);text-align:center;color:var(--hue);font-weight:800}
.order .opt{display:flex;gap:10px;align-items:center;width:100%;text-align:left}
.order .opt b{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:50%;background:#ece8fb;color:var(--soft)}
.order .opt[aria-pressed=true] b{background:#fff;color:var(--hue)}
.row{display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap}
.yours{flex:1;min-width:200px;border:2px dashed #ddd6f3;border-radius:12px;padding:8px 12px;font:inherit;font-weight:800;color:var(--soft);background:#fff}
.small{font:inherit;font-weight:800;font-size:14px;border:0;border-radius:999px;padding:8px 14px;background:#efeaff;color:var(--soft);cursor:pointer}
.match{display:grid;gap:10px}
.pair{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#faf9ff;border-radius:14px;padding:8px 12px}
.pair label{flex:1 1 220px;font-weight:800}
.pair select{flex:1 1 200px;font:inherit;font-weight:700;border:3px solid #e7e3f3;border-radius:12px;padding:8px;background:#fff;color:var(--ink)}
.pair.right{background:#e9fbef}.pair.wrong{background:#ffeef2}
input.text,textarea{width:100%;font:inherit;font-size:18px;font-weight:700;border:3px solid #e7e3f3;border-radius:14px;padding:10px 12px;color:var(--ink);background:#fff}
textarea{resize:vertical;line-height:1.5}
input.text:focus,textarea:focus,.pair select:focus{outline:none;border-color:var(--hue)}
.hint{font-size:14px;color:var(--soft);font-weight:700;margin:-4px 0 8px}
canvas{display:block;width:100%;height:260px;background:#fff;border:3px dashed #ddd6f3;border-radius:16px;touch-action:none;cursor:crosshair}
.pens{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.pen{width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #ddd;cursor:pointer}
.pen[aria-pressed=true]{box-shadow:0 0 0 3px var(--ink)}
.mark{position:absolute;top:12px;right:14px;font-size:28px;animation:pop .35s both}
.q.right{box-shadow:0 0 0 4px #86efac,0 6px 0 rgba(0,0,0,.07)}
.q.wrong{box-shadow:0 0 0 4px #fda4af,0 6px 0 rgba(0,0,0,.07)}
.q.wrong{animation:shake .4s}
@keyframes shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.note{font-weight:800;font-size:14px;margin-top:8px}
.bar{position:sticky;bottom:12px;margin-top:26px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;
 background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-radius:999px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.check{font-family:"Baloo 2",Nunito,sans-serif;font-size:22px;font-weight:800;border:0;border-radius:999px;padding:10px 26px;color:#fff;cursor:pointer;
 background:linear-gradient(135deg,var(--c1),var(--c2));box-shadow:0 5px 0 rgba(0,0,0,.18)}
.check:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.18)}
.score{font-weight:800;font-size:18px}
.stars{font-size:22px;letter-spacing:2px}
.confetti{position:fixed;top:-20px;width:10px;height:14px;border-radius:3px;pointer-events:none;animation:fall linear forwards;z-index:9}
@keyframes fall{to{transform:translateY(110vh) rotate(720deg)}}
@media (max-width:520px){.big{font-size:40px}.story{padding:16px}.q{padding:16px 14px}}
</style>
</head>
<body>
<div class="wrap">
  <header class="banner">
    <span class="big" aria-hidden="true">${ws.emoji}</span>
    <span class="tag">${esc(ws.year)} · Reading worksheet · about ${ws.minutes} minutes</span>
    <h1>${esc(ws.title)}</h1>
    <p class="focus">${esc(ws.focus)}</p>
    <div class="name"><label for="childname">My name:</label><input id="childname" name="name" autocomplete="off" placeholder="Type your name"></div>
  </header>
  <section class="story" id="story"></section>
  <div class="qs" id="qs"></div>
  <div class="bar"><button class="check" id="check">✅ Check my answers</button><span class="score" id="score" aria-live="polite"></span></div>
</div>
<script>
(function(){
var WS=${data};
var HUES=["#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#f43f5e","#14b8a6","#6366f1","#f97316","#0ea5e9"];
var KIND={choose:"🎯 Choose",truefalse:"✅ True or false",gap:"🧩 Fill the gap",order:"🔢 Put in order",match:"🔗 Match",find:"🔍 Find it",write:"✏️ Write",draw:"🎨 Draw"};
var canSpeak="speechSynthesis" in window;
function say(t){if(!canSpeak)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t.replace(/[\\u{1F300}-\\u{1FAFF}\\u2600-\\u27BF]/gu,""));u.lang="en-GB";u.rate=.9;speechSynthesis.speak(u);}
function el(tag,attrs,kids){var e=document.createElement(tag);for(var k in attrs||{}){if(k==="text")e.textContent=attrs[k];else if(k==="html")e.innerHTML=attrs[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),attrs[k]);else e.setAttribute(k,attrs[k]);}
 (kids||[]).forEach(function(c){if(c)e.appendChild(c)});return e;}
function sayBtn(t){return canSpeak?el("button",{class:"say",type:"button","aria-label":"Read aloud",title:"Read aloud",text:"🔊",onclick:function(){say(t)}}):null;}
// a fixed shuffle, the same every time the sheet opens
var seed=7;function rnd(){seed=(seed*9301+49297)%233280;return seed/233280;}
function shuffled(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}

// the passage
var story=document.getElementById("story");
story.appendChild(el("h2",{text:"📖 "+WS.passage.title}));
WS.passage.paras.forEach(function(p){story.appendChild(el("p",{},[sayBtn(p),el("span",{text:p})]));});

// the questions
var checks=[];var qs=document.getElementById("qs");
WS.questions.forEach(function(Q,i){
 var hue=HUES[i%HUES.length];
 var card=el("div",{class:"q",style:"--hue:"+hue+";animation-delay:"+(i*.05)+"s"});
 var title=Q.t==="gap"?"Choose the word that fits the gap.":Q.q;
 card.appendChild(el("div",{class:"head"},[el("span",{class:"num",text:String(i+1)}),el("span",{class:"kind",text:KIND[Q.t]}),sayBtn(Q.t==="gap"?Q.before+" blank "+Q.after:Q.q)]));
 card.appendChild(el("h3",{class:"question",text:title}));
 var check=null;

 function choices(labels,answer,pics){
  var box=el("div",{class:"opts"+(pics?" pics":"")});var picked=-1;var btns=[];
  labels.forEach(function(lab,k){
   var inner=null;
   if(pics){var m=lab.match(/^(\\S+)\\s+(.*)$/);inner=[el("span",{class:"e",text:m?m[1]:""}),el("span",{text:m?m[2]:lab})];}
   var b=el("button",{class:"opt",type:"button","aria-pressed":"false",onclick:function(){picked=k;btns.forEach(function(x,j){x.setAttribute("aria-pressed",String(j===k))});if(blank)blank.textContent=labels[k];}},inner);
   if(!pics)b.textContent=lab;btns.push(b);box.appendChild(b);});
  card.appendChild(box);
  return function(){return picked<0?null:picked===answer;};
 }
 var blank=null;
 if(Q.t==="choose")check=choices(Q.options,Q.answer,Q.pics);
 else if(Q.t==="truefalse")check=choices(Q.yesNo?["👍 Yes","👎 No"]:["True","False"],Q.answer?0:1,!!Q.yesNo);
 else if(Q.t==="gap"){
  blank=el("span",{class:"blank",text:"?"});
  card.appendChild(el("div",{class:"gap"},[document.createTextNode(Q.before+" "),blank,document.createTextNode(" "+Q.after)]));
  check=choices(Q.options,Q.answer,false);
 }
 else if(Q.t==="order"){
  var list=el("div",{class:"opts order"});var seq=[];var yours=el("input",{class:"yours",readonly:"",id:"order"+i,"aria-label":"Your order for question "+(i+1),value:"Your order: tap the boxes"});
  var items=shuffled(Q.items.map(function(t,k){return{t:t,k:k}}));var btns=[];
  function draw(){btns.forEach(function(b){var n=seq.indexOf(b._k);b.setAttribute("aria-pressed",String(n>=0));b.firstChild.textContent=n>=0?String(n+1):"·";});
   yours.value=seq.length?"Your order: "+seq.map(function(k){return Q.items[k]}).join(" → "):"Your order: tap the boxes";}
  items.forEach(function(it){var b=el("button",{class:"opt",type:"button","aria-pressed":"false",onclick:function(){var n=seq.indexOf(it.k);if(n>=0)seq.splice(n,1);else seq.push(it.k);draw();}},[el("b",{text:"·"}),el("span",{text:it.t})]);b._k=it.k;btns.push(b);list.appendChild(b);});
  card.appendChild(list);
  card.appendChild(el("div",{class:"row"},[yours,el("button",{class:"small",type:"button",text:"↺ Start again",onclick:function(){seq=[];draw();}})]));
  check=function(){if(seq.length<Q.items.length)return null;return seq.every(function(k,n){return k===n});};
 }
 else if(Q.t==="match"){
  var opts=Q.options||shuffled(Q.pairs.map(function(p){return p[1]}));
  var box=el("div",{class:"match"});var sels=[];
  Q.pairs.forEach(function(p,k){var id="m"+i+"_"+k;
   var s=el("select",{id:id},[el("option",{value:"",text:"Choose…"})].concat(opts.map(function(o){return el("option",{value:o,text:o})})));
   var row=el("div",{class:"pair"},[el("label",{for:id,text:p[0]}),s]);sels.push({s:s,row:row,want:p[1]});box.appendChild(row);});
  card.appendChild(box);
  check=function(){var got=0,any=false;sels.forEach(function(x){if(x.s.value)any=true;var ok=x.s.value===x.want;x.row.className="pair"+(x.s.value?(ok?" right":" wrong"):"");if(ok)got++;});return any?{got:got,of:sels.length}:null;};
  check.marks=Q.pairs.length;
 }
 else if(Q.t==="find"){
  var inp=el("input",{class:"text",id:"find"+i,autocomplete:"off","aria-label":"Answer to question "+(i+1),placeholder:"Type the word here"});
  card.appendChild(inp);
  check=function(){var v=inp.value.trim().toLowerCase().replace(/[^a-z']/g,"");if(!v)return null;return Q.answers.indexOf(v)>=0;};
 }
 else if(Q.t==="write"){
  if(Q.hint)card.appendChild(el("p",{class:"hint",text:"💡 "+Q.hint}));
  card.appendChild(el("textarea",{id:"write"+i,rows:String(Q.lines||3),"aria-label":"Answer to question "+(i+1),placeholder:"Write your answer here…"}));
 }
 else if(Q.t==="draw"){
  var cv=el("canvas",{width:"760",height:"300","aria-label":"Drawing pad"});card.appendChild(cv);
  var ctx=cv.getContext("2d");ctx.lineCap="round";ctx.lineJoin="round";var col="#2b2340",down=false;
  function pt(e){var r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height];}
  cv.addEventListener("pointerdown",function(e){down=true;cv.setPointerCapture(e.pointerId);var p=pt(e);ctx.beginPath();ctx.moveTo(p[0],p[1]);});
  cv.addEventListener("pointermove",function(e){if(!down)return;var p=pt(e);ctx.strokeStyle=col;ctx.lineWidth=col==="#ffffff"?24:7;ctx.lineTo(p[0],p[1]);ctx.stroke();});
  cv.addEventListener("pointerup",function(){down=false;});
  var pens=el("div",{class:"pens"});var pbs=[];
  ["#2b2340","#e11d48","#f59e0b","#16a34a","#3b82f6","#a855f7","#8b5a2b","#ffffff"].forEach(function(c,k){var b=el("button",{class:"pen",type:"button",title:c==="#ffffff"?"Rubber":"Colour","aria-label":c==="#ffffff"?"Rubber":"Pen colour","aria-pressed":String(k===0),style:"background:"+c,onclick:function(){col=c;pbs.forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});}});pbs.push(b);pens.appendChild(b);});
  pens.appendChild(el("button",{class:"small",type:"button",text:"🧽 Clear",onclick:function(){ctx.clearRect(0,0,cv.width,cv.height);}}));
  card.appendChild(pens);
 }
 var note=el("div",{class:"note"});card.appendChild(note);
 qs.appendChild(card);
 checks.push({card:card,check:check,note:note,marks:check&&check.marks||1,t:Q.t});
});

function confetti(){var cs=[WS.colours[0],WS.colours[1],"#facc15","#22c55e","#f472b6"];for(var i=0;i<70;i++){var c=el("span",{class:"confetti",style:"left:"+Math.random()*100+"vw;background:"+cs[i%cs.length]+";animation-duration:"+(1.8+Math.random()*1.8)+"s;animation-delay:"+Math.random()*.4+"s"});document.body.appendChild(c);setTimeout(function(x){return function(){x.remove()}}(c),4200);}}

document.getElementById("check").addEventListener("click",function(){
 var got=0,total=0,blank=0;
 checks.forEach(function(c){
  var old=c.card.querySelector(".mark");if(old)old.remove();c.card.classList.remove("right","wrong");c.note.textContent="";
  if(!c.check){c.note.textContent=c.t==="draw"?"🎨 Your teacher will look at your picture.":"✏️ Your teacher will read this.";c.note.style.color="#6b6385";return;}
  total+=c.marks;var r=c.check();
  if(r===null){blank++;c.note.textContent="👀 You haven't answered this yet.";c.note.style.color="#b45309";return;}
  if(typeof r==="object"){got+=r.got;var all=r.got===r.of;c.card.classList.add(all?"right":"wrong");c.card.appendChild(el("span",{class:"mark",text:all?"⭐":"🔁"}));
   c.note.textContent=all?"Brilliant, all matched!":r.got+" matched correctly. Try the pink ones again.";c.note.style.color=all?"#16a34a":"#e11d48";return;}
  if(r)got++;c.card.classList.add(r?"right":"wrong");c.card.appendChild(el("span",{class:"mark",text:r?"✅":"❌"}));
  c.note.textContent=r?"Well done!":"Not quite. Read the story again and have another go.";c.note.style.color=r?"#16a34a":"#e11d48";
 });
 window.zeraResult={score:got,total:total};
 var pct=total?got/total:0;var stars=pct>=.9?"⭐⭐⭐":pct>=.6?"⭐⭐":pct>0?"⭐":"";
 document.getElementById("score").innerHTML="You scored <b>"+got+" out of "+total+"</b> <span class=stars>"+stars+"</span>"+(blank?" · "+blank+" still to answer":"");
 if(pct>=.9&&!blank)confetti();
 say(pct>=.9?"Amazing reading!":pct>=.6?"Good work! Check the red ones again.":"Keep going! Read the story again and try the red ones.");
});
})();
</script>
</body>
</html>`;
}
