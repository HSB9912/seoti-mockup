// STTY · R2 presigned URL 발급 Edge Function
//
// 요청: POST /r2-presign
//   body: { filename: string, contentType: string, folder?: string }
//   headers: Authorization: Bearer <Supabase JWT>
//
// 응답: { uploadUrl: string, publicUrl: string, key: string, expiresIn: number }
//
// 동작:
//   1) JWT 검증 + profiles.is_admin = true 확인
//   2) 안전한 키 생성 (folder/uuid-filename)
//   3) R2 S3 PUT presigned URL 발급 (5분 유효)
//   4) 브라우저에서 그 URL 로 직접 PUT → R2 업로드
//   5) 업로드 끝난 객체는 pub-...r2.dev/{key} 로 공개 접근
//
// 배포:
//   supabase functions deploy r2-presign --no-verify-jwt
//   (JWT 검증은 함수 내부에서 직접 — Supabase 의 기본 verify-jwt 보다 유연)
//
// Secrets (Supabase Dashboard → Edge Functions → Secrets):
//   R2_ACCOUNT_ID            예: 660081b1bdbe52530d4d1a3d6986dd7a
//   R2_ACCESS_KEY_ID         CF dashboard 에서 발급
//   R2_SECRET_ACCESS_KEY     CF dashboard 에서 발급
//   R2_BUCKET                stty-images
//   R2_PUBLIC_URL            https://pub-6ba2dfe4988449599bacbbd4fb5c7443.r2.dev
//   SUPABASE_URL             자동 주입
//   SUPABASE_SERVICE_ROLE_KEY 자동 주입 (관리자 검증용)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

function safeFilename(name: string): string {
  // 한글·공백·기호 → ASCII 안전 형태로
  const ext = (name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w-]/g, "_")
    .slice(0, 40)
    || "file";
  return `${base}.${ext || "bin"}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // 1) JWT 검증 + 관리자 확인
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Authorization 헤더 필요" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "서버 설정 오류" }, 500);

  const sb = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "유효하지 않은 토큰" }, 401);

  const { data: profile } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!profile?.is_admin) return json({ error: "관리자 권한 필요" }, 403);

  // 2) 요청 body 파싱
  let body: { filename?: string; contentType?: string; folder?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON 본문 필요" }, 400);
  }
  if (!body.filename || !body.contentType) {
    return json({ error: "filename, contentType 필수" }, 400);
  }

  // 3) R2 환경변수
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
  const bucket = Deno.env.get("R2_BUCKET") || "stty-images";
  const publicUrl = Deno.env.get("R2_PUBLIC_URL") || "";
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return json({ error: "R2 자격증명 미설정" }, 500);
  }

  // 4) 안전한 key 생성
  const folder = (body.folder || "uploads").replace(/[^a-z0-9_/-]/gi, "");
  const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
  const uuid = crypto.randomUUID().slice(0, 12);
  const safe = safeFilename(body.filename);
  const key = `${folder}/${yyyymm}/${uuid}-${safe}`;

  // 5) R2 presigned PUT URL 발급 (aws4fetch 으로 S3 시그너처 v4 적용)
  const r2 = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const target = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
  const expiresIn = 300; // 5분

  // sign() 으로 미리 URL 만들기 — Headers 에 host/x-amz-date 들어가서 그대로 PUT 보낼 수 있음
  const signed = await r2.sign(
    new Request(target + `?X-Amz-Expires=${expiresIn}`, {
      method: "PUT",
      headers: { "Content-Type": body.contentType },
    }),
    { aws: { signQuery: true } },
  );

  return json({
    uploadUrl: signed.url,
    publicUrl: publicUrl ? `${publicUrl.replace(/\/$/, "")}/${key}` : "",
    key,
    expiresIn,
    contentType: body.contentType,
  });
});
