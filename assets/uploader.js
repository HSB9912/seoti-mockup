/**
 * STTY · R2 업로드 헬퍼
 *
 * 사용법:
 *   import { uploadToR2 } from './assets/uploader.js';
 *   const { publicUrl, key } = await uploadToR2(file, { folder: 'archive' });
 *
 * 또는 페이지에서 직접:
 *   <script src="assets/uploader.js"></script>
 *   STTY.upload(file, { folder: 'products' }).then(({ publicUrl }) => {...});
 *
 * 흐름:
 *   1) Supabase 세션 토큰 가져옴 (관리자만 통과)
 *   2) Edge Function r2-presign 호출 → presigned PUT URL
 *   3) 브라우저가 R2 에 직접 PUT
 *   4) { uploadUrl, publicUrl, key } 반환
 */
(function (global) {
  'use strict';

  const FN_URL = 'https://wzmtcomawebufylojffx.supabase.co/functions/v1/r2-presign';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bXRjb21hd2VidWZ5bG9qZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTg5MjcsImV4cCI6MjA5NTQzNDkyN30.6P0ZSLTU7XPudr9Ove2S0Nc5XO7pdb87LUVDdVJKmEM';

  function loadSupabaseLib() {
    if (window.supabase) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Supabase lib 로드 실패'));
      document.head.appendChild(s);
    });
  }

  let _sb = null;
  async function getSb() {
    if (_sb) return _sb;
    await loadSupabaseLib();
    _sb = window.supabase.createClient(
      'https://wzmtcomawebufylojffx.supabase.co',
      ANON_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sb-wzmtcomawebufylojffx-auth-token' } },
    );
    return _sb;
  }

  /**
   * @param {File|Blob} file
   * @param {object} options
   * @param {string} [options.folder='uploads'] — R2 키 prefix (예: 'archive', 'products', 'reviews')
   * @param {(loaded:number,total:number)=>void} [options.onProgress]
   * @returns {Promise<{publicUrl: string, key: string, uploadUrl: string}>}
   */
  async function uploadToR2(file, options = {}) {
    if (!file) throw new Error('파일 없음');

    // 1) 세션 토큰
    const sb = await getSb();
    const { data: sess } = await sb.auth.getSession();
    if (!sess?.session?.access_token) {
      throw new Error('로그인이 필요해요 (관리자 권한 필요)');
    }

    // 2) presigned URL 요청
    const presignRes = await fetch(FN_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + sess.session.access_token,
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        filename: file.name || 'blob',
        contentType: file.type || 'application/octet-stream',
        folder: options.folder || 'uploads',
      }),
    });
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      throw new Error(err.error || 'presign 실패 (' + presignRes.status + ')');
    }
    const { uploadUrl, publicUrl, key } = await presignRes.json();

    // 3) R2 에 직접 PUT — XHR 써야 진행률 가능
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      if (options.onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) options.onProgress(e.loaded, e.total);
        };
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('R2 PUT 실패 (' + xhr.status + ') ' + xhr.responseText.slice(0, 200)));
      };
      xhr.onerror = () => reject(new Error('네트워크 오류'));
      xhr.send(file);
    });

    return { publicUrl, key, uploadUrl };
  }

  // 여러 파일 동시 업로드 (병렬, 진행률 합산)
  async function uploadMany(files, options = {}) {
    const arr = Array.from(files);
    const results = [];
    for (const f of arr) {
      try {
        const r = await uploadToR2(f, {
          folder: options.folder,
          onProgress: options.onItemProgress ? (l, t) => options.onItemProgress(f, l, t) : undefined,
        });
        results.push({ file: f, ok: true, ...r });
      } catch (e) {
        results.push({ file: f, ok: false, error: e.message || String(e) });
      }
    }
    return results;
  }

  // 노출
  if (!global.STTY) global.STTY = {};
  global.STTY.upload = uploadToR2;
  global.STTY.uploadMany = uploadMany;
})(window);
