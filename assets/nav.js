// SEOTI 공통 nav — 모든 페이지에 동일하게 적용
// 변경하려면 이 파일 한 곳만 수정하면 됩니다
(function () {
  // ---------- CSS 주입 (페이지 색상 변수와 무관하게 하드코드) ----------
  const css = `
.seoti-nav{position:sticky;top:0;left:0;right:0;z-index:9999;
  background:rgba(255,255,255,.96);backdrop-filter:blur(10px);
  border-bottom:1px solid #e7e4df;
  font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif}
.seoti-nav *{box-sizing:border-box}
.seoti-nav-wrap{max-width:1240px;margin:0 auto;padding:0 32px;
  display:flex;align-items:center;height:62px;gap:30px}
.seoti-logo{display:flex;align-items:center;gap:9px;font-size:21px;font-weight:900;
  letter-spacing:.04em;color:#161412;text-decoration:none;
  font-family:'Pretendard Variable',Pretendard,sans-serif}
.seoti-logo:hover{color:#e8503a}
.seoti-logo .mascot{width:34px;height:34px;border-radius:50%;background:#fef5e7;
  display:grid;place-items:center;overflow:hidden;flex:none}
.seoti-logo .mascot img{width:100%;height:100%;object-fit:cover}
.seoti-logo .mascot .fallback{font-size:18px}
.seoti-logo .brand{display:flex;align-items:center;gap:1px;letter-spacing:0}
.seoti-logo .brand b{color:#f4a8cf;font-weight:900;font-size:24px;line-height:1}
.seoti-logo .brand .gray{color:#5a5550;font-size:18px;line-height:1}
.seoti-logo .brand sup{font-size:9px;color:#a8a3a0;font-weight:700;letter-spacing:.05em;margin-left:3px}
.seoti-nav-menu{display:flex;gap:26px;margin-left:auto;
  font-size:13.5px;font-weight:600;align-items:center}
.seoti-nav-menu a{color:#8c8781;transition:color .15s;
  text-decoration:none;cursor:pointer;padding:6px 0}
.seoti-nav-menu a:hover{color:#161412}
.seoti-nav-menu a.on{color:#161412;position:relative}
.seoti-nav-menu a.on::before{content:"·";color:#e8503a;
  margin-right:5px;font-weight:800}
.seoti-nav-mob{display:none;background:none;border:none;cursor:pointer;
  margin-left:auto;font-size:22px;color:#161412;padding:6px 8px}
@media(max-width:760px){
  .seoti-nav-wrap{padding:0 20px;height:56px}
  .seoti-logo{font-size:17px}
  .seoti-nav-menu{position:absolute;top:56px;left:0;right:0;
    background:#fff;border-bottom:1px solid #e7e4df;
    flex-direction:column;gap:0;padding:8px 20px 14px;display:none;
    box-shadow:0 14px 30px -14px rgba(0,0,0,.18)}
  .seoti-nav-menu.open{display:flex}
  .seoti-nav-menu a{padding:11px 0;width:100%;border-bottom:1px solid #f0ebe2;font-size:14px}
  .seoti-nav-menu a:last-child{border-bottom:none}
  .seoti-nav-mob{display:block}
}
`.trim();
  const styleEl = document.createElement('style');
  styleEl.id = 'seoti-nav-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- 메뉴 구성 ----------
  const links = [
    { href: 'notice-b.html',              label: 'Notice',      page: 'notice' },
    { href: 'mockup-b-minimal.html',      label: 'Collection',  page: 'collection' },
    { href: 'archive.html',               label: 'Archive',     page: 'archive' },
    { href: 'customer-bulk-order-c.html', label: 'Group Order', page: 'group' },
    { href: 'customer-qna-b.html',        label: 'QnA',         page: 'qna' },
    { href: 'contact.html',               label: 'Contact',     page: 'contact' }
  ];
  const current = (document.body && document.body.dataset.page) || '';
  const menuHTML = links
    .map(l => `<a href="${l.href}"${l.page === current ? ' class="on"' : ''}>${l.label}</a>`)
    .join('');

  // 로고: 마스코트 이미지 + STTY 텍스트
  // assets/logo/mascot.png 있으면 이미지, 없으면 이모지 fallback
  const navHTML = `
<nav class="seoti-nav" role="navigation">
  <div class="seoti-nav-wrap">
    <a class="seoti-logo" href="index.html">
      <span class="mascot">
        <img src="assets/logo/mascot.png" alt="STTY"
          onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="fallback" style="display:none">🐕</span>
      </span>
      <span class="brand">
        <span class="gray">s</span><b>TT</b><span class="gray">y</span>
        <sup>STUDIO</sup>
      </span>
    </a>
    <button class="seoti-nav-mob" aria-label="menu" id="seoti-mob-btn">☰</button>
    <div class="seoti-nav-menu" id="seoti-menu">${menuHTML}</div>
  </div>
</nav>`.trim();

  // ---------- 삽입 ----------
  // 1) <div id="seoti-nav"></div> 가 있으면 거기에 넣음
  // 2) 없으면 body 최상단에 삽입
  const placeholder = document.getElementById('seoti-nav');
  if (placeholder) {
    placeholder.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  // ---------- 모바일 토글 ----------
  document.addEventListener('click', e => {
    const btn = e.target.closest('#seoti-mob-btn');
    const menu = document.getElementById('seoti-menu');
    if (btn && menu) {
      menu.classList.toggle('open');
      return;
    }
    if (menu && menu.classList.contains('open') &&
        !e.target.closest('#seoti-menu') &&
        !e.target.closest('#seoti-mob-btn')) {
      menu.classList.remove('open');
    }
  });
})();
