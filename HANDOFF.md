# STTY 사이트 — 다른 PC 인수인계 메모

작성: 2026-05-27 · 마지막 커밋 `e14c142`

---

## 🚀 새 PC에서 시작 — 한 번만

```powershell
cd C:\Users\<사용자명>
git clone https://github.com/3eotty-afk/seoti-mockup.git
cd seoti-mockup
code .
```

GitHub 인증이 처음이면 push 첫 시도 시 브라우저로 OAuth 창 뜸 — 3eotty-afk 계정으로 로그인. 또는 미리:
```powershell
gh auth login
```

---

## 🔁 매번 — 작업 시작·끝

```powershell
git pull                 # 시작
# … 편집 …
git add -A
git commit -m "오늘 한 일"
git push                 # 끝
```

⚠ 두 PC에서 동시 작업 금지. push → 다른 PC pull → 작업 순서.

---

## 📍 지금 상태

### ✅ 완료
- Supabase 연동 (DB·인증·RLS·trigger)
- 로고 (`assets/logo/mascot.png`, `stty.png`) 적용
- 어드민 가드 = Supabase `profiles.is_admin` 체크
- 요청 게시판 `admin-feedback.html` (외부에서도 같은 목록)
- 소셜 로그인 버튼(카카오·Google) UI + OAuth probe (provider 미활성화 시 친절한 토스트)
- 손님 페이지 8개 mockup 데이터 제거 (빈 상태 UI로 교체)
- HSB9912 협업자 추가 (누나가 직접 완료)
- Supabase Site URL / Redirect URLs 등록 완료

### ⏳ 다음 PC에서 할 일
1. **본인 + 3eotty@gmail.com 관리자 SQL** ← 가장 중요
2. **product-detail-a.html, admin-content/inventory/business** mockup 데이터 비우기
3. **app.js `CONTENT_DEFAULTS` 15개 키** 비우기 + Supabase `site_content` UPDATE
4. **Google OAuth 클라이언트 ID** 만들기 (아래 가이드 참고)

---

## 🔑 1. 관리자 SQL — 제일 먼저

[Supabase SQL Editor](https://supabase.com/dashboard/project/wzmtcomawebufylojffx/sql/new)에서:

```sql
UPDATE public.profiles SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('hongsb9912@gmail.com','3eotty@gmail.com')
);

SELECT u.email, p.is_admin FROM auth.users u
JOIN public.profiles p ON u.id = p.id WHERE p.is_admin = true;
```

→ `UPDATE 2` 보이면 둘 다 성공. `UPDATE 1` 이면 한쪽은 아직 사이트에서 회원가입 안 한 상태. 그 계정으로 [auth-b.html](https://3eotty-afk.github.io/seoti-mockup/auth-b.html) 가입 후 위 쿼리 재실행.

---

## 🌐 2. Google OAuth 클라이언트 ID 만들기

### Google Cloud Console 쪽
1. https://console.cloud.google.com → 우상단 **프로젝트 선택 → 새 프로젝트** → 이름 `STTY` → 만들기
2. 왼쪽 메뉴 **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부** → 만들기
   - 앱 이름: `STTY`
   - 사용자 지원 이메일: 본인 Gmail
   - 개발자 연락처: 본인 Gmail
   - **저장 후 계속** (범위·테스트 사용자는 그냥 다음)
3. **API 및 서비스 → 사용자 인증 정보 → + 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - 이름: `STTY Web`
   - **승인된 자바스크립트 원본** (둘 다 추가):
     ```
     https://3eotty-afk.github.io
     https://wzmtcomawebufylojffx.supabase.co
     ```
   - **승인된 리다이렉션 URI**:
     ```
     https://wzmtcomawebufylojffx.supabase.co/auth/v1/callback
     ```
   - **만들기** → 팝업에 `클라이언트 ID`·`클라이언트 보안 비밀번호` 뜸 → 메모장에 복사

### Supabase 쪽
[Supabase Auth Providers](https://supabase.com/dashboard/project/wzmtcomawebufylojffx/auth/providers)
- **Google** 토글 ON
- `Client ID (for OAuth)`: 위에서 복사한 클라이언트 ID
- `Client Secret`: 위에서 복사한 보안 비밀번호
- **Save**

끝. 사이트에서 Google 로그인 작동 확인. 카카오도 동일한 흐름 (https://developers.kakao.com → 내 애플리케이션 만들기 → 카카오 로그인 활성화 → REST API 키 = Client ID, Client Secret 발급).

---

## 📁 핵심 파일

```
seoti-mockup/
├── index.html               메인
├── notice-b.html            공지
├── mockup-b-minimal.html    Collection
├── archive.html             Archive
├── customer-bulk-order-c.html  Group Order
├── customer-qna-b.html      QnA
├── contact.html             Contact
├── product-detail-a.html    상품 상세 ← 아직 mockup 남음
├── mypage-b.html            마이페이지
├── auth-b.html              로그인/가입
│
├── admin-c.html             어드민 대시보드 ← 아직 mockup 남음
├── admin-feedback.html      📮 요청 게시판
├── admin-content.html       사이트 CMS ← 아직 mockup 남음
├── admin-inventory.html     재고 ← 아직 mockup 남음
├── admin-business.html      정산 ← 아직 mockup 남음
├── admin-extensions.html    회원·공지·리뷰
├── admin-checklist.html     체크리스트
├── admin-roadmap.html       로드맵
│
├── supabase-setup.sql       DB 초기 (한 번만 실행)
├── HANDOFF.md               이 파일
├── GUIDE.md                 전체 운영 가이드
│
└── assets/
    ├── app.js               공통 코어 (Supabase·인증·장바구니·CMS)
    ├── nav.js               손님 nav (sticky 상단)
    ├── admin-nav.js         어드민 사이드바
    ├── admin-guard.js       Supabase isAdmin 체크
    └── logo/
        ├── mascot.png       천사 치와와 ✅
        └── stty.png         sTTy 로고 ✅
```

---

## 🛠 자주 쓰는 SQL

```sql
-- 회원 목록
SELECT email, nickname, country, is_admin FROM auth.users u
JOIN public.profiles p ON u.id = p.id ORDER BY created_at DESC;

-- 요청 게시판 통계
SELECT status, count(*) FROM public.feedback GROUP BY status;

-- 사이트 콘텐츠 한 줄 변경
UPDATE public.site_content SET value = '새 내용' WHERE key = 'home.title.line1';

-- 모든 site_content 키·값 보기
SELECT key, value FROM public.site_content ORDER BY key;
```

---

## 🔗 자주 들어가는 링크

| 항목 | URL |
| --- | --- |
| 라이브 사이트 | https://3eotty-afk.github.io/seoti-mockup/ |
| GitHub | https://github.com/3eotty-afk/seoti-mockup |
| Supabase | https://supabase.com/dashboard/project/wzmtcomawebufylojffx |
| Cloudflare R2 | https://dash.cloudflare.com → R2 → stty-images |
| Google Cloud | https://console.cloud.google.com |
| Kakao Developers | https://developers.kakao.com |
| GitHub Pages 빌드 상태 | https://github.com/3eotty-afk/seoti-mockup/actions |

---

## 🆘 막혔을 때

1. **사이트 → 어드민 → 📮 요청 게시판** 에 메모 남기기 (집·회사 같은 목록)
2. 또는 **claude.ai/code** 또는 **Claude Code 데스크탑**으로 이 폴더 열고 메시지 보내기 — 폴더만 같으면 어디서든 컨텍스트 받아짐
3. 정 안 되면 채팅으로 문제 사진 + 명령 출력 같이

문서·코드 다 push 돼 있어요. 그냥 `git clone` 하면 바로 이어서 작업 가능.
