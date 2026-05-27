# STTY Studio 운영 가이드

집·외부 어디서든 같은 작업 흐름이 되도록 정리한 문서.

---

## 0. 한 줄 요약

- **로컬 폴더**: `C:\Users\ADMIN\seoti-mockup`
- **GitHub**: https://github.com/3eotty-afk/seoti-mockup
- **사이트**: https://3eotty-afk.github.io/seoti-mockup/
- **Supabase**: https://supabase.com/dashboard/project/wzmtcomawebufylojffx
- **이미지(R2)**: https://pub-6ba2dfe4988449599bacbbd4fb5c7443.r2.dev

---

## 1. 처음 한 번만 — 설정

### 1-1. SQL 실행 (완료 시 건너뜀)

Supabase 대시보드 → SQL Editor → New query → 아래 파일 전체 붙여넣고 ▶ Run

```
supabase-setup.sql
```

결과창에 `Setup complete ✓ · total_tables = 10` 보이면 OK.

### 1-2. 본인 계정 관리자 지정

사이트에서 회원가입(`auth-b.html`)한 다음 SQL Editor에서:

```sql
UPDATE public.profiles SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'hongsb9912@gmail.com');
```

### 1-3. (선택) 소셜 로그인 활성화

Supabase 대시보드 → **Authentication → Providers**

각 provider 옆 토글 켜고 클라이언트 ID/Secret 입력:

- **Google**: Google Cloud Console → OAuth client 만들기 → Redirect URI = `https://wzmtcomawebufylojffx.supabase.co/auth/v1/callback`
- **Kakao**: Kakao Developers → 내 애플리케이션 → 카카오 로그인 활성화 → Redirect URI 동일
- **GitHub**: github.com/settings/developers → New OAuth App → 동일

활성화 안 해도 이메일 로그인은 잘 됩니다.

---

## 2. 매일 작업 흐름

### 사이트에서 → 요청 게시판 (가장 자주)

1. `admin-c.html` → 로그인 → 좌측 메뉴 **📮 요청 게시판** 클릭
2. 새 요청 폼에 버그·아이디어 작성 → 등록
3. 다른 장소(집/PC방)에서 같은 계정 로그인하면 같은 목록 보임

### 코드를 직접 고쳐야 할 때 — 로컬

```powershell
# 1. 변경사항 확인
cd C:\Users\ADMIN\seoti-mockup
git status

# 2. 커밋 + 푸시 (사이트 자동 갱신, 1~2분)
git add -A
git commit -m "어떤 변경인지"
git push
```

### 외부 PC에서 시작할 때

```powershell
# 처음
git clone https://github.com/3eotty-afk/seoti-mockup.git
cd seoti-mockup

# 이후
git pull
```

---

## 3. 파일 구조 — 어디 뭐가 있는지

```
seoti-mockup/
├── index.html              ← 메인
├── notice-b.html           ← 공지
├── mockup-b-minimal.html   ← Collection (확정 시안)
├── archive.html            ← Archive
├── customer-bulk-order-c.html  ← Group Order
├── customer-qna-b.html     ← QnA
├── contact.html            ← Contact
├── product-detail-a.html   ← 상품 상세
├── cart-checkout-a.html    ← 장바구니/결제
├── mypage-b.html           ← 마이페이지
├── auth-b.html             ← 로그인/가입
│
├── admin-c.html            ← 어드민 대시보드
├── admin-feedback.html     ← 📮 요청 게시판 (NEW)
├── admin-content.html      ← 사이트 텍스트 편집 (CMS)
├── admin-inventory.html    ← 재고
├── admin-business.html     ← 정산
├── admin-checklist.html    ← DB연동 전 체크
├── admin-roadmap.html      ← 로드맵
├── admin-extensions.html   ← 회원·공지·리뷰
│
├── supabase-setup.sql      ← DB 초기 설정 (한 번만)
├── GUIDE.md                ← 이 파일
│
└── assets/
    ├── app.js              ← 공통 코어 (인증·장바구니·이미지·CMS)
    ├── nav.js              ← 손님 사이트 상단 메뉴
    ├── admin-nav.js        ← 관리자 사이드바
    ├── admin-guard.js      ← 관리자 권한 게이트
    └── logo/
        ├── mascot.png      ← 천사 치와와 (로고)
        └── stty.png        ← sTTy 텍스트 로고
```

---

## 4. 자주 쓰는 SQL 한 줄

Supabase SQL Editor에서 New query → 붙여넣기 → Run.

```sql
-- 관리자 추가 (이메일 기준)
UPDATE public.profiles SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = '추가할이메일@example.com');

-- 관리자 해제
UPDATE public.profiles SET is_admin = false
WHERE id = (SELECT id FROM auth.users WHERE email = '해제할이메일@example.com');

-- 회원 목록 보기
SELECT email, nickname, country, is_admin, created_at
FROM auth.users u JOIN public.profiles p ON u.id = p.id
ORDER BY created_at DESC;

-- 요청 게시판 통계
SELECT status, count(*) FROM public.feedback GROUP BY status;

-- 사이트 텍스트 한 줄 바꾸기 (어드민 CMS가 더 편함)
UPDATE public.site_content SET value = '새 내용' WHERE key = 'home.title.line1';
```

---

## 5. 로고 이미지 교체

`assets/logo/` 폴더에 두 파일을 넣으면 자동 적용:

- `mascot.png` — 천사 치와와 (200×200 ~ 500×500 PNG, 투명 배경 권장)
- `stty.png` — sTTy 텍스트 로고 (높이 100px 정도, 가로형 PNG)

저장 후 `git add assets/logo/*.png && git commit -m "logo" && git push`

이미지가 없으면 자동으로 fallback (이모지 + CSS 텍스트) 표시.

---

## 6. 문제 해결

| 증상 | 확인할 곳 |
| --- | --- |
| 어드민 들어가니 "권한 없음" | SQL Editor에서 `is_admin = true` 부여했는지 |
| 로그인이 안 됨 | Supabase → Authentication → Users에 계정 있는지 |
| 이미지가 깨짐 | R2.dev 도메인이 살아있는지 (Cloudflare 무료티어 한도) |
| 요청 게시판 저장 안 됨 | 로그인+admin 인지 (오른쪽 위 토스트 메시지 확인) |
| 커밋 후 사이트 변경 안 됨 | GitHub Actions 탭에서 빌드 상태 확인 (1~3분 소요) |

---

## 7. 비상 연락

작업 중 막히는 거 있으면 **요청 게시판**(📮)에 남기거나, 이 폴더의 파일을 직접 보내주세요.
모든 페이지는 위 7번까지의 흐름만 알면 운영 가능합니다.
