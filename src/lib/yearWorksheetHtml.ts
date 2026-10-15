/* A year-group worksheet (app/yearWorksheets.ts) as one self-contained,
   game-like page: the story at the top with a 🔊 to hear each part, a
   progress bar that fills as the child answers, then the questions as bright
   cards, each a different kind of activity:

     choose / true or false   big coloured game-show tiles
     match                    drag each meaning onto its word
     put in order             drag the events into numbered slots
     fill the gap             drag the missing word into the sentence
     find it                  tap the word in the story
     build the word           a picture; drag its sounds into the boxes
     write / draw             a writing box / a drawing pad

   Every drag can also be done by tapping (tap a card, then where it goes),
   so it works on any tablet. "Check my answers" marks everything at once —
   a tick or a cross on every card and "You scored 7 out of 9" — and the child
   can change answers and check again. Writing and drawing aren't marked.

   It runs as an assignment lesson (lib/lessonFrame.ts), sandboxed with no
   access to the app, so it carries everything it needs. Tiles use
   aria-pressed, and every drop box and found word is a labelled read-only
   box, so the collector reads back exactly what the child did; the score is
   left in window.zeraResult.

   Review mode (with `review`): the same page rebuilt from what a child
   handed in — their answers put back in place, marked as the Check button
   marks them, with the right answer shown wherever theirs was wrong — for
   the teacher to look through. Nothing in it can be changed. */

import type { YearWorksheet } from "@/app/yearWorksheets";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A child's submission, for review mode: the answers the lesson collector
    read back (lib/lessonFrame.ts), in its order, and any drawings. */
export type WorksheetReview = {
  name: string;
  answers: { label: string; value: string }[];
  images: string[];
};

export function yearWorksheetHtml(ws: YearWorksheet, review?: WorksheetReview): string {
  const [c1, c2] = ws.colours;
  // the data goes in a script, so no "<" may close it early
  const data = JSON.stringify(ws).replace(/</g, "\\u003c");
  const reviewData = JSON.stringify(review ?? null).replace(/</g, "\\u003c");
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
.pbar{position:sticky;top:8px;z-index:5;margin-top:18px;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-radius:999px;padding:8px 14px;box-shadow:0 6px 18px rgba(0,0,0,.1);font-weight:800}
.ptrack{flex:1;height:14px;border-radius:999px;background:#eee9fb;overflow:hidden}
.pfill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--c1),var(--c2));transition:width .4s}
.tiles .opt{color:#fff;border:0;background:var(--tc);box-shadow:0 5px 0 rgba(0,0,0,.18);flex:1 1 200px;text-align:left;display:flex;gap:10px;align-items:center;min-height:58px}
.tiles .opt i{font-style:normal;flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.28);font-size:18px}
.tiles .opt:hover{border:0;transform:translateY(-3px)}
.tiles .opt[aria-pressed=true]{background:var(--tc);outline:4px solid var(--ink);outline-offset:2px;transform:scale(1.03)}
.tiles.chosen .opt[aria-pressed=false]{opacity:.5}
.tiles.short .opt{flex:0 1 110px;justify-content:center;font-size:30px}
.pool{display:flex;flex-wrap:wrap;gap:8px;padding:10px;border-radius:16px;min-height:60px;background:repeating-linear-gradient(45deg,#faf8ff,#faf8ff 10px,#f3effd 10px,#f3effd 20px);border:2px dashed #ddd6f3}
.pool:empty:after{content:"All placed! Tap a box to take a card back.";color:var(--soft);font-weight:700;font-size:14px;padding:8px}
.chip{touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;font:inherit;font-weight:800;font-size:${young ? 19 : 16}px;padding:9px 14px;border-radius:14px;background:#fff;border:3px solid var(--hue);color:var(--ink);box-shadow:0 4px 0 color-mix(in srgb,var(--hue) 45%,#fff);transition:transform .12s}
.chip:hover{transform:translateY(-2px) rotate(-1deg)}
.chip.picked{background:var(--hue);color:#fff;transform:scale(1.06) rotate(-2deg)}
.chip.used{display:none}
.ghost{position:fixed;pointer-events:none;z-index:50;transform:translate(-50%,-50%) rotate(-4deg) scale(1.1);opacity:.95;box-shadow:0 12px 24px rgba(0,0,0,.25)}
.hintline{font-size:14px;color:var(--soft);font-weight:700;margin:0 0 8px}
.slots{display:grid;gap:10px;margin-top:12px}
.slotrow{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.slotrow label{flex:1 1 200px;font-weight:800;font-size:${young ? 19 : 16}px}
.slotrow label.nb{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--hue);color:#fff}
input.drop{flex:1 1 220px;min-height:50px;border:3px dashed #cfc6ef;border-radius:14px;padding:10px 12px;font:inherit;font-weight:800;font-size:${young ? 19 : 16}px;color:var(--ink);background:#fff;cursor:pointer;caret-color:transparent}
input.drop::placeholder{color:#b9b0d6;font-weight:700}
input.drop.over{border-color:var(--hue);background:color-mix(in srgb,var(--hue) 12%,#fff);transform:scale(1.02)}
input.drop.filled{border-style:solid;border-color:var(--hue);background:color-mix(in srgb,var(--hue) 13%,#fff)}
input.drop.right{border-color:#22c55e;background:#e9fbef}input.drop.wrong{border-color:#f43f5e;background:#ffeef2}
input.drop.inline{display:inline-block;flex:none;width:170px;text-align:center;min-height:0;padding:4px 10px;vertical-align:middle}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.words{max-height:260px;overflow:auto;line-height:2.1;background:#fffdf5;border-radius:14px;padding:10px 14px;border:2px solid #f1e7c8;font-size:${young ? 20 : 17}px}
.words p{margin:0 0 8px}
.w{cursor:pointer;border-radius:8px;padding:2px 1px;transition:background .12s}
.w:hover{background:#fff1b8}.w.sel{background:#ffd21f;box-shadow:0 0 0 3px #f59e0b;font-weight:800}
.found{margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-weight:800}
.found input{flex:1;min-width:160px}
.spell{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.spell .pic{font-size:72px;line-height:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,.15))}
.spell .boxes{display:flex;gap:8px}
input.drop.sound{flex:none;width:64px;height:64px;min-height:0;padding:0;text-align:center;font-size:30px;border-radius:16px}
.chip.chip-l{font-size:26px;min-width:56px;text-align:center}
.slotrow label.pic{flex:none;font-size:46px;line-height:1;width:70px;text-align:center}
.review .pool,.review .hintline,.review .pens,.review .say,.review #check,.review .pbar{display:none!important}
.review .q,.review .story,.review .name{pointer-events:none}
.review .opt[data-right="1"]{outline:4px solid #16a34a;outline-offset:2px}
.review .opt[aria-pressed="true"]{transform:scale(1.03)}
.should{display:block;margin-top:4px;font-size:14px;font-weight:800;color:#16a34a}
.rbanner{display:none;margin:0 0 14px;padding:12px 16px;border-radius:18px;background:#0A4F29;color:#fff;font-weight:800;font-size:17px}
.review .rbanner{display:block}
@media (max-width:520px){.big{font-size:40px}.story{padding:16px}.q{padding:16px 14px}}
</style>
</head>
<body>
<div class="wrap">
  <div class="rbanner" id="rbanner"></div>
  <header class="banner">
    <span class="big" aria-hidden="true">${ws.emoji}</span>
    <span class="tag">${esc(ws.year)} · Reading worksheet · about ${ws.minutes} minutes</span>
    <h1>${esc(ws.title)}</h1>
    <p class="focus">${esc(ws.focus)}</p>
    <div class="name"><label for="childname">My name:</label><input id="childname" name="name" autocomplete="off" placeholder="Type your name"></div>
  </header>
  <section class="story" id="story"></section>
  <div class="pbar" aria-live="polite"><span>⭐</span><div class="ptrack"><div class="pfill" id="pfill"></div></div><span id="ptext"></span></div>
  <div class="qs" id="qs"></div>
  <div class="bar"><button class="check" id="check">✅ Check my answers</button><span class="score" id="score" aria-live="polite"></span></div>
</div>
<script>
(function(){
var WS=${data};
var REVIEW=${reviewData};
var HUES=["#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#f43f5e","#14b8a6","#6366f1","#f97316","#0ea5e9"];
var KIND={spell:"🔤 Build the word",choose:"🎯 Choose",truefalse:"✅ True or false",gap:"🧩 Drag the missing word",order:"🔢 Drag into order",match:"🔗 Drag to match",find:"🔍 Find it in the story",write:"✏️ Write",draw:"🎨 Draw"};
var TILE=["#ef4444","#3b82f6","#f59e0b","#10b981","#8b5cf6","#ec4899"];
var canSpeak=!REVIEW&&"speechSynthesis" in window;
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

// drag-and-drop (or tap, then tap) cards into boxes
var dragging=null;
function board(card,slots,labels,reusable,hint,slotsEl){
 card.appendChild(el("p",{class:"hintline",text:"✋ "+hint}));
 var pool=el("div",{class:"pool"});var sel=null;
 function chipFor(text){var c=el("button",{class:"chip",type:"button",text:text});c._text=text;
  c.addEventListener("pointerdown",function(e){if(e.button>0)return;var sx=e.clientX,sy=e.clientY,ghost=null,over=null;c.setPointerCapture(e.pointerId);
   function mv(ev){if(!ghost&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;
    if(!ghost){ghost=c.cloneNode(true);ghost.classList.add("ghost");document.body.appendChild(ghost);dragging=c;}
    ghost.style.left=ev.clientX+"px";ghost.style.top=ev.clientY+"px";
    var t=document.elementFromPoint(ev.clientX,ev.clientY);var d=t&&t.closest?t.closest("input.drop"):null;if(d&&slotOf(d)<0)d=null;
    if(over&&over!==d)over.classList.remove("over");over=d;if(d)d.classList.add("over");}
   function up(){c.removeEventListener("pointermove",mv);c.removeEventListener("pointerup",up);c.removeEventListener("pointercancel",up);
    if(ghost){ghost.remove();dragging=null;if(over){over.classList.remove("over");place(c,slots[slotOf(over)]);}}
    else{if(sel===c){c.classList.remove("picked");sel=null;}else{if(sel)sel.classList.remove("picked");sel=c;c.classList.add("picked");}}}
   c.addEventListener("pointermove",mv);c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);});
  return c;}
 function slotOf(inp){for(var k=0;k<slots.length;k++)if(slots[k].input===inp)return k;return -1;}
 function giveBack(s){if(s.chip&&!reusable)s.chip.classList.remove("used");s.chip=null;s.input.value="";s.input.classList.remove("filled","right","wrong");}
 function place(c,s){giveBack(s);s.chip=c;s.input.value=c._text;s.input.classList.add("filled");if(!reusable)c.classList.add("used");
  if(sel){sel.classList.remove("picked");sel=null;}s.input.animate([{transform:"scale(1.08)"},{transform:"scale(1)"}],{duration:220});progress();}
 slots.forEach(function(s){s.input.addEventListener("click",function(){if(sel)place(sel,s);else if(s.input.value){giveBack(s);progress();}});});
 labels.forEach(function(t){pool.appendChild(chipFor(t))});
 card.appendChild(pool);if(slotsEl)card.appendChild(slotsEl);
}
// how many questions have an answer so far
function progress(){var n=0;cards.forEach(function(c){if(c._filled&&c._filled())n++;});
 document.getElementById("pfill").style.width=(cards.length?n/cards.length*100:0)+"%";
 document.getElementById("ptext").textContent=n===cards.length?"All answered! Press Check 🎉":n+" of "+cards.length+" answered";}
var cards=[];

// the questions
var checks=[];var qs=document.getElementById("qs");
WS.questions.forEach(function(Q,i){
 var hue=HUES[i%HUES.length];
 var card=el("div",{class:"q",style:"--hue:"+hue+";animation-delay:"+(i*.05)+"s"});
 var title=Q.t==="gap"?"Which word fits the gap?":Q.q;
 card.appendChild(el("div",{class:"head"},[el("span",{class:"num",text:String(i+1)}),el("span",{class:"kind",text:KIND[Q.t]}),sayBtn(Q.t==="gap"?Q.before+" blank "+Q.after:Q.q)]));
 card.appendChild(el("h3",{class:"question",text:title}));
 var check=null;

 function choices(labels,answer,pics,tf){
  var box=el("div",{class:"opts"+(pics?" pics":" tiles")});var picked=-1;var btns=[];
  // mix the choices so the answer isn't always in the same place (not yes/no,
  // true/false or numbers, which read best in their usual order)
  if(!tf&&!/^(👍 Yes)$/.test(labels[0])&&!labels.every(function(l){return /^\\d+$/.test(l)})){
   var order=shuffled(labels.map(function(_,k){return k}));answer=order.indexOf(answer);labels=order.map(function(k){return labels[k]});}
  // single letters or sounds ("o", "sh") get no A/B/C badge, so the badge isn't mistaken for an answer
  var short=!tf&&!pics&&labels.every(function(l){return l.length<=3});
  if(short)box.classList.add("short");
  labels.forEach(function(lab,k){
   var inner;
   if(pics){var m=lab.match(/^(\\S+)\\s+(.*)$/);inner=[el("span",{class:"e",text:m?m[1]:""}),el("span",{text:m?m[2]:lab})];}
   else inner=short?[el("span",{text:lab})]:[el("i",{text:tf?(k===0?"✔":"✘"):"ABCDEF"[k]}),el("span",{text:lab})];
   var b=el("button",{class:"opt",type:"button","data-right":k===answer?"1":"0","aria-pressed":"false",style:"--tc:"+(tf?(k===0?"#16a34a":"#e11d48"):TILE[k%TILE.length]),onclick:function(){picked=k;box.classList.add("chosen");btns.forEach(function(x,j){x.setAttribute("aria-pressed",String(j===k))});progress();}},inner);
   btns.push(b);box.appendChild(b);});
  card.appendChild(box);
  card._filled=function(){return picked>=0};
  return function(){return picked<0?null:picked===answer;};
 }
 if(Q.t==="choose")check=choices(Q.options,Q.answer,Q.pics,false);
 else if(Q.t==="truefalse")check=choices(Q.yesNo?["👍 Yes","👎 No"]:["True","False"],Q.answer?0:1,!!Q.yesNo,!Q.yesNo);
 else if(Q.t==="gap"){
  var gid="gap"+i;var gin=el("input",{class:"drop inline",id:gid,readonly:"",placeholder:"drop here","data-want":Q.options[Q.answer]});
  card.appendChild(el("div",{class:"gap"},[document.createTextNode(Q.before+" "),el("label",{class:"sr",for:gid,text:"The missing word"}),gin,document.createTextNode(" "+Q.after)]));
  var gb=board(card,[{input:gin,want:Q.options[Q.answer]}],Q.options,false,"Drag the right word into the gap, or tap a word and then the gap.");
  check=function(){var v=gin.value;gin.classList.remove("right","wrong");if(!v)return null;var ok=v===Q.options[Q.answer];gin.classList.add(ok?"right":"wrong");return ok;};
  card._filled=function(){return !!gin.value};
 }
 else if(Q.t==="order"){
  var oslots=Q.items.map(function(t,k){var id="o"+i+"_"+k;var inp=el("input",{class:"drop",id:id,readonly:"",placeholder:"drop event "+(k+1)+" here","data-want":t});return{row:el("div",{class:"slotrow"},[el("label",{class:"nb",for:id,text:String(k+1)}),inp]),input:inp,want:t};});
  var ol=el("div",{class:"slots"});oslots.forEach(function(x){ol.appendChild(x.row)});
  board(card,oslots,shuffled(Q.items),false,"Drag each event into its place: what happened first goes in box 1.",ol);
  check=function(){var all=true,ok=true;oslots.forEach(function(x){x.input.classList.remove("right","wrong");if(!x.input.value)all=false;});if(!all)return null;
   oslots.forEach(function(x){var r=x.input.value===x.want;x.input.classList.add(r?"right":"wrong");if(!r)ok=false;});return ok;};
  card._filled=function(){return oslots.every(function(x){return x.input.value})};
 }
 else if(Q.t==="spell"){
  var sslots=Q.sounds.map(function(x,k){var id="s"+i+"_"+k;return{input:el("input",{class:"drop sound",id:id,readonly:"","aria-label":"Sound "+(k+1)+" of "+Q.word,"data-want":x}),want:x};});
  var row=el("div",{class:"spell"},[el("span",{class:"pic","aria-hidden":"true",text:Q.pic}),el("div",{class:"boxes"},sslots.map(function(x){return x.input})),canSpeak?el("button",{class:"small",type:"button",text:"🔊 Hear the word",onclick:function(){say(Q.word)}}):null]);
  board(card,sslots,shuffled(Q.sounds.concat(Q.extra||[])),false,"Drag the sounds into the boxes to build the word.",row);
  card.querySelectorAll(".pool .chip").forEach(function(c){c.classList.add("chip-l")});
  check=function(){var all=true;sslots.forEach(function(x){x.input.classList.remove("right","wrong");if(!x.input.value)all=false;});if(!all)return null;
   var ok=true;sslots.forEach(function(x){var r=x.input.value===x.want;x.input.classList.add(r?"right":"wrong");if(!r)ok=false;});return ok;};
  card._filled=function(){return sslots.every(function(x){return x.input.value})};
 }
 else if(Q.t==="match"){
  var reuse=!!Q.options;
  var mslots=Q.pairs.map(function(p,k){var id="m"+i+"_"+k;var inp=el("input",{class:"drop",id:id,readonly:"",placeholder:"drop here","data-want":p[1]});var isPic=/^\\p{Extended_Pictographic}/u.test(p[0])&&p[0].length<=4;return{row:el("div",{class:"slotrow"},[el("label",{for:id,class:isPic?"pic":"",text:p[0]}),inp]),input:inp,want:p[1]};});
  var ml=el("div",{class:"slots"});mslots.forEach(function(x){ml.appendChild(x.row)});
  board(card,mslots,reuse?Q.options:shuffled(Q.pairs.map(function(p){return p[1]})),reuse,reuse?"Drag a label onto each one (you can use each label more than once).":"Drag each card onto the word it matches.",ml);
  check=function(){var got=0,any=false;mslots.forEach(function(x){x.input.classList.remove("right","wrong");if(!x.input.value)return;any=true;var r=x.input.value===x.want;x.input.classList.add(r?"right":"wrong");if(r)got++;});return any?{got:got,of:mslots.length}:null;};
  check.marks=Q.pairs.length;
  card._filled=function(){return mslots.every(function(x){return x.input.value})};
 }
 else if(Q.t==="find"){
  var fid="find"+i;var fin=el("input",{class:"text",id:fid,readonly:"",placeholder:"tap a word in the story below","data-want":Q.answers[0]});
  var wbox=el("div",{class:"words"});var cur=null;
  WS.passage.paras.forEach(function(para){var pp=el("p");para.split(/(\\s+)/).forEach(function(tok){
   if(/^\\s+$/.test(tok)||!tok){pp.appendChild(document.createTextNode(tok));return;}
   var m=tok.match(/^([^A-Za-z']*)([A-Za-z'’-]+)(.*)$/);if(!m){pp.appendChild(document.createTextNode(tok));return;}
   pp.appendChild(document.createTextNode(m[1]));
   var w=el("span",{class:"w",role:"button",tabindex:"0",text:m[2],onclick:function(){if(cur)cur.classList.remove("sel");cur=w;w.classList.add("sel");fin.value=m[2].replace(/[’]/g,"'");progress();}});
   pp.appendChild(w);pp.appendChild(document.createTextNode(m[3]));});wbox.appendChild(pp);});
  card.appendChild(el("p",{class:"hintline",text:"Tap the word in the story. Tap another word to change it."}));
  card.appendChild(wbox);
  card.appendChild(el("div",{class:"found"},[el("label",{for:fid,text:"🔍 I found:"}),fin]));
  check=function(){var v=fin.value.trim().toLowerCase().replace(/[^a-z']/g,"");if(!v)return null;return Q.answers.indexOf(v)>=0;};
  card._filled=function(){return !!fin.value};
 }
 else if(Q.t==="write"){
  if(Q.hint)card.appendChild(el("p",{class:"hint",text:"💡 "+Q.hint}));
  var ta=el("textarea",{id:"write"+i,rows:String(Q.lines||3),"aria-label":"Answer to question "+(i+1),placeholder:"Write your answer here…",oninput:function(){progress()}});
  card.appendChild(ta);card._filled=function(){return ta.value.trim().length>2};
 }
 else if(Q.t==="draw"){
  var cv=el("canvas",{width:"760",height:"300","aria-label":"Drawing pad"});card.appendChild(cv);
  var ctx=cv.getContext("2d");ctx.lineCap="round";ctx.lineJoin="round";var col="#2b2340",down=false;
  function pt(e){var r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height];}
  cv.addEventListener("pointerdown",function(e){down=true;cv.setPointerCapture(e.pointerId);var p=pt(e);ctx.beginPath();ctx.moveTo(p[0],p[1]);});
  cv.addEventListener("pointermove",function(e){if(!down)return;var p=pt(e);ctx.strokeStyle=col;ctx.lineWidth=col==="#ffffff"?24:7;ctx.lineTo(p[0],p[1]);ctx.stroke();});
  cv.addEventListener("pointerup",function(){if(down){drew=true;progress();}down=false;});var drew=false;card._filled=function(){return drew};
  var pens=el("div",{class:"pens"});var pbs=[];
  ["#2b2340","#e11d48","#f59e0b","#16a34a","#3b82f6","#a855f7","#8b5a2b","#ffffff"].forEach(function(c,k){var b=el("button",{class:"pen",type:"button",title:c==="#ffffff"?"Rubber":"Colour","aria-label":c==="#ffffff"?"Rubber":"Pen colour","aria-pressed":String(k===0),style:"background:"+c,onclick:function(){col=c;pbs.forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});}});pbs.push(b);pens.appendChild(b);});
  pens.appendChild(el("button",{class:"small",type:"button",text:"🧽 Clear",onclick:function(){ctx.clearRect(0,0,cv.width,cv.height);}}));
  card.appendChild(pens);
 }
 var note=el("div",{class:"note"});card.appendChild(note);
 qs.appendChild(card);cards.push(card);
 checks.push({card:card,check:check,note:note,marks:check&&check.marks||1,t:Q.t});
});

progress();
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
 if(pct>=.9&&!blank&&!REVIEW)confetti();
 say(pct>=.9?"Amazing reading!":pct>=.6?"Good work! Check the red ones again.":"Keep going! Read the story again and try the red ones.");
});

/* ---- review: put a child's answers back and mark them ---- */
if(REVIEW){
 document.body.classList.add("review");
 document.getElementById("rbanner").textContent="👀 "+REVIEW.name+"'s answers, marked. The right answer shows in green wherever theirs was wrong.";
 function sh(x,n){x=String(x==null?"":x).replace(/🔊/g,"").replace(/\\s+/g," ").trim();return x.length>n?x.slice(0,n)+"…":x;}
 var A=REVIEW.answers.slice(),k=0;
 // typed and dropped answers come first, in page order (as the collector reads them)
 document.querySelectorAll("input,textarea,select").forEach(function(f){
  var t=(f.type||"").toLowerCase();
  if(["hidden","button","submit","reset","image","file","password","radio","checkbox"].indexOf(t)>=0)return;
  if(f.id==="childname"){if(A[k]&&A[k].label==="Name"){f.value=A[k].value;k++;}else f.value=REVIEW.name;return;}
  var a=A[k++];if(!a)return;var v=a.value==="—"?"":a.value.replace(/…$/,"");
  f.value=v;if(v&&f.classList.contains("drop"))f.classList.add("filled");
 });
 // then the tapped choices: find the question, then the tile
 A.slice(k).forEach(function(a){
  cards.forEach(function(card){
   var h=card.querySelector("h3");if(!h||sh(h.innerText,200)!==a.label)return;
   card.querySelectorAll(".opt").forEach(function(b){if(sh(b.innerText,200)===a.value)b.click();});
  });
 });
 // their drawings, in order
 var cvs=[].slice.call(document.querySelectorAll(".q canvas"));
 (REVIEW.images||[]).forEach(function(src,n){var c=cvs[n];if(!c)return;var im=new Image();
  im.onload=function(){c.getContext("2d").drawImage(im,0,0,c.width,c.height);};im.src=src;});
 progress();
 document.getElementById("check").click();
 // under each wrong drop or found word, what it should have been
 document.querySelectorAll("input.wrong[data-want],input.text[data-want]").forEach(function(f){
  if(f.classList.contains("text")){var card=f.closest(".q");if(!card||!card.classList.contains("wrong"))return;}
  var w=el("span",{class:"should",text:"✔ Should be: "+f.getAttribute("data-want")});
  (f.closest(".slotrow")||f.closest(".found")||f.parentElement).appendChild(w);
 });
}
})();
</script>
</body>
</html>`;
}
