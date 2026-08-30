const dict = {
  ar: {
    club: "نادي أثر", fair: "ملتقى الأندية", planted: "أثر انغرس",
    question: "ما الأثر الذي تريد تركه؟", writeMine: "أكتب أثرك",
    scan: "امسح واترك أثرك", langSwitch: "EN",
    introTitle: ["خمس ثواني.", "سؤال واحد.", "أثر يبقى."],
    introBody: "اللحظة على جوالك، وبعدها أثرك يظهر على الجدار قدام الكل.",
    enter: "ادخل اللحظة", think: "فكّر. لا تكتب للحين.", skip: "تخطى",
    writeTitle: "أكتب أثرُك في جملة", writeHint: "أكثر من أربع كلمات لن تظهر كاملة على الجدار",
    writePlaceholder: "أخلي أحد يحس إنه قادر", plant: "اغرس الأثر",
    planting: "ينغرس...", tooShort: "اكتب جملة قصيرة.",
    saveFail: "ما قدرنا نحفظ الأثر.", doneTitle: "أثرُك انغرس.",
    doneHint: "ارفع راسك على الجدار. لو تبي تكمل الأثر، تعال الركن وتعرّف علينا.",
    another: "أثر ثاني", back: "ارجع للجدار", viewAll: "جميع الآثار",
    allTitle: "جميع الآثار", allEmpty: "ما انغرس أثر للحين.",
    inspire: "إلهام",
    inspireLead: "أُلقيَت حصاةٌ صغيرة في ماءٍ ساكن…",
    inspireRest: "فاختفت، لكن الدوائر التي صنعَتها ظلّت تمتد. هكذا قد يكون أثرك؛ قد لا ترى إلى أين يصل، لكن هذا لا يعني أنه توقّف.",
  },
  en: {
    club: "Athar Club", fair: "Clubs Fair", planted: "impacts planted",
    question: "What impact do you want to leave?", writeMine: "Write yours",
    scan: "Scan and leave yours", langSwitch: "عربي",
    introTitle: ["Five seconds.", "One question.", "An impact that stays."],
    introBody: "The moment is on your phone — then it appears on the wall.",
    enter: "Enter the moment", think: "Think. Don't write yet.", skip: "Skip",
    writeTitle: "Write your impact in one line", writeHint: "More than four words will not appear fully on the wall",
    writePlaceholder: "I help someone believe they can", plant: "Plant it",
    planting: "Planting...", tooShort: "Write a short sentence.",
    saveFail: "Could not save your impact.", doneTitle: "Your impact is on the wall.",
    doneHint: "Look up. If you want to go further, come meet us at the booth.",
    another: "Another impact", back: "Back to the wall", viewAll: "All impacts",
    allTitle: "All impacts", allEmpty: "Nothing planted yet.",
    inspire: "Inspiration",
    inspireLead: "A small stone was cast into still water.",
    inspireRest: "It disappeared, but the ripples it created kept spreading. Your impact may be the same; you may never see how far it reaches, but that doesn’t mean it has stopped.",
  },
};
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
function orbit(id, age) {
  const angle = id * GOLDEN;
  const ring = Math.max(0.12, 0.58 - age * 0.033);
  const x = 0.5 + Math.cos(angle) * ring * 1.15;
  const y = 0.46 + Math.sin(angle) * ring * 0.82;
  const scale = Math.max(0.22, 1 - age * 0.055);
  const opacity = Math.max(0, 1 - age * 0.07);
  return { x, y, scale, opacity, visible: age < 14 && opacity > 0.08 };
}
function path() { return location.pathname.replace(/\/$/, "") || "/"; }
function go(p) {
  if (p === "/share" && path() !== "/share") {
    phase = "intro";
    draft = "";
    error = "";
    saved = "";
    showSkip = false;
    darkLeft = 5;
    clearTimeout(skipTimer);
    clearTimeout(darkTimer);
    clearInterval(tickTimer);
  }
  history.pushState({}, "", p);
  render();
}
window.addEventListener("popstate", render);
let lang = localStorage.getItem("athar-lang") === "en" ? "en" : "ar";
let data = { items: [], count: 0 };
let phase = "intro";
let draft = "";
let error = "";
let busy = false;
let saved = "";
let showSkip = false;
let skipTimer, darkTimer, tickTimer;
let darkLeft = 5;
function t() { return dict[lang]; }
function fmt(n) { return n.toLocaleString(lang === "ar" ? "ar-SA" : "en-US"); }
function applyDir() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  localStorage.setItem("athar-lang", lang);
}
function toggleLang() { lang = lang === "ar" ? "en" : "ar"; applyDir(); render(); }
function esc(s) {
  const map = { "&": "&" + "amp;", "<": "&" + "lt;", ">": "&" + "gt;", '"': "&" + "quot;" };
  return String(s).replace(/[&<>"]/g, (c) => map[c]);
}
async function load() {
  try {
    const res = await fetch("/api/impacts");
    data = await res.json();
  } catch (e) { /* keep */ }
}
async function plant() {
  const body = draft.replace(/\s+/g, " ").trim();
  if (body.length < 2) { error = t().tooShort; render(); return; }
  busy = true; error = ""; render();
  try {
    const res = await fetch("/api/impacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error("fail");
    const row = await res.json();
    saved = row.text;
    phase = "done";
    await load();
  } catch (e) { error = t().saveFail; }
  busy = false; render();
}
function startDark() {
  phase = "dark"; showSkip = false; darkLeft = 5; render();
  clearTimeout(skipTimer); clearTimeout(darkTimer); clearInterval(tickTimer);
  skipTimer = setTimeout(() => {
    showSkip = true;
    const slot = document.getElementById("skip-slot");
    if (!slot) return;
    const btn = document.createElement("button");
    btn.className = "btn ghost";
    btn.id = "skip";
    btn.style.marginTop = "2.5rem";
    btn.textContent = t().skip;
    btn.onclick = () => { clearTimeout(darkTimer); clearInterval(tickTimer); phase = "write"; render(); };
    slot.replaceWith(btn);
  }, 1800);
  tickTimer = setInterval(() => {
    darkLeft = Math.max(0, darkLeft - 1);
    const el = document.querySelector(".timer span");
    if (el) el.textContent = String(darkLeft);
  }, 1000);
  darkTimer = setTimeout(() => {
    clearInterval(tickTimer);
    phase = "write";
    render();
  }, 5000);
}
function render() {
  applyDir();
  const copy = t();
  const app = document.getElementById("app");
  const p = path();
  if (p === "/inspire") { app.innerHTML = inspireView(copy); bindNav(); return; }
  if (p === "/all") { app.innerHTML = allView(copy); bindNav(); return; }
  if (p === "/share") { app.innerHTML = shareView(copy); bindShare(); return; }
  app.innerHTML = wallView(copy);
  bindNav();
}
function bindNav() {
  document.querySelectorAll("[data-go]").forEach((el) => {
    el.onclick = (e) => { e.preventDefault(); go(el.getAttribute("data-go")); };
  });
  const langBtn = document.getElementById("lang");
  if (langBtn) langBtn.onclick = toggleLang;
}
function bindShare() {
  bindNav();
  const enter = document.getElementById("enter");
  if (enter) enter.onclick = startDark;
  const skip = document.getElementById("skip");
  if (skip) skip.onclick = () => { clearTimeout(darkTimer); clearInterval(tickTimer); phase = "write"; render(); };
  const ta = document.getElementById("draft");
  if (ta) ta.oninput = (e) => { draft = e.target.value; error = ""; };
  const plantBtn = document.getElementById("plant");
  if (plantBtn) plantBtn.onclick = plant;
  const another = document.getElementById("another");
  if (another) another.onclick = () => { draft = ""; saved = ""; showSkip = false; startDark(); };
}
function wallView(copy) {
  const share = location.origin + "/share";
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&bgcolor=e8e4db&color=08090b&data=" + encodeURIComponent(share);
  const words = data.items.map((item, i) => {
    const pos = orbit(item.id, i);
    if (!pos.visible) return "";
    const full = item.text.trim().split(/\s+/).length <= 4 ? " full" : "";
    return `<p class="orbit${full}" style="left:${(pos.x*100).toFixed(2)}%;top:${(pos.y*100).toFixed(2)}%;opacity:${pos.opacity};font-size:${(0.62+pos.scale*0.38).toFixed(2)}rem">${esc(item.text)}</p>`;
  }).join("");
  const rings = [0,1,2,3,4].map((i) => `<circle cx="50%" cy="46%" r="42%" style="animation-delay:${i*-1.8}s" />`).join("");
  return `<main class="page"><svg class="ripple" aria-hidden="true">${rings}</svg>${words}
    <header class="top"><img src="/logo-athar.svg" alt="أثر" width="68" height="68" style="width:4.25rem;height:4.25rem;object-fit:contain" />
    <div style="text-align:end"><button class="lang" id="lang">${copy.langSwitch}</button>
    <p class="muted" style="font-size:.9rem"><span style="color:var(--fg)">${fmt(data.count)}</span> ${esc(copy.planted)}</p>
    <a href="/all" data-go="/all" class="muted" style="font-size:.75rem;text-decoration:underline">${esc(copy.viewAll)}</a></div></header>
    <div class="center"><p class="hero">أثر</p><p class="muted" style="margin-top:1.25rem;max-width:24rem">${esc(copy.question)}</p></div>
    <div class="bottom"><figure class="qr"><img src="${qr}" alt="QR" width="96" height="96" /><span>${esc(copy.scan)}</span></figure>
    <div class="stack"><a class="btn line" href="/inspire" data-go="/inspire">${esc(copy.inspire)}</a>
    <a class="btn solid" href="/share" data-go="/share">${esc(copy.writeMine)}</a></div></div></main>`;
}
function inspireView(copy) {
  return `<main class="page"><header class="top"><button class="lang" id="lang">${copy.langSwitch}</button>
    <a href="/" data-go="/" class="muted">${esc(copy.back)}</a></header>
    <div class="center" style="pointer-events:auto;max-width:36rem;margin:0 auto">
    <p class="display" style="font-size:clamp(1.5rem,4vw,1.9rem);line-height:1.35">${esc(copy.inspireLead)}</p>
    <p class="muted" style="margin-top:1.5rem;font-size:1.15rem;line-height:1.7">${esc(copy.inspireRest)}</p></div></main>`;
}
function allView(copy) {
  const list = data.items.length
    ? `<ul class="list">${data.items.map((i) => `<li>${esc(i.text)}</li>`).join("")}</ul>`
    : `<p class="muted" style="padding:4rem 1.25rem">${esc(copy.allEmpty)}</p>`;
  return `<main class="page" style="overflow:auto"><header class="top" style="position:sticky;background:var(--bg);border-bottom:1px solid var(--border);padding:1rem 1.25rem">
    <div><p class="muted" style="font-size:.75rem">${esc(copy.club)}</p><h1 class="display" style="margin:.25rem 0 0;font-size:1.5rem">${esc(copy.allTitle)}</h1></div>
    <div><button class="lang" id="lang">${copy.langSwitch}</button><a href="/" data-go="/" class="muted">${esc(copy.back)}</a></div></header>
    <p class="muted" style="padding:1.25rem"><span style="color:var(--fg)">${fmt(data.count)}</span> ${esc(copy.planted)}</p>${list}</main>`;
}
function shareView(copy) {
  if (phase === "intro") {
    return `<main class="flow"><div style="display:flex;justify-content:space-between"><p class="muted" style="font-size:.75rem">${esc(copy.club)}</p><button class="lang" id="lang">${copy.langSwitch}</button></div>
      <div><h1 class="display" style="font-size:2.4rem;line-height:1.15">${esc(copy.introTitle[0])}<br>${esc(copy.introTitle[1])}<br>${esc(copy.introTitle[2])}</h1></div>
      <button class="btn solid wide" id="enter">${esc(copy.enter)}</button></main>`;
  }
  if (phase === "dark") {
    return `<main class="flow" style="justify-content:center;text-align:center;position:relative">
      <button class="lang" id="lang" style="position:absolute;top:2rem;inset-inline-end:1.25rem">${copy.langSwitch}</button>
      <div class="timer"><svg viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="45" fill="none" stroke="var(--border)" stroke-width="1.2"/>
        <circle class="ring-fill" cx="48" cy="48" r="45" fill="none" stroke="var(--fg)" stroke-width="1.4" stroke-linecap="round"/>
      </svg><span>${darkLeft}</span></div>
      <p class="display" style="font-size:2rem">${esc(copy.question)}</p>
      <p class="muted" style="margin-top:1rem">${esc(copy.think)}</p>
      ${showSkip ? `<button class="btn ghost" id="skip" style="margin-top:2.5rem">${esc(copy.skip)}</button>` : `<div id="skip-slot" style="height:3rem;margin-top:2.5rem"></div>`}</main>`;
  }
  if (phase === "write") {
    return `<main class="flow"><div><p class="muted" style="font-size:.75rem">${esc(copy.question)}</p>
      <h1 class="display" style="font-size:2rem">${esc(copy.writeTitle)}</h1></div>
      <div><textarea id="draft" maxlength="80" placeholder="${esc(copy.writePlaceholder)}">${esc(draft)}</textarea>
      <div class="muted" style="display:flex;justify-content:space-between;font-size:.75rem;margin-top:.5rem">
      <span>${esc(error || copy.writeHint)}</span><span>${draft.length}/80</span></div></div>
      <button class="btn solid wide" id="plant" ${busy ? "disabled" : ""}>${esc(busy ? copy.planting : copy.plant)}</button></main>`;
  }
  return `<main class="flow" style="text-align:center"><p class="muted" style="font-size:.75rem">${esc(copy.club)}</p>
    <div><p class="display" style="font-size:2.4rem">${esc(copy.doneTitle)}</p>
    <p class="display" style="font-size:1.6rem;margin-top:1.5rem">${esc(saved)}</p>
    <p class="muted" style="margin-top:1.25rem">${esc(copy.doneHint)}</p></div>
    <div class="stack"><button class="btn solid wide" id="another">${esc(copy.another)}</button>
    <a class="btn line wide" href="/" data-go="/">${esc(copy.back)}</a></div></main>`;
}
applyDir();
load().then(render);
setInterval(() => { if (path() === "/" || path() === "/all") load().then(render); }, 2500);
