# r2-presign · Supabase Edge Function

관리자가 어드민 페이지에서 이미지를 끌어다놓으면 이 함수가 Cloudflare R2 의
presigned PUT URL 을 발급해서 브라우저가 R2 에 직접 업로드하도록 한다.

## 보안 모델

- Supabase JWT 검증 → `profiles.is_admin = true` 확인
- 관리자만 presigned URL 받을 수 있음
- URL 은 5분만 유효
- R2 Access Key/Secret 은 Supabase secrets 안에만 존재 (프론트엔드 노출 X)

## 배포 절차

### 1. Supabase CLI 설치 (이미 설치돼있으면 스킵)

```bash
npm i -g supabase
```

### 2. Supabase 프로젝트 link

```bash
cd C:/Users/Administrator/seoti-mockup
supabase login           # 브라우저 OAuth — 처음 한 번
supabase link --project-ref wzmtcomawebufylojffx
```

### 3. Secrets 등록

```bash
supabase secrets set \
  R2_ACCOUNT_ID=<발급받은 Account ID> \
  R2_ACCESS_KEY_ID=<발급받은 Access Key ID> \
  R2_SECRET_ACCESS_KEY=<발급받은 Secret Access Key> \
  R2_BUCKET=stty-images \
  R2_PUBLIC_URL=https://pub-6ba2dfe4988449599bacbbd4fb5c7443.r2.dev
```

### 4. Function 배포

```bash
supabase functions deploy r2-presign --no-verify-jwt
```

`--no-verify-jwt` 는 함수 내부에서 직접 JWT 검증을 하기 때문 (관리자 체크까지 함께).

### 5. R2 버킷 CORS 설정

CF Dashboard → R2 → stty-images → Settings → CORS Policy 에 추가:

```json
[
  {
    "AllowedOrigins": ["https://3eotty-afk.github.io"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "x-amz-*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 호출 예 (프론트엔드)

```js
const session = await sb.auth.getSession();
const r = await fetch(
  'https://wzmtcomawebufylojffx.supabase.co/functions/v1/r2-presign',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.data.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
      folder: 'archive',         // 또는 'products', 'reviews' 등
    }),
  },
);
const { uploadUrl, publicUrl, key } = await r.json();

// 브라우저가 R2 에 직접 PUT
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: fileBlob,
});

// DB 에 publicUrl 저장
await sb.from('archive_photos').insert({ image_id: key, image_url: publicUrl });
```
