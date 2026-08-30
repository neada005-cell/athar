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
    doneHint: "لو تريد أن تصنع أثراً أكبر أنضم معنا",
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
    doneHint: "If you want to leave a greater impact, join us",
    another: "Another impact", back: "Back to the wall", viewAll: "All impacts",
    allTitle: "All impacts", allEmpty: "Nothing planted yet.",
    inspire: "Inspiration",
    inspireLead: "A small stone was cast into still water.",
    inspireRest: "It disappeared, but the ripples it created kept spreading. Your impact may be the same; you may never see how far it reaches, but that doesn’t mean it has stopped.",
  },
};
function polar(deg, rx, ry) {
  const a = (deg * Math.PI) / 180;
  return { x: 0.5 + Math.cos(a) * rx, y: 0.51 + Math.sin(a) * ry, visible: true };
}
const SLOTS = [-90, -45, 0, 45, 90, 135, 180, 225].map((d) => polar(d, 0.33, 0.22));
function hashId(id) {
  let x = Number(id) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}
function layout(items) {
  const used = new Set();
  return items.map((item, age) => {
    if (age >= SLOTS.length) return { x: 0.5, y: 0.51, visible: false };
    if (item.slot != null && item.slot >= 0 && item.slot < SLOTS.length && !used.has(item.slot)) {
      used.add(item.slot);
      return SLOTS[item.slot];
    }
    const start = hashId(item.id) % SLOTS.length;
    let idx = start;
    for (let n = 0; n < SLOTS.length; n++) {
      idx = (start + n) % SLOTS.length;
      if (!used.has(idx)) break;
    }
    used.add(idx);
    return SLOTS[idx];
  });
}
function path() { return location.pathname.replace(/\/$/, "") || "/"; }
function go(p) {
  if (p === "/share" && path() !== "/share") {
    phase = "intro"; draft = ""; error = ""; saved = ""; showSkip = false; darkLeft = 5;
    clearTimeout(skipTimer); clearTimeout(darkTimer); clearInterval(tickTimer);
  }
  history.pushState({}, "", p); render();
}
window.addEventListener("popstate", render);
let lang = localStorage.getItem("athar-lang") === "en" ? "en" : "ar";
let data = { items: [], count: 0 };
let phase = "intro"; let draft = ""; let error = ""; let busy = false; let saved = ""; let showSkip = false;
let skipTimer, darkTimer, tickTimer; let darkLeft = 5;
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
function recalled() {
  try { return JSON.parse(localStorage.getItem("athar-wall") || "null"); }
  catch { return null; }
}
function remember(items, count) {
  try { localStorage.setItem("athar-wall", JSON.stringify({ items: items.slice(0, 200), count })); }
  catch (e) { /* quota */ }
}
async function load() {
  const local = recalled();
  if (local && local.items && local.items.length && !data.items.length) {
    data = { items: local.items, count: local.count || local.items.length };
  }
  try {
    const res = await fetch("/api/impacts", { cache: "no-store" });
    const raw = await res.json();
    const serverItems = (raw.items || []).map((it, i) => ({
      id: Number(it.id) || i + 1,
      text: it.text || it.body || "",
      slot: it.slot,
    }));
    const map = new Map();
    for (const it of (local && local.items) || []) map.set(Number(it.id), it);
    for (const it of data.items) map.set(Number(it.id), it);
    for (const it of serverItems) map.set(Number(it.id), it);
    const items = [...map.values()].sort((a, b) => Number(b.id) - Number(a.id));
    const count = Math.max(Number(raw.count) || 0, items.length);
    data = { items, count };
    remember(items, count);
  } catch (e) {
    if (local && local.items && local.items.length) {
      data = { items: local.items, count: local.count || local.items.length };
    }
  }
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
    saved = row.text || row.body || body;
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
    btn.className = "btn ghost"; btn.id = "skip"; btn.style.marginTop = "2.5rem";
    btn.textContent = t().skip;
    btn.onclick = () => { clearTimeout(darkTimer); clearInterval(tickTimer); phase = "write"; render(); };
    slot.replaceWith(btn);
  }, 1800);
  tickTimer = setInterval(() => {
    darkLeft = Math.max(0, darkLeft - 1);
    const el = document.querySelector(".timer span");
    if (el) el.textContent = String(darkLeft);
  }, 1000);
  darkTimer = setTimeout(() => { clearInterval(tickTimer); phase = "write"; render(); }, 5000);
}
function render() {
  applyDir();
  const copy = t();
  const app = document.getElementById("app");
  const p = path();
  if (p === "/inspire") { app.innerHTML = inspireView(copy); bindNav(); return; }
  if (p === "/all") { app.innerHTML = allView(copy); bindNav(); return; }
  if (p === "/share") { app.innerHTML = shareView(copy); bindShare(); return; }
  if (app.querySelector(".ripple")) { patchWall(copy); return; }
  app.innerHTML = wallView(copy);
  bindNav();
}
function wordHtml() {
  const places = layout(data.items);
  return data.items.map((item, i) => {
    const pos = places[i];
    if (!pos.visible) return "";
    const full = (item.text || "").trim().split(/\s+/).length <= 4 ? " full" : "";
    return `<p class="orbit${full}" data-id="${item.id}" style="left:${(pos.x*100).toFixed(2)}%;top:${(pos.y*100).toFixed(2)}%;font-size:1.05rem;transform:translate(-50%,-50%)">${esc(item.text || "")}</p>`;
  }).join("");
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function patchOrbits() {
  const layer = document.getElementById("orbits");
  if (!layer) return;
  const places = layout(data.items);
  const seen = new Set();
  data.items.forEach((item, i) => {
    const pos = places[i];
    const key = String(item.id);
    seen.add(key);
    if (!pos.visible) {
      const gone = layer.querySelector('[data-id="' + key + '"]');
      if (gone) gone.remove();
      return;
    }
    if (layer.querySelector('[data-id="' + key + '"]')) return;
    const full = (item.text || "").trim().split(/\s+/).length <= 4 ? " full" : "";
    const el = document.createElement("p");
    el.className = "orbit" + full;
    el.dataset.id = key;
    el.textContent = item.text || "";
    el.style.left = (pos.x * 100).toFixed(2) + "%";
    el.style.top = (pos.y * 100).toFixed(2) + "%";
    el.style.opacity = "0";
    el.style.fontSize = "1.05rem";
    el.style.transform = "translate(-50%,-50%)";
    layer.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = "1"; });
  });
  [...layer.children].forEach((el) => {
    if (!seen.has(el.getAttribute("data-id"))) el.remove();
  });
}
function patchWall(copy) {
  patchOrbits();
  setText("count", fmt(data.count));
  setText("lang", copy.langSwitch);
  setText("planted-label", copy.planted);
  setText("view-all", copy.viewAll);
  setText("question", copy.question);
  setText("scan", copy.scan);
  setText("inspire-btn", copy.inspire);
  setText("write-btn", copy.writeMine);
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
  const rings = [0,1,2,3,4,5,6].map((i) => `<circle cx="50%" cy="51%" r="42%" style="animation-delay:${i*-1.4}s" />`).join("");
  return `<main class="page"><svg class="ripple" aria-hidden="true">${rings}</svg><div id="orbits">${wordHtml()}</div>
    <header class="top"><img src="/logo-athar.svg" alt="أثر" width="68" height="68" style="width:4.25rem;height:4.25rem;object-fit:contain" />
    <div style="text-align:end"><button class="lang" id="lang">${copy.langSwitch}</button>
    <p class="muted" style="font-size:.9rem"><span id="count" style="color:var(--fg)">${fmt(data.count)}</span> <span id="planted-label">${esc(copy.planted)}</span></p>
    <a href="/all" data-go="/all" class="muted" id="view-all" style="font-size:.75rem;text-decoration:underline">${esc(copy.viewAll)}</a></div></header>
    <p class="ask" id="question">${esc(copy.question)}</p>
    <div class="center"><p class="hero">أثر</p></div>
    <div class="bottom"><figure class="qr"><img src="${qr}" alt="QR" width="96" height="96" /><span id="scan">${esc(copy.scan)}</span></figure>
    <div class="stack"><a class="btn line" href="/inspire" data-go="/inspire" id="inspire-btn">${esc(copy.inspire)}</a>
    <a class="btn solid" href="/share" data-go="/share" id="write-btn">${esc(copy.writeMine)}</a></div></div></main>`;
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
    <div>
      <p class="display" style="font-size:clamp(2.2rem,8vw,2.8rem);line-height:1.2">${esc(copy.doneTitle)}</p>
      <p class="display" style="font-size:1.5rem;margin-top:1.75rem;line-height:1.4">${esc(saved)}</p>
      <p class="muted" style="margin-top:1.25rem;font-size:.9rem">${esc(copy.doneHint)}</p>
    </div>
    <div class="actions"><button class="btn solid wide" id="another">${esc(copy.another)}</button>
    <a class="btn line wide" href="/" data-go="/">${esc(copy.back)}</a></div></main>`;
}
applyDir();
load().then(render);
setInterval(() => { if (path() === "/" || path() === "/all") load().then(render); }, 2500);
