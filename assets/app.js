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

  // ============ Supabase 설정 ============
  // anon key는 프론트엔드 노출 OK (RLS로 보호)
  const SUPABASE_URL = 'https://wzmtcomawebufylojffx.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bXRjb21hd2VidWZ5bG9qZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTg5MjcsImV4cCI6MjA5NTQzNDkyN30.6P0ZSLTU7XPudr9Ove2S0Nc5XO7pdb87LUVDdVJKmEM';

  let sb = null;
  let sbReady = null; // Promise

  function loadSupabaseLib() {
    if (window.supabase) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Supabase JS 로드 실패'));
      document.head.appendChild(s);
    });
  }

  async function ensureSupabase() {
    if (sb) return sb;
    if (!sbReady) {
      sbReady = (async () => {
        try {
          await loadSupabaseLib();
          sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: true, autoRefreshToken: true }
          });
          // 세션 복원
          const { data } = await sb.auth.getUser();
          if (data?.user) {
            state.user = {
              id: data.user.id,
              email: data.user.email,
              nickname: data.user.user_metadata?.nickname || data.user.email.split('@')[0],
              country: data.user.user_metadata?.country || 'KR'
            };
            commit();
          } else if (state.user && !state.user.id) {
            // 옛 mock 유저 정리
            state.user = null;
            commit();
          }
          // 인증 상태 변경 리스너
          sb.auth.onAuthStateChange((_evt, session) => {
            if (session?.user) {
              state.user = {
                id: session.user.id,
                email: session.user.email,
                nickname: session.user.user_metadata?.nickname || session.user.email.split('@')[0],
                country: session.user.user_metadata?.country || 'KR'
              };
              commit();
            } else {
              if (state.user) { state.user = null; commit(); }
            }
          });
          // site_content 테이블에서 사이트 콘텐츠 로드 (비동기, 실패해도 무시)
          loadContentFromSupabase().catch(e => console.warn('site_content 로드 실패:', e));
          return sb;
        } catch (e) {
          console.error('Supabase init 실패:', e);
          sbReady = null;
          throw e;
        }
      })();
    }
    return sbReady;
  }

  function translateAuthError(msg) {
    if (!msg) return '오류가 발생했어요';
    if (msg.includes('Invalid login credentials')) return '이메일·비밀번호가 맞지 않아요';
    if (msg.includes('Email not confirmed')) return '이메일 인증을 완료해주세요 (받은 메일 확인)';
    if (msg.includes('User already registered')) return '이미 가입된 이메일이에요';
    if (msg.includes('Password should be at least')) return '비밀번호는 6자 이상';
    if (msg.includes('rate limit')) return '요청이 너무 많아요 — 잠시 후 다시 시도';
    if (msg.includes('Invalid email')) return '이메일 형식이 올바르지 않아요';
    return msg;
  }

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

    // Supabase Auth 연동
    async login(email, password) {
      if (!email || !password) {
        toast('이메일과 비밀번호를 입력해주세요', 'error');
        return false;
      }
      try {
        const client = await ensureSupabase();
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          toast(translateAuthError(error.message), 'error');
          return false;
        }
        // onAuthStateChange 가 user 자동 반영
        return true;
      } catch (e) {
        toast('서버 연결 실패 — 다시 시도해주세요', 'error');
        console.error(e);
        return false;
      }
    },

    async signup(d) {
      if (!d.email || !d.password) {
        toast('이메일·비밀번호는 필수예요', 'error');
        return false;
      }
      if (d.password.length < 6) {
        toast('비밀번호는 6자 이상 (Supabase 기본 정책)', 'error');
        return false;
      }
      try {
        const client = await ensureSupabase();
        const { data, error } = await client.auth.signUp({
          email: d.email,
          password: d.password,
          options: {
            data: {
              nickname: d.nickname || d.email.split('@')[0],
              country: d.country || 'KR',
              phone: d.phone || null
            }
          }
        });
        if (error) {
          toast(translateAuthError(error.message), 'error');
          return false;
        }
        if (data.session) {
          // 자동 로그인된 경우 (이메일 인증 OFF)
          toast('가입 완료 🎀 환영합니다', 'success');
          return true;
        } else {
          // 이메일 인증 필요
          toast('가입 완료! 이메일 인증 후 로그인해주세요', 'info');
          return false;
        }
      } catch (e) {
        toast('서버 연결 실패 — 다시 시도해주세요', 'error');
        console.error(e);
        return false;
      }
    },

    async logout() {
      try {
        const client = await ensureSupabase();
        await client.auth.signOut();
      } catch (e) { console.error(e); }
      state.user = null;
      commit();
      toast('로그아웃 되었어요');
    },

    // OAuth — Google / Kakao 등 (Supabase에서 provider 활성화 필요)
    // provider 미활성화면 에러 페이지로 안 가고 토스트로 안내.
    async loginWithProvider(provider) {
      try {
        const client = await ensureSupabase();
        // skipBrowserRedirect: URL만 받아서 미리 체크
        const { data, error } = await client.auth.signInWithOAuth({
          provider,
          options: { redirectTo: location.href, skipBrowserRedirect: true }
        });
        if (error) {
          toast(translateAuthError(error.message) + ` (${provider})`, 'error');
          return false;
        }
        if (!data?.url) { toast('소셜 로그인 URL 생성 실패', 'error'); return false; }
        // probe — provider 비활성화 시 Supabase는 JSON 400 반환
        try {
          const r = await fetch(data.url, { method: 'GET', redirect: 'manual' });
          // 0 = opaqueredirect (정상 — 외부 OAuth로 리다이렉트 됨)
          // 400 = provider 비활성화
          if (r.status === 400) {
            const body = await r.json().catch(() => ({}));
            if ((body.msg || '').includes('not enabled')) {
              toast(`${provider} 로그인이 아직 활성화되지 않았어요`, 'warn');
              toast('Supabase → Auth → Providers 에서 켜야 작동해요', 'info');
              return false;
            }
            toast(body.msg || 'OAuth 설정 오류', 'error');
            return false;
          }
        } catch (e) { /* CORS로 막혀도 그냥 진행 — 정상 케이스 */ }
        // 정상 → 리다이렉트
        location.href = data.url;
        return true;
      } catch (e) {
        toast('소셜 로그인 실패', 'error');
        console.error(e);
        return false;
      }
    },

    // 관리자 권한 체크 (profiles.is_admin) — 항상 DB 재조회 (캐시 X)
    // 캐시하면 DB에서 승급한 뒤에도 false가 박혀서 어드민 진입 불가
    async isAdmin() {
      if (!state.user?.id) return false;
      try {
        const client = await ensureSupabase();
        const { data, error } = await client
          .from('profiles')
          .select('is_admin')
          .eq('id', state.user.id)
          .maybeSingle();
        if (error) return false;
        const v = !!(data && data.is_admin);
        state.user.isAdmin = v;
        commit();
        return v;
      } catch (e) { return false; }
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

  // 기본값은 비워둠 — 실제 값은 Supabase site_content 테이블에서 비동기 로드
  // (Supabase 도착 전엔 HTML 안의 placeholder 텍스트가 fallback으로 보임)
  const CONTENT_DEFAULTS = {
    'home.eyebrow.main': '',
    'home.eyebrow.sub':  '',
    'home.title.line1':  '',
    'home.title.line2':  '',
    'home.subtitle':     '',
    'home.stat1.label':  '',
    'home.stat1.value':  '',
    'home.stat2.label':  '',
    'home.stat2.value':  '',
    'home.stat3.label':  '',
    'home.stat3.value':  '',
    'contact.email':     '',
    'contact.instagram': '',
    'contact.twitter':   '',
    'footer.copyright':  ''
  };

  function loadContent() {
    try {
      return Object.assign({}, CONTENT_DEFAULTS, JSON.parse(localStorage.getItem(CONTENT_KEY)) || {});
    } catch (e) { return Object.assign({}, CONTENT_DEFAULTS); }
  }
  let siteContent = loadContent();

  const content = {
    get(key, fallback) {
      // 빈 문자열도 fallback 대상 — Supabase 도착 전 HTML placeholder 유지
      const v = siteContent[key];
      return (v === undefined || v === '') ? (fallback ?? '') : v;
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
    // 어드민용: localStorage + Supabase 양쪽에 저장 (관리자 RLS 통과 필요)
    async saveAll(obj) {
      this.setAll(obj);
      try {
        const client = await ensureSupabase();
        const rows = Object.entries(obj).map(([key, value]) => ({ key, value: value ?? '' }));
        const { error } = await client.from('site_content').upsert(rows, { onConflict: 'key' });
        if (error) throw error;
        return { ok: true };
      } catch (e) {
        console.error('site_content upsert 실패:', e);
        return { ok: false, error: e.message || String(e) };
      }
    },
    all() { return Object.assign({}, siteContent); },
    defaults() { return Object.assign({}, CONTENT_DEFAULTS); },
    reset() {
      localStorage.removeItem(CONTENT_KEY);
      siteContent = loadContent();
      window.dispatchEvent(new CustomEvent('seoti-content-change'));
    }
  };

  // Supabase site_content 테이블에서 콘텐츠 불러와서 메모리·DOM 반영
  async function loadContentFromSupabase() {
    if (!sb) return;
    const { data, error } = await sb.from('site_content').select('key,value');
    if (error || !Array.isArray(data)) return;
    const obj = {};
    data.forEach(row => { if (row.key) obj[row.key] = row.value ?? ''; });
    Object.assign(siteContent, obj);
    // localStorage 캐시도 갱신 (다음 페이지 로드 시 즉시 보임)
    try { localStorage.setItem(CONTENT_KEY, JSON.stringify(siteContent)); } catch(e){}
    window.dispatchEvent(new CustomEvent('seoti-content-change'));
  }

  // [data-content="key"] 요소를 자동으로 채워줌
  function applyContent() {
    document.querySelectorAll('[data-content]').forEach(el => {
      const key = el.dataset.content;
      // 첫 호출 시점의 textContent를 fallback 으로 보존 (이후 Supabase 도착 시 빈 값이면 placeholder 유지)
      if (!el.dataset.fallback) el.dataset.fallback = el.textContent;
      const v = content.get(key, el.dataset.fallback);
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
