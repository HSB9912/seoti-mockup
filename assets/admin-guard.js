/**
 * 관리자 페이지 비밀번호 게이트 (시안 단계)
 * - sessionStorage 기반 (탭 닫으면 다시 물어봄)
 * - 실제 보안 아님 — Supabase 인증 + RLS로 교체 예정
 *
 * 페이지 head에 추가:
 * <script src="assets/admin-guard.js"></script>
 */
(function () {
  'use strict';

  const PW = 'seoti';                  // 시안용 비밀번호 (변경 가능)
  const KEY = 'seoti_admin_auth_v1';   // sessionStorage key

  if (sessionStorage.getItem(KEY) === '1') return;

  // 인증 전엔 페이지 가림
  const hideStyle = document.createElement('style');
  hideStyle.id = 'admin-guard-hide';
  hideStyle.textContent = 'body{visibility:hidden!important}';
  document.documentElement.appendChild(hideStyle);

  function mount() {
    document.getElementById('admin-guard-hide')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'admin-guard';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(22,20,18,.94);' +
      'display:flex;align-items:center;justify-content:center;padding:24px;' +
      'font-family:Pretendard,-apple-system,sans-serif;backdrop-filter:blur(10px)';

    overlay.innerHTML = `
      <div style="background:#fff;padding:40px 44px;max-width:400px;width:100%;border-radius:10px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)">
        <div style="font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a06440;margin-bottom:10px">🔒 ADMIN ONLY</div>
        <h2 style="font-size:22px;font-weight:800;margin-bottom:8px;letter-spacing:-.015em">관리자 인증</h2>
        <p style="font-size:13px;color:#857f78;margin-bottom:24px;line-height:1.6">관리자 전용 페이지입니다.<br>비밀번호를 입력해주세요.</p>
        <input id="agpw" type="password" placeholder="비밀번호" autofocus
          style="width:100%;padding:14px 14px;font-size:14px;border:1.5px solid #ededeb;
                 border-radius:6px;outline:none;margin-bottom:6px;font-family:inherit;letter-spacing:.04em">
        <div id="agerr" style="color:#b03a3a;font-size:12px;margin-bottom:14px;min-height:16px;font-weight:600"></div>
        <button id="agok"
          style="width:100%;background:#161412;color:#fff;border:none;padding:15px;font-weight:800;
                 font-size:13.5px;letter-spacing:.06em;cursor:pointer;border-radius:6px;font-family:inherit;text-transform:uppercase">
          확인 · ENTER
        </button>
        <div style="margin-top:18px;padding-top:16px;border-top:1px solid #ededeb;font-size:11.5px;color:#bdb8b1;line-height:1.7">
          💡 <b style="color:#a06440">시안 단계 비밀번호: seoti</b><br>
          ※ Supabase 인증 + RLS로 교체 예정<br>
          탭 닫으면 다시 물어봅니다
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const pw = document.getElementById('agpw');
    const err = document.getElementById('agerr');
    const ok = document.getElementById('agok');

    function tryAuth() {
      const v = (pw.value || '').trim();
      if (v === PW) {
        sessionStorage.setItem(KEY, '1');
        overlay.remove();
      } else {
        err.textContent = '비밀번호가 일치하지 않습니다.';
        pw.value = '';
        pw.focus();
        pw.style.borderColor = '#b03a3a';
        setTimeout(() => { pw.style.borderColor = '#ededeb'; }, 1200);
      }
    }

    ok.addEventListener('click', tryAuth);
    pw.addEventListener('keydown', e => { if (e.key === 'Enter') tryAuth(); });
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
