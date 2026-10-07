/* Showing a teacher's HTML lesson to a child, and reading back what they did.

   The lesson runs in a sandboxed iframe with no access to the app (scripts
   allowed, same-origin not), so a lesson can't touch the page, the sign-in
   or anything stored. To see the child's work, a small collector script is
   added to the lesson before it's shown. When the child presses Submit, the
   page asks it, by message, for:

     - every answer: typed text, ticked boxes, chosen options, and tapped
       choices marked as selected (aria-pressed, or a "selected"-type class)
     - the score, if the lesson shows one ("4 out of 5", "Score: 7/10"), or
       sets window.zeraResult = { score, total }
     - drawings on any canvas, as small pictures
     - the page's visible text, so the teacher sees exactly how it ended

   Any HTML lesson works without changes. */

const COLLECTOR = `<script>(function(){
function sh(s,n){s=String(s==null?"":s).replace(/🔊/g,"").replace(/\\s+/g," ").trim();return s.length>n?s.slice(0,n)+"…":s;}
function isName(el){return /name/i.test((el.name||"")+" "+(el.id||"")+" "+(el.placeholder||"")+" "+(el.getAttribute("aria-label")||""));}
function own(el){var l=null;if(el.id){try{l=document.querySelector('label[for="'+CSS.escape(el.id)+'"]');}catch(e){}}
 if(!l)l=el.closest("label");return l?sh(l.innerText,200):"";}
function question(el){var c=el.parentElement;
 for(var i=0;i<6&&c&&c!==document.body;i++,c=c.parentElement){
  var h=c.querySelector("h1,h2,h3,h4,h5,legend,.question,.q-text,.prompt,.text");
  if(h&&!h.contains(el)&&sh(h.innerText,1))return sh(h.innerText,200);}
 return el.getAttribute("aria-label")||el.placeholder||el.name||"Answer";}
function collect(){
 var out=[],n=0;
 document.querySelectorAll("input,textarea,select").forEach(function(el){
  if(n>=200)return;var t=(el.type||"").toLowerCase();
  if(["hidden","button","submit","reset","image","file","password"].indexOf(t)>=0)return;
  if(t==="radio"||t==="checkbox"){if(!el.checked)return;out.push({label:question(el),value:own(el)||el.value||"✔"});n++;return;}
  if(el.tagName==="SELECT"){var o=el.options[el.selectedIndex];out.push({label:own(el)||question(el),value:o?sh(o.text,300):""});n++;return;}
  if(isName(el)){if(el.value.trim()){out.push({label:"Name",value:sh(el.value,100)});n++;}return;}
  out.push({label:own(el)||question(el),value:sh(el.value,1000)||"—"});n++;});
 var sel='[aria-pressed="true"],[aria-checked="true"],[aria-selected="true"],.selected,.sel,.chosen,.picked,.is-selected';
 document.querySelectorAll(sel).forEach(function(el){
  if(n>=200||el.querySelector("input,textarea,select"))return;
  var v=sh(el.innerText||el.getAttribute("aria-label")||el.title,200);if(!v)return;
  out.push({label:question(el),value:v});n++;});
 var text=sh(document.body?document.body.innerText:"",8000);
 var score=null,r=window.zeraResult;
 if(r&&isFinite(r.score)&&isFinite(r.total))score={score:+r.score,total:+r.total};
 else{var re=/(\\d{1,3})\\s*(?:out of|\\/)\\s*(\\d{1,3})/gi,m,last=null;
  while((m=re.exec(text)))if(+m[2]>0&&+m[1]<=+m[2])last=m;
  if(last)score={score:+last[1],total:+last[2]};}
 var images=[];
 document.querySelectorAll("canvas").forEach(function(c){
  if(images.length>=2||!c.width||!c.height)return;
  try{var k=Math.min(1,480/Math.max(c.width,c.height)),o=document.createElement("canvas");
   o.width=Math.round(c.width*k);o.height=Math.round(c.height*k);var x=o.getContext("2d");
   x.fillStyle="#fff";x.fillRect(0,0,o.width,o.height);x.drawImage(c,0,0,o.width,o.height);
   var d=x.getImageData(0,0,o.width,o.height).data,ink=0;
   for(var i=0;i<d.length;i+=40)if(d[i]<235||d[i+1]<235||d[i+2]<235)ink++;
   if(ink>20)images.push(o.toDataURL("image/jpeg",0.7));}catch(e){}});
 return {answers:out,text:text,score:score,images:images};}
window.addEventListener("message",function(e){
 if(!e.data||e.data.type!=="zera-collect")return;
 var p;try{p=collect();}catch(err){p={answers:[],text:"",score:null,images:[]};}
 parent.postMessage({type:"zera-collected",nonce:e.data.nonce,payload:p},"*");});
})();<\/script>`;

/** The lesson with the collector added, ready for an iframe's srcdoc. */
export function lessonDoc(html: string): string {
  const i = html.toLowerCase().lastIndexOf("</body>");
  return i >= 0 ? html.slice(0, i) + COLLECTOR + html.slice(i) : html + COLLECTOR;
}

/** What the lesson may do: run its own scripts and forms, show alerts and
    open links — but never reach the app (no allow-same-origin). */
export const LESSON_SANDBOX = "allow-scripts allow-forms allow-modals allow-popups";

export type Collected = {
  answers: { label: string; value: string }[];
  text: string;
  score: { score: number; total: number } | null;
  images: string[];
};

/** Ask the lesson in this iframe for the child's work. Resolves with
    whatever came back, or empty after a couple of seconds if the lesson
    can't answer — the submission still goes in. */
export function collectFrom(frame: HTMLIFrameElement): Promise<Collected> {
  return new Promise((resolve) => {
    const nonce = Math.random().toString(36).slice(2);
    const empty: Collected = { answers: [], text: "", score: null, images: [] };
    const done = (v: Collected) => {
      window.removeEventListener("message", onMsg);
      clearTimeout(timer);
      resolve(v);
    };
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow) return;
      if (e.data?.type === "zera-collected" && e.data.nonce === nonce) done({ ...empty, ...e.data.payload });
    };
    const timer = setTimeout(() => done(empty), 2500);
    window.addEventListener("message", onMsg);
    frame.contentWindow?.postMessage({ type: "zera-collect", nonce }, "*");
  });
}
