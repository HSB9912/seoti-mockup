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
  display:flex;align-items:center;height:84px;gap:30px}
.seoti-logo{display:flex;align-items:center;gap:12px;font-size:21px;font-weight:900;
  letter-spacing:.04em;color:#161412;text-decoration:none;
  font-family:'Pretendard Variable',Pretendard,sans-serif;transition:.2s}
.seoti-logo:hover{transform:translateY(-1px)}
.seoti-logo:hover .mascot{transform:rotate(-6deg)}
.seoti-logo .mascot{width:62px;height:62px;display:grid;place-items:center;
  overflow:visible;flex:none;transition:.25s}
.seoti-logo .mascot img{width:100%;height:100%;object-fit:contain;
  filter:drop-shadow(0 3px 6px rgba(0,0,0,.08))}
.seoti-logo .mascot .fallback{font-size:34px}
/* sTTy 텍스트 이미지 로고 (assets/logo/stty.png) — 기본 표시 */
.seoti-logo .logo-img{height:48px;width:auto;display:block;
  filter:drop-shadow(0 2px 4px rgba(0,0,0,.06))}
/* fallback CSS 텍스트 로고 — 이미지 실패 시에만 표시 */
.seoti-logo .brand{display:none;align-items:center;gap:1px;letter-spacing:0}
.seoti-logo.no-img .logo-img{display:none}
.seoti-logo.no-img .brand{display:flex}
.seoti-logo .brand b{color:#f4a8cf;font-weight:900;font-size:30px;line-height:1}
.seoti-logo .brand .gray{color:#5a5550;font-size:24px;line-height:1}
.seoti-logo .brand sup{font-size:10px;color:#a8a3a0;font-weight:700;letter-spacing:.06em;margin-left:5px;align-self:flex-start;margin-top:2px}
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

/* 로그인/계정 영역 */
.seoti-acct{display:flex;align-items:center;gap:10px;margin-left:6px;padding-left:18px;border-left:1px solid #e7e4df}
.seoti-acct .login-btn{font-size:13px;font-weight:800;color:#161412;cursor:pointer;
  padding:8px 16px;border:1.5px solid #161412;border-radius:99px;letter-spacing:.02em;transition:.15s}
.seoti-acct .login-btn:hover{background:#161412;color:#fff}
.seoti-acct .admin-btn{display:none;align-items:center;gap:6px;
  background:#161412;color:#fff;padding:8px 15px;border-radius:99px;
  font-size:12.5px;font-weight:800;letter-spacing:.04em;cursor:pointer;transition:.15s}
.seoti-acct .admin-btn:hover{background:#e8503a;transform:translateY(-1px)}
.seoti-acct .admin-btn .dot{width:6px;height:6px;border-radius:50%;background:#7fd296}
.seoti-acct .user-btn{display:flex;align-items:center;gap:7px;cursor:pointer;
  font-size:13px;font-weight:700;color:#161412;padding:6px 10px;border-radius:99px;transition:.15s}
.seoti-acct .user-btn:hover{background:#f5f3ee}
.seoti-acct .user-btn .av{width:26px;height:26px;border-radius:50%;background:#161412;color:#fff;
  display:grid;place-items:center;font-size:12px;font-weight:800}
.seoti-acct .user-btn .chev{font-size:9px;color:#8c8781}
.seoti-acct .menu-pop{position:absolute;top:62px;right:0;background:#fff;border:1px solid #e7e4df;
  border-radius:10px;padding:6px;min-width:180px;box-shadow:0 14px 30px -14px rgba(0,0,0,.18);display:none;z-index:10000}
.seoti-acct .menu-pop.open{display:block}
.seoti-acct .menu-pop a{display:flex;align-items:center;gap:8px;padding:9px 12px;
  font-size:13px;font-weight:600;color:#161412;border-radius:6px;text-decoration:none}
.seoti-acct .menu-pop a:hover{background:#f5f3ee}
.seoti-acct .menu-pop a.adm{color:#e8503a;font-weight:800}
.seoti-acct .menu-pop hr{border:none;border-top:1px solid #f0ebe2;margin:4px 6px}
.seoti-acct-wrap{position:relative}

@media(max-width:760px){
  .seoti-acct{margin-left:0;padding-left:0;border-left:none;border-top:1px solid #f0ebe2;padding-top:10px;width:100%;justify-content:flex-start;flex-wrap:wrap}
}

@media(max-width:760px){
  .seoti-nav-wrap{padding:0 20px;height:68px}
  .seoti-logo{font-size:17px;gap:9px}
  .seoti-logo .mascot{width:46px;height:46px}
  .seoti-logo .logo-img{height:36px}
  .seoti-logo .brand b{font-size:22px}
  .seoti-logo .brand .gray{font-size:18px}
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

  // 로고: 마스코트 이미지 + sTTy 텍스트 로고 이미지
  // - assets/logo/mascot.png 있으면 이미지, 없으면 🐕 이모지 fallback
  // - assets/logo/stty.png 있으면 이미지 텍스트 로고, 없으면 CSS 텍스트 로고
  const navHTML = `
<nav class="seoti-nav" role="navigation">
  <div class="seoti-nav-wrap">
    <a class="seoti-logo" href="index.html" aria-label="STTY 홈">
      <span class="mascot">
        <img src="assets/logo/mascot.png" alt=""
          onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="fallback" style="display:none">🐕</span>
      </span>
      <img class="logo-img" src="assets/logo/stty.png" alt="sTTy"
        onerror="this.closest('.seoti-logo').classList.add('no-img');this.remove()">
      <span class="brand">
        <span class="gray">s</span><b>TT</b><span class="gray">y</span>
        <sup>STUDIO</sup>
      </span>
    </a>
    <button class="seoti-nav-mob" aria-label="menu" id="seoti-mob-btn">☰</button>
    <div class="seoti-nav-menu" id="seoti-menu">
      ${menuHTML}
      <div class="seoti-acct" id="seoti-acct">
        <a class="login-btn" id="seoti-login-btn" href="auth-b.html">로그인</a>
        <div class="seoti-acct-wrap" id="seoti-user-wrap" style="display:none">
          <a class="user-btn" id="seoti-user-btn">
            <span class="av" id="seoti-user-av">·</span>
            <span id="seoti-user-nick">·</span>
            <span class="chev">▾</span>
          </a>
          <div class="menu-pop" id="seoti-user-pop">
            <a href="mypage-b.html">👤 마이페이지</a>
            <a href="cart-checkout-b.html">🛒 장바구니</a>
            <a href="mypage-b.html">♡ 위시리스트</a>
            <a class="adm" id="seoti-admin-link" href="admin-c.html" style="display:none">⚙ 관리자 페이지</a>
            <hr>
            <a id="seoti-logout-link" style="cursor:pointer">↪ 로그아웃</a>
          </div>
        </div>
      </div>
    </div>
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

  // ---------- 로그인/계정 UI 동기화 ----------
  function syncAcct() {
    if (!window.SEOTI) return;
    const logged = SEOTI.api && SEOTI.api.isLoggedIn && SEOTI.api.isLoggedIn();
    const user   = SEOTI.state && SEOTI.state().user;
    const loginBtn = document.getElementById('seoti-login-btn');
    const userWrap = document.getElementById('seoti-user-wrap');
    if (!loginBtn || !userWrap) return;
    if (logged && user) {
      loginBtn.style.display = 'none';
      userWrap.style.display = 'block';
      const nick = user.nickname || (user.email || '').split('@')[0] || '회원';
      document.getElementById('seoti-user-nick').textContent = nick;
      document.getElementById('seoti-user-av').textContent = nick.charAt(0).toUpperCase();
      // 관리자 체크 (비동기)
      if (SEOTI.api.isAdmin) {
        SEOTI.api.isAdmin().then(isAdmin => {
          const link = document.getElementById('seoti-admin-link');
          if (link) link.style.display = isAdmin ? 'flex' : 'none';
        }).catch(()=>{});
      }
    } else {
      loginBtn.style.display = 'inline-block';
      userWrap.style.display = 'none';
    }
  }

  // SEOTI 로드 대기 (app.js 가 같은 페이지에 있다고 가정)
  function whenReady(cb) {
    if (window.SEOTI) return cb();
    let n = 0;
    const t = setInterval(() => {
      if (window.SEOTI) { clearInterval(t); cb(); }
      else if (++n > 50) clearInterval(t); // 5초 후 포기
    }, 100);
  }
  whenReady(() => {
    syncAcct();
    window.addEventListener('seoti-state-change', syncAcct);
  });

  // 사용자 드롭다운 토글
  document.addEventListener('click', e => {
    const userBtn = e.target.closest('#seoti-user-btn');
    const pop = document.getElementById('seoti-user-pop');
    if (userBtn && pop) {
      e.stopPropagation();
      pop.classList.toggle('open');
      return;
    }
    if (pop && !e.target.closest('#seoti-user-pop')) {
      pop.classList.remove('open');
    }
    if (e.target.closest('#seoti-logout-link')) {
      e.preventDefault();
      if (window.SEOTI && SEOTI.api && SEOTI.api.logout) SEOTI.api.logout();
    }
  });
})();
