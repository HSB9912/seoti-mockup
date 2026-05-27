/**
 * 관리자 페이지 가드 — Supabase 인증 기반
 * - 로그인 안 됨 → auth-b.html 로 이동
 * - 로그인은 됐는데 profiles.is_admin = false → 거절 화면
 * - is_admin = true → 통과
 *
 * 페이지 head 에:
 *   <script src="assets/app.js"></script>
 *   <script src="assets/admin-guard.js"></script>
 */
(function () {
  'use strict';

  const KEY = 'seoti_admin_auth_v1';        // 임시 캐시 (5분)
  const TTL = 5 * 60 * 1000;

  // 캐시된 admin 통과 흔적이 살아있으면 즉시 통과 (페이지 깜빡임 방지)
  try {
    const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (c && c.ok && Date.now() - c.at < TTL) {
      // 백그라운드로 재확인만 하고 본문은 그대로 보여줌
      verifyInBackground();
      return;
    }
  } catch (e) {}

  // 인증 전엔 페이지 가림
  const hideStyle = document.createElement('style');
  hideStyle.id = 'admin-guard-hide';
  hideStyle.textContent = 'body{visibility:hidden!important}';
  document.documentElement.appendChild(hideStyle);

  // SEOTI 객체가 늦게 로드돼도 기다림
  function whenReady(cb) {
    if (window.SEOTI && window.SEOTI.api) return cb();
    let n = 0;
    const t = setInterval(() => {
      if (window.SEOTI && window.SEOTI.api) { clearInterval(t); cb(); }
      if (++n > 60) clearInterval(t); // 6초 후 포기
    }, 100);
  }

  function unhide() { document.getElementById('admin-guard-hide')?.remove(); }

  function showOverlay(html) {
    unhide();
    const ov = document.createElement('div');
    ov.id = 'admin-guard';
    ov.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(22,20,18,.94);' +
      'display:flex;align-items:center;justify-content:center;padding:24px;' +
      'font-family:Pretendard,-apple-system,sans-serif;backdrop-filter:blur(10px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
  }

  function denyLoggedOut() {
    showOverlay(`
      <div style="background:#fff;padding:40px 44px;max-width:420px;width:100%;border-radius:10px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5);text-align:center">
        <div style="font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a06440;margin-bottom:10px">🔒 ADMIN ONLY</div>
        <h2 style="font-size:22px;font-weight:800;margin-bottom:8px;letter-spacing:-.015em">관리자 로그인이 필요해요</h2>
        <p style="font-size:13px;color:#857f78;margin-bottom:24px;line-height:1.6">관리자 권한이 부여된 계정으로 로그인해주세요.</p>
        <a href="auth-b.html" style="display:block;background:#161412;color:#fff;padding:14px;font-weight:800;text-decoration:none;border-radius:6px;letter-spacing:.06em">로그인 페이지로 이동 →</a>
        <a href="index.html" style="display:block;margin-top:10px;color:#878680;font-size:12.5px;text-decoration:none;font-weight:600">← 손님 사이트로 돌아가기</a>
      </div>
    `);
  }

  function denyNotAdmin(email) {
    showOverlay(`
      <div style="background:#fff;padding:40px 44px;max-width:440px;width:100%;border-radius:10px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)">
        <div style="font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#b03a3a;margin-bottom:10px">⛔ 권한 없음</div>
        <h2 style="font-size:22px;font-weight:800;margin-bottom:8px;letter-spacing:-.015em">관리자 권한이 없는 계정</h2>
        <p style="font-size:13px;color:#857f78;margin-bottom:18px;line-height:1.65">
          현재 <b style="color:#202020">${email || '게스트'}</b> 로 로그인되어 있지만<br>
          이 페이지는 관리자만 접근할 수 있어요.
        </p>
        <div style="background:#f7f5f0;border:1px solid #ededeb;border-radius:6px;padding:12px 14px;margin-bottom:18px;font-size:11.5px;color:#857f78;line-height:1.65">
          💡 본인 계정인데 권한이 없다면 Supabase SQL Editor에서:<br>
          <code style="display:block;margin-top:4px;font-family:SF Mono,monospace;color:#a06440;font-size:11px;word-break:break-all">UPDATE profiles SET is_admin=true WHERE id = auth.uid();</code>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <a href="auth-b.html" id="agSwitch" style="background:#161412;color:#fff;padding:12px;font-weight:800;text-decoration:none;border-radius:6px;font-size:12.5px;letter-spacing:.05em;text-align:center;cursor:pointer">다른 계정으로</a>
          <a href="index.html" style="background:#fff;border:1px solid #ededeb;color:#202020;padding:12px;font-weight:800;text-decoration:none;border-radius:6px;font-size:12.5px;letter-spacing:.05em;text-align:center">손님 사이트</a>
        </div>
      </div>
    `);
    // 다른 계정으로 — 먼저 로그아웃 후 이동
    document.getElementById('agSwitch')?.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await SEOTI.api.logout(); } catch (err) {}
      sessionStorage.removeItem(KEY);
      location.href = 'auth-b.html';
    });
  }

  async function verifyInBackground() {
    whenReady(async () => {
      try {
        const ok = await SEOTI.api.isAdmin();
        if (!ok) {
          sessionStorage.removeItem(KEY);
          // 캐시로 들어왔는데 실제로는 관리자 아님 → 강제 표시
          denyNotAdmin(SEOTI.api.getUser()?.email);
        } else {
          sessionStorage.setItem(KEY, JSON.stringify({ ok: true, at: Date.now() }));
        }
      } catch (e) {}
    });
  }

  whenReady(async () => {
    try {
      // 로그인 안 됐으면 → 약간의 시간을 두고 (세션 복원 대기) 다시 확인
      if (!SEOTI.api.isLoggedIn()) {
        await new Promise(r => setTimeout(r, 700));
      }
      if (!SEOTI.api.isLoggedIn()) {
        denyLoggedOut();
        return;
      }
      const ok = await SEOTI.api.isAdmin();
      if (!ok) {
        denyNotAdmin(SEOTI.api.getUser()?.email);
        return;
      }
      // 통과
      sessionStorage.setItem(KEY, JSON.stringify({ ok: true, at: Date.now() }));
      unhide();
    } catch (e) {
      console.error('admin-guard 오류:', e);
      unhide();
      // 오류 시 잠그지 않음 (네트워크 문제로 전체 페이지가 막히면 곤란)
      // 그래도 경고는 띄움
      const w = document.createElement('div');
      w.style.cssText = 'position:fixed;top:12px;left:12px;background:#b03a3a;color:#fff;padding:10px 14px;border-radius:6px;font-size:12px;font-weight:700;z-index:99999;font-family:Pretendard,sans-serif;box-shadow:0 8px 20px -10px rgba(0,0,0,.4)';
      w.textContent = '⚠ 관리자 권한 확인 실패 — 네트워크 점검 필요';
      document.body.appendChild(w);
      setTimeout(() => w.remove(), 6000);
    }
  });
})();
