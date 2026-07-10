#!/usr/bin/env node
/**
 * 그거알아? 정적 페이지 생성기
 * 사용법: node build.js  →  dist/{slug}/index.html × 300 + sitemap.xml + robots.txt + 앱 본체
 * 데이터: 같은 폴더의 index.html에서 `var Q = [...]` 자동 추출
 */
const fs = require("fs");
const path = require("path");

/* ── 설정 ── */
const SITE = "https://youknow.onlyonecorpceo.workers.dev";
const GA_ID = "G-E2YDY5NVWQ";
const HUB = "https://main.onlyonecorpceo.workers.dev";
const EMAIL = "onlyonecorpceo@gmail.com";
const COUPANG_URL = "https://link.coupang.com/a/eTULiqezwO";
const AMAZON_URL = "https://www.amazon.com/s?k=general+knowledge+trivia+books&tag=onlyone0c-20";
const INDEX = path.join(__dirname, "index.html");

/* ── index.html에서 Q 추출 ── */
const src = fs.readFileSync(INDEX, "utf8");
const m = src.match(/var Q = (\[[\s\S]*?\n\]);/);
if (!m) { console.error("❌ index.html에서 Q 블록을 찾지 못했습니다."); process.exit(1); }
const Q = eval("(" + m[1] + ")");

/* ── 유틸 ── */
const CAT = { E: { ko: "동양", en: "East" }, W: { ko: "서양", en: "West" }, S: { ko: "과학·상식", en: "Science" } };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const used = new Set();
function slugify(en) {
  let s = en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (s.length > 60) s = s.slice(0, 60).replace(/-[^-]*$/, "");
  let base = s || "q", i = 2;
  while (used.has(s)) s = base + "-" + i++;
  used.add(s);
  return s;
}

function answerOf(q) {
  if (q.t === "ox") {
    return q.a === "O"
      ? { ko: "⭕ 맞아요, 사실입니다", en: "⭕ True" }
      : { ko: "❌ 아니에요, 사실이 아닙니다", en: "❌ False" };
  }
  return { ko: "✅ " + q.o.ko[q.a], en: "✅ " + q.o.en[q.a] };
}

/* ── 페이지 템플릿 ── */
function pageHtml(q, slug, bonus, related) {
  const cat = CAT[q.r];
  const ans = answerOf(q);
  const titleKo = `${q.q.ko} 정답과 이유`;
  const desc = `정답: ${ans.ko.replace(/^[⭕❌✅] /, "")}. ${q.e.ko} 그거알아? 300문제 상식 퀴즈로 연속 정답에 도전해보세요.`;

  const optsKo = q.t === "mc" ? `<ul class="opts">${q.o.ko.map((o, i) => `<li class="${i === q.a ? "ok" : ""}">${esc(o)}</li>`).join("")}</ul>` : "";
  const optsEn = q.t === "mc" ? `<ul class="opts">${q.o.en.map((o, i) => `<li class="${i === q.a ? "ok" : ""}">${esc(o)}</li>`).join("")}</ul>` : "";

  const bonusHtml = bonus.map(b => {
    const ba = answerOf(b.q);
    return `<div class="card">
      <div class="bq"><span data-ko>${esc(b.q.q.ko)}</span><span data-en class="hidden">${esc(b.q.q.en)}</span></div>
      <div class="ba"><span data-ko>${ba.ko} — ${esc(b.q.e.ko)}</span><span data-en class="hidden">${ba.en} — ${esc(b.q.e.en)}</span></div>
      <a class="more" href="/${b.slug}/"><span data-ko>자세히 →</span><span data-en class="hidden">More →</span></a>
    </div>`;
  }).join("");

  const relHtml = related.map(r =>
    `<a href="/${r.slug}/"><span data-ko>${esc(r.q.q.ko)}</span><span data-en class="hidden">${esc(r.q.q.en)}</span></a>`).join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titleKo)} | 그거알아?</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/${slug}/">
<meta property="og:title" content="${esc(titleKo)} | 그거알아?">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/${slug}/">
<meta property="og:type" content="article">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});</script>
<style>
:root{--ink:#1d1d1f;--muted:#6e6e73;--line:rgba(0,0,0,.10);--surface:#fff;--bg:#f5f5f7;--slate:#3d444b}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Pretendard,-apple-system,sans-serif;background:var(--bg);color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:640px;margin:0 auto;padding:24px 20px 60px}
header{display:flex;justify-content:space-between;align-items:center;padding:8px 0 32px}
.logo{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--ink);font-weight:700;font-size:15px}
.lang-btn{border:1px solid var(--line);background:var(--surface);border-radius:99px;padding:6px 14px;font-size:13px;cursor:pointer;color:var(--ink);font-family:inherit}
.crumb{font-size:13px;color:var(--muted);margin-bottom:10px}
h1{font-size:25px;font-weight:800;letter-spacing:-.02em;line-height:1.4;margin-bottom:20px}
.answer{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:22px;margin-bottom:24px}
.answer .a{font-size:20px;font-weight:800;margin-bottom:8px}
.answer .e{font-size:15px;color:var(--ink)}
.opts{list-style:none;margin:14px 0 0}
.opts li{padding:9px 14px;border:1px solid var(--line);border-radius:10px;margin-bottom:6px;font-size:14px;color:var(--muted)}
.opts li.ok{border-color:#2e7d32;color:#2e7d32;font-weight:700;background:rgba(46,125,50,.05)}
h2{font-size:19px;font-weight:700;margin:32px 0 12px;letter-spacing:-.01em}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-bottom:10px}
.card .bq{font-weight:700;font-size:15px;margin-bottom:6px}
.card .ba{font-size:14px;color:var(--muted);margin-bottom:8px}
.card .more{font-size:13px;text-decoration:none;color:var(--slate);font-weight:600}
.cta{display:block;text-align:center;background:var(--ink);color:#fff;text-decoration:none;border-radius:14px;padding:16px;font-weight:700;font-size:16px;margin:32px 0 10px;transition:opacity .15s}
.cta:hover{opacity:.85}
.cta-sub{text-align:center;font-size:13px;color:var(--muted)}
.book{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-top:28px;font-size:14px}
.book a{display:inline-block;margin-top:8px;border:1px solid var(--line);border-radius:99px;padding:7px 16px;font-size:13px;text-decoration:none;color:var(--ink);font-weight:600}
.rels{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.rels a{border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:10px 14px;font-size:14px;text-decoration:none;color:var(--ink)}
footer{margin-top:48px;padding-top:24px;border-top:1px solid var(--line);font-size:12px;color:#a1a1a6;text-align:center;line-height:2}
footer a{color:#a1a1a6}
.disc{font-size:11px;color:#b6b6bb;margin-top:8px}
.hidden{display:none}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <a class="logo" href="${HUB}" aria-label="OnlyOne">
      <svg width="20" height="26" viewBox="0 0 20 26" fill="none"><circle cx="10" cy="8" r="6.5" stroke="#3d444b" stroke-width="3"/><rect x="8.5" y="14" width="3" height="10" rx="1.5" fill="#3d444b"/></svg>
      OnlyOne
    </a>
    <button class="lang-btn" onclick="toggleLang()"><span data-ko>EN</span><span data-en class="hidden">한국어</span></button>
  </header>

  <article>
    <div class="crumb">💡 <span data-ko>그거알아? · ${cat.ko}</span><span data-en class="hidden">Did You Know? · ${cat.en}</span></div>
    <h1><span data-ko>${esc(q.q.ko)}</span><span data-en class="hidden">${esc(q.q.en)}</span></h1>

    <div class="answer">
      <div class="a"><span data-ko>${ans.ko}</span><span data-en class="hidden">${ans.en}</span></div>
      <div class="e"><span data-ko>${esc(q.e.ko)}</span><span data-en class="hidden">${esc(q.e.en)}</span></div>
      <span data-ko>${optsKo}</span><span data-en class="hidden">${optsEn}</span>
    </div>

    <h2><span data-ko>보너스 상식 2개</span><span data-en class="hidden">Two bonus facts</span></h2>
    ${bonusHtml}

    <a class="cta" href="${SITE}/?utm_source=seo&utm_medium=static&utm_campaign=quiz">
      <span data-ko>💡 300문제 연속 정답 도전하기</span><span data-en class="hidden">💡 Chase your streak — 300 questions</span>
    </a>
    <p class="cta-sub"><span data-ko>동양·서양·과학 상식 · 최고 기록 저장 · 친구에게 도전장</span><span data-en class="hidden">East · West · Science · best-streak saved · challenge a friend</span></p>

    <h2><span data-ko>이런 것도 알아?</span><span data-en class="hidden">Do you know these?</span></h2>
    <div class="rels">${relHtml}</div>

    <div class="book">
      <span data-ko>📚 상식을 더 쌓고 싶다면 상식 퀴즈 책도 추천해요.</span><span data-en class="hidden">📚 Want more? Trivia books are a great next step.</span><br>
      <a data-ko href="${COUPANG_URL}" target="_blank" rel="noopener sponsored">쿠팡에서 상식 책 보기</a>
      <a data-en class="hidden" href="${AMAZON_URL}" target="_blank" rel="noopener sponsored">Trivia books on Amazon</a>
    </div>
  </article>

  <footer>
    <a href="${HUB}">OnlyOne — For a Happy Day</a><br>
    Contact: <a href="mailto:${EMAIL}">${EMAIL}</a>
    <div class="disc"><span data-ko>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</span><span data-en class="hidden">As an Amazon Associate, OnlyOne earns from qualifying purchases.</span></div>
  </footer>
</div>

<div id="consent" style="display:none;position:fixed;bottom:16px;left:16px;right:16px;max-width:480px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;box-shadow:0 8px 30px rgba(0,0,0,.08);font-size:13px;z-index:99">
  <p style="margin-bottom:12px;font-size:13px"><span data-ko>방문 통계를 위해 Google Analytics 쿠키를 사용해도 될까요? 거부해도 그대로 이용할 수 있어요.</span><span data-en class="hidden">May we use Google Analytics cookies for visit stats? You can decline and still use everything.</span></p>
  <div style="display:flex;gap:8px;justify-content:flex-end">
    <button onclick="consent(false)" style="border:1px solid var(--line);background:#fff;border-radius:99px;padding:8px 16px;cursor:pointer;font-family:inherit;font-size:13px;color:var(--ink)"><span data-ko>거부</span><span data-en class="hidden">Decline</span></button>
    <button onclick="consent(true)" style="border:none;background:var(--ink);color:#fff;border-radius:99px;padding:8px 18px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600"><span data-ko>동의</span><span data-en class="hidden">Accept</span></button>
  </div>
</div>

<script>
function applyLang(l){
  document.querySelectorAll('[data-ko]').forEach(e=>e.classList.toggle('hidden',l==='en'));
  document.querySelectorAll('[data-en]').forEach(e=>e.classList.toggle('hidden',l!=='en'));
  document.documentElement.lang=l==='en'?'en':'ko';
}
function toggleLang(){
  const l=(localStorage.getItem('oo_lang')==='en')?'ko':'en';
  localStorage.setItem('oo_lang',l);applyLang(l);
}
applyLang(localStorage.getItem('oo_lang')||(/^ko/.test(navigator.language||'')?'ko':'en'));

const EEA=['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];
function grant(){gtag('consent','update',{analytics_storage:'granted'})}
function consent(ok){
  localStorage.setItem('oo_consent',ok?'granted':'denied');
  if(ok)grant();
  document.getElementById('consent').style.display='none';
}
(function(){
  const saved=localStorage.getItem('oo_consent');
  if(saved==='granted'){grant();return}
  if(saved==='denied')return;
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
  const isEU=/Europe\\//.test(tz)||EEA.includes((navigator.language.split('-')[1]||'').toUpperCase());
  if(isEU){document.getElementById('consent').style.display='block'}
  else{localStorage.setItem('oo_consent','granted');grant()}
})();
</script>
</body>
</html>`;
}

/* ── 빌드 ── */
const DIST = path.join(__dirname, "dist");
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const items = Q.map(q => ({ q, slug: slugify(q.q.en) }));
const urls = [];
items.forEach((it, i) => {
  const bonus = [items[(i + 1) % items.length], items[(i + 2) % items.length]];
  const related = Array.from({ length: 8 }, (_, k) => items[(i + k + 3) % items.length]);
  const dir = path.join(DIST, it.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), pageHtml(it.q, it.slug, bonus, related));
  urls.push(`${SITE}/${it.slug}/`);
});

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[SITE + "/", ...urls].map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>`);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.copyFileSync(INDEX, path.join(DIST, "index.html"));

console.log(`✅ ${items.length}개 페이지 + sitemap.xml + robots.txt + 앱 본체 → dist/`);
