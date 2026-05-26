/**
 * SEOTI 어드민 공용 사이드바
 * 모든 관리자 페이지에 같은 네비게이션을 주입.
 * 메뉴 바꾸려면 이 파일 하나만 수정하면 됨.
 */
(function () {
  'use strict';

  const sb = document.querySelector('aside.sb');
  if (!sb) return;

  const current = (location.pathname.split('/').pop() || '').toLowerCase();

  function item(label, icon, href, opts) {
    opts = opts || {};
    const isCurrent = (opts.match || href).toLowerCase() === current;
    const cls = 'item' + (isCurrent ? ' on' : '') + (opts.alert ? ' alert' : '');
    const badge = opts.badge
      ? `<span class="badge">${opts.badge}</span>`
      : '';
    return `<a class="${cls}" href="${href}" style="text-decoration:none">
      <span class="ico">${icon}</span><span style="flex:1">${label}</span>${badge}
    </a>`;
  }

  function gh(label, en) {
    return `<div class="gh" style="padding:8px 8px 4px;color:#878680;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-top:6px">
      ${label}${en ? `<i class="en" style="opacity:.45;margin-left:5px">${en}</i>` : ''}
    </div>`;
  }

  const html = `
    <div class="sb-h" style="padding:14px 14px 8px;display:flex;align-items:center;gap:8px">
      <div class="av" style="width:24px;height:24px;border-radius:5px;background:#a06440;color:#fff;display:grid;place-items:center;font-weight:800;font-size:11px">서</div>
      <b style="font-size:13.5px;font-weight:800">SEOTI</b>
      <small style="font-size:11px;color:#878680;margin-left:auto;font-weight:700">Admin</small>
    </div>
    <div style="margin:8px 10px 14px">
      <a href="index.html" style="display:block;padding:7px 10px;background:#fff;border:1px solid #ededeb;border-radius:5px;font-size:12px;font-weight:600;color:#878680;text-decoration:none;text-align:center">← 손님 사이트 보기</a>
    </div>
    <div class="sb-tree" style="flex:1;overflow-y:auto;padding:0 6px 12px">
      ${gh('운영', 'Operations')}
      ${item('대시보드', '▦', 'admin-c.html')}
      ${item('판매 실적', '📈', 'admin-c.html')}

      ${gh('상품·재고', 'Inventory')}
      ${item('상품 관리', '🏷', 'admin-c.html')}
      ${item('재고·입고 관리', '📦', 'admin-inventory.html', { badge: '3', alert: true })}

      ${gh('주문', 'Orders')}
      ${item('일반 주문', '🚚', 'admin-c.html')}
      ${item('Group Order', '📋', 'admin-c.html', { badge: '5' })}

      ${gh('고객', 'Customer')}
      ${item('Q&A 답변', '💬', 'admin-c.html', { badge: '8' })}
      ${item('회원·리뷰 관리', '⭐', 'admin-extensions.html')}

      ${gh('비즈니스', 'Business')}
      ${item('대시보드·정산', '📊', 'admin-business.html')}
      ${item('입점처·세금·관리비', '🧾', 'admin-business.html')}

      ${gh('사이트 콘텐츠', 'Site')}
      ${item('콘텐츠 편집 (CMS)', '📝', 'admin-content.html', { badge: 'CMS' })}
      ${item('공지·이벤트 관리', '📢', 'admin-extensions.html')}

      ${gh('출시 준비', 'Pre-Launch')}
      ${item('진행 로드맵', '🗺', 'admin-roadmap.html', { badge: '5/9' })}
      ${item('DB 연동 전 체크', '✅', 'admin-checklist.html', { badge: '42', alert: true })}
    </div>
    <div class="sb-bot" style="padding:10px 14px;border-top:1px solid #ededeb;display:flex;align-items:center;gap:8px;font-size:12.5px;color:#878680">
      <span style="width:18px;height:18px;background:#a06440;color:#fff;border-radius:3px;display:grid;place-items:center;font-size:10px;font-weight:800">서</span>
      <span><b style="color:#202020;font-weight:700">서티</b> · 관리자</span>
      <a id="adminLogout" style="margin-left:auto;cursor:pointer;font-size:11.5px;font-weight:600">잠그기</a>
    </div>
  `;

  sb.innerHTML = html;
  sb.style.display = 'flex';
  sb.style.flexDirection = 'column';

  document.getElementById('adminLogout')?.addEventListener('click', () => {
    sessionStorage.removeItem('seoti_admin_auth_v1');
    location.reload();
  });
})();
