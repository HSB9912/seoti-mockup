/**
 * SEOTI 공용 앱 코어
 * - 상태 관리 (localStorage)
 * - 인증 (mock — Supabase로 교체 예정)
 * - 장바구니·위시리스트
 * - 이미지 URL 헬퍼 (Cloudflare Images로 교체 예정)
 * - 토스트 알림
 *
 * Supabase 연동 시: api.xxx 함수 본문을 fetch/supabase 호출로 교체
 * Cloudflare Images 연동 시: SEOTI.img(...) 함수 본문을 CF delivery URL로 교체
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'seoti_v1';
  const EVT = 'seoti-state-change';

  // ============ STATE (localStorage) ============
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  let state = loadState();
  if (!state.cart)     state.cart = [];
  if (!state.wishlist) state.wishlist = [];
  if (!state.user)     state.user = null;
  if (!state.orders)   state.orders = [];

  function commit() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVT, { detail: state }));
  }

  // ============ TOAST ============
  function toast(msg, type) {
    type = type || 'info';
    let c = document.getElementById('seoti-toast');
    if (!c) {
      c = document.createElement('div');
      c.id = 'seoti-toast';
      c.style.cssText = 'position:fixed;top:78px;right:20px;z-index:99998;display:flex;flex-direction:column;gap:8px;pointer-events:none;font-family:Pretendard,-apple-system,sans-serif';
      document.body.appendChild(c);
    }
    const colors = { info: '#161412', error: '#b03a3a', success: '#3a8a6a', warn: '#b07a2a' };
    const icons  = { info: '·', error: '✕', success: '✓', warn: '⚠' };
    const el = document.createElement('div');
    el.style.cssText = `background:${colors[type] || colors.info};color:#fff;padding:11px 16px;border-radius:6px;font-size:13px;font-weight:600;box-shadow:0 8px 22px -10px rgba(0,0,0,.45);opacity:0;transform:translateY(-8px);transition:.22s;pointer-events:all;max-width:340px;display:flex;align-items:center;gap:9px`;
    el.innerHTML = `<span style="opacity:.7;font-weight:800">${icons[type] || icons.info}</span><span>${msg}</span>`;
    c.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 220);
    }, 2600);
  }

  // ============ IMAGE URL HELPER ============
  // Cloudflare R2 적용 — 미업로드 이미지는 기존 sosorowa로 자동 fallback (아래 핸들러)
  const R2_BASE = 'https://pub-6ba2dfe4988449599bacbbd4fb5c7443.r2.dev';
  const LEGACY_BASE = 'https://sosorowa.com/web/product/medium';

  function img(path, variant) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // R2 우선 — 없으면 fallback handler가 sosorowa로 대체
    return `${R2_BASE}/${path}.png`;
  }

  // R2에 아직 업로드 안 된 이미지는 자동으로 sosorowa로 폴백
  // (마이그레이션 기간용 — 이미지 모두 옮긴 뒤엔 이 블록 제거 가능)
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (el.tagName !== 'IMG') return;
    if (!el.src || !el.src.includes('r2.dev')) return;
    if (el.dataset.r2Fallback) return; // 무한 루프 방지
    el.dataset.r2Fallback = '1';
    el.src = el.src.replace(R2_BASE, LEGACY_BASE);
  }, true);

  // ============ API (mock — Supabase 자리) ============
  const api = {
    /* ---------- AUTH ---------- */
    isLoggedIn() { return !!state.user; },
    getUser() { return state.user; },

    // 시안용 mock 로그인: 이메일/비번 형식만 맞으면 OK
    // Supabase 교체 시: supabase.auth.signInWithPassword({email, password})
    async login(email, password) {
      await wait(300);
      if (!email || !password) {
        toast('이메일과 비밀번호를 입력해주세요', 'error');
        return false;
      }
      if (!email.includes('@')) {
        toast('이메일 형식이 올바르지 않아요', 'error');
        return false;
      }
      if (password.length < 4) {
        toast('비밀번호는 4자 이상', 'error');
        return false;
      }
      state.user = {
        email,
        nickname: email.split('@')[0],
        country: 'KR',
        joinedAt: new Date().toISOString()
      };
      commit();
      toast(`다시 만나서 반가워요, ${state.user.nickname}님`, 'success');
      return true;
    },

    async signup(data) {
      await wait(400);
      if (!data.email || !data.password) {
        toast('이메일·비밀번호는 필수예요', 'error');
        return false;
      }
      state.user = {
        email: data.email,
        nickname: data.nickname || data.email.split('@')[0],
        country: data.country || 'KR',
        phone: data.phone || null,  // 옵셔널 (해외 사용자 환영)
        joinedAt: new Date().toISOString()
      };
      commit();
      toast('서티 패밀리에 오신 걸 환영해요 🎀', 'success');
      return true;
    },

    logout() {
      state.user = null;
      commit();
      toast('로그아웃 되었어요');
    },

    // 페이지에서 사용: SEOTI.api.requireLogin() 호출 시 로그인 안 되어 있으면 auth-b로 보냄
    requireLogin(reason) {
      if (state.user) return true;
      sessionStorage.setItem('seoti_redirect_after_login', location.pathname);
      if (reason) sessionStorage.setItem('seoti_auth_reason', reason);
      location.href = 'auth-b.html';
      return false;
    },

    /* ---------- CART ---------- */
    getCart() { return state.cart; },
    cartCount() { return state.cart.reduce((s, c) => s + c.qty, 0); },
    cartTotal() { return state.cart.reduce((s, c) => s + c.price * c.qty, 0); },

    addToCart(item) {
      const key = `${item.id}::${item.option || ''}`;
      const ex = state.cart.find(c => `${c.id}::${c.option || ''}` === key);
      if (ex) ex.qty += (item.qty || 1);
      else state.cart.push({ ...item, qty: item.qty || 1 });
      commit();
      toast(`장바구니에 담겼어요 (총 ${api.cartCount()}개)`, 'success');
    },

    removeFromCart(id, option) {
      state.cart = state.cart.filter(c =>
        !(c.id === id && (c.option || '') === (option || ''))
      );
      commit();
    },

    updateCartQty(id, option, qty) {
      const it = state.cart.find(c =>
        c.id === id && (c.option || '') === (option || '')
      );
      if (!it) return;
      it.qty = Math.max(0, qty);
      if (it.qty === 0) api.removeFromCart(id, option);
      else commit();
    },

    clearCart() { state.cart = []; commit(); },

    /* ---------- WISHLIST ---------- */
    getWishlist() { return state.wishlist; },
    wishlistCount() { return state.wishlist.length; },
    isInWishlist(id) { return state.wishlist.some(w => w.id === id); },

    toggleWishlist(item) {
      const i = state.wishlist.findIndex(w => w.id === item.id);
      if (i >= 0) {
        state.wishlist.splice(i, 1);
        commit();
        toast('위시리스트에서 제거됨');
        return false;
      }
      state.wishlist.push(item);
      commit();
      toast('위시리스트에 담았어요 ♡', 'success');
      return true;
    },

    /* ---------- ORDERS (mock) ---------- */
    getOrders() { return state.orders; },
    placeOrder(payload) {
      const order = {
        id: 'SEOTI-' + new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 12) +
            '-' + Math.floor(Math.random() * 9000 + 1000),
        items: [...state.cart],
        total: api.cartTotal(),
        ...payload,
        createdAt: new Date().toISOString(),
        status: '결제확인 중'
      };
      state.orders.unshift(order);
      state.cart = [];
      commit();
      toast(`주문이 접수되었어요 · ${order.id}`, 'success');
      return order;
    }
  };

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ============ DOM HELPERS ============
  // [data-cart-count], [data-wishlist-count] 가진 요소를 자동 업데이트
  function refreshBadges() {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = api.cartCount();
    });
    document.querySelectorAll('[data-wishlist-count]').forEach(el => {
      el.textContent = api.wishlistCount();
    });
    document.querySelectorAll('[data-user-nick]').forEach(el => {
      el.textContent = state.user ? state.user.nickname : '게스트';
    });
    document.querySelectorAll('[data-user-email]').forEach(el => {
      el.textContent = state.user ? state.user.email : '';
    });
    // .require-login: 로그인 안 됐을 때 disabled 처리
    document.querySelectorAll('.require-login').forEach(el => {
      el.dataset.locked = api.isLoggedIn() ? '' : '1';
    });
  }

  window.addEventListener(EVT, refreshBadges);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshBadges);
  } else {
    refreshBadges();
  }

  // ============ SITE CONTENT (CMS — 노션처럼 직접 편집) ============
  // 작가가 어드민 페이지에서 텍스트·숫자 수정 → localStorage 저장 → 사이트에 즉시 반영
  // Supabase 연동 시: content를 'site_content' 테이블로 옮기면 됨
  const CONTENT_KEY = 'seoti_content_v1';

  // 기본값 (관리자가 수정하기 전엔 이게 보임)
  const CONTENT_DEFAULTS = {
    'home.eyebrow.main': 'SEOTI Studio',
    'home.eyebrow.sub':  '손그림 일러스트 아카이브',
    'home.title.line1':  '다정한 종이 위의',
    'home.title.line2':  '작은 풍경들.',
    'home.subtitle':     '2022년부터 손으로 그린 다꾸 일러스트·스티커·마스킹테이프를 기록하는 아카이브입니다.',
    'home.stat1.label':  '출시 컬렉션',
    'home.stat1.value':  '43',
    'home.stat2.label':  '활동 연차',
    'home.stat2.value':  '4년',
    'home.stat3.label':  '누적 판매',
    'home.stat3.value':  '12,000+',
    'contact.email':     'seoti.studio@gmail.com',
    'contact.instagram': '@seoti.studio',
    'contact.twitter':   '@seoti_studio',
    'footer.copyright':  '© 2026 SEOTI'
  };

  function loadContent() {
    try {
      return Object.assign({}, CONTENT_DEFAULTS, JSON.parse(localStorage.getItem(CONTENT_KEY)) || {});
    } catch (e) { return Object.assign({}, CONTENT_DEFAULTS); }
  }
  let siteContent = loadContent();

  const content = {
    get(key, fallback) {
      return siteContent[key] !== undefined ? siteContent[key] : (fallback ?? '');
    },
    set(key, value) {
      siteContent[key] = value;
      localStorage.setItem(CONTENT_KEY, JSON.stringify(siteContent));
      window.dispatchEvent(new CustomEvent('seoti-content-change'));
    },
    setAll(obj) {
      Object.assign(siteContent, obj);
      localStorage.setItem(CONTENT_KEY, JSON.stringify(siteContent));
      window.dispatchEvent(new CustomEvent('seoti-content-change'));
    },
    all() { return Object.assign({}, siteContent); },
    defaults() { return Object.assign({}, CONTENT_DEFAULTS); },
    reset() {
      localStorage.removeItem(CONTENT_KEY);
      siteContent = loadContent();
      window.dispatchEvent(new CustomEvent('seoti-content-change'));
    }
  };

  // [data-content="key"] 요소를 자동으로 채워줌
  function applyContent() {
    document.querySelectorAll('[data-content]').forEach(el => {
      const key = el.dataset.content;
      const v = content.get(key, el.textContent);
      el.textContent = v;
    });
  }
  window.addEventListener('seoti-content-change', applyContent);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyContent);
  } else {
    applyContent();
  }

  // ============ EXPOSE ============
  global.SEOTI = {
    api,
    img,
    toast,
    content,
    state: () => state,
    // 디버그용
    _reset() { localStorage.removeItem(STORAGE_KEY); location.reload(); }
  };
})(window);
