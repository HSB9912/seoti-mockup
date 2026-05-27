-- ============================================================
-- STTY Studio · Supabase Initial Schema (한 번만 실행)
-- ============================================================
-- 실행 방법:
--   1. Supabase 대시보드 → 좌측 메뉴 SQL Editor 클릭
--   2. New query → 이 파일 전체 복사·붙여넣기
--   3. 우측 하단 Run (▶) 클릭
-- ============================================================

-- 1. PROFILES (auth.users 확장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nickname   text,
  country    text DEFAULT 'KR',
  phone      text,
  is_admin   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 회원가입 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, country, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country', 'KR'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PRODUCTS (작품/제품)
CREATE TABLE IF NOT EXISTS public.products (
  id          bigserial PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  category    text,
  price       integer NOT NULL DEFAULT 0,
  image_id    text,
  state       text DEFAULT 'in' CHECK (state IN ('in','out','disc')),
  stock       integer DEFAULT 0,
  safe_stock  integer DEFAULT 10,
  description text,
  release_date date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (true);

-- 3. SITE CONTENT (CMS — 어드민에서 텍스트 편집)
CREATE TABLE IF NOT EXISTS public.site_content (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
CREATE POLICY "site_content_public_read" ON public.site_content
  FOR SELECT USING (true);

-- 관리자만 INSERT/UPDATE 가능
DROP POLICY IF EXISTS "site_content_admin_write" ON public.site_content;
CREATE POLICY "site_content_admin_write" ON public.site_content
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 저장 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.touch_site_content()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_content_touch ON public.site_content;
CREATE TRIGGER site_content_touch
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_site_content();

-- 4. ARCHIVE PHOTOS (다꾸 갤러리)
CREATE TABLE IF NOT EXISTS public.archive_photos (
  id         bigserial PRIMARY KEY,
  image_id   text NOT NULL,
  category   text DEFAULT '다꾸',
  note       text,
  taken_at   date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.archive_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "archive_public_read" ON public.archive_photos;
CREATE POLICY "archive_public_read" ON public.archive_photos
  FOR SELECT USING (true);

-- 5. NOTICES (공지·행사·입점처·트웬티 통판)
CREATE TABLE IF NOT EXISTS public.notices (
  id         bigserial PRIMARY KEY,
  title      text NOT NULL,
  body       text,
  type       text DEFAULT 'notice' CHECK (type IN ('notice','event','shop','twenty','update')),
  image_id   text,
  is_pinned  boolean DEFAULT false,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_public_read" ON public.notices;
CREATE POLICY "notices_public_read" ON public.notices
  FOR SELECT USING (true);

-- 6. QNA (고객 문의)
CREATE TABLE IF NOT EXISTS public.qna (
  id           bigserial PRIMARY KEY,
  user_id      uuid REFERENCES auth.users ON DELETE SET NULL,
  category     text DEFAULT '제품',
  title        text NOT NULL,
  body         text,
  guest_email  text,
  is_private   boolean DEFAULT false,
  is_answered  boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.qna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qna_public_read" ON public.qna;
CREATE POLICY "qna_public_read" ON public.qna
  FOR SELECT USING (NOT is_private OR auth.uid() = user_id);

DROP POLICY IF EXISTS "qna_anyone_insert" ON public.qna;
CREATE POLICY "qna_anyone_insert" ON public.qna
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE TABLE IF NOT EXISTS public.qna_replies (
  id         bigserial PRIMARY KEY,
  qna_id     bigint REFERENCES public.qna ON DELETE CASCADE,
  body       text NOT NULL,
  responder  text DEFAULT 'STTY',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.qna_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qna_replies_read" ON public.qna_replies;
CREATE POLICY "qna_replies_read" ON public.qna_replies
  FOR SELECT USING (true);

-- 7. WISHLISTS
CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE,
  product_id bigint REFERENCES public.products ON DELETE CASCADE,
  added_at   timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlists_self" ON public.wishlists;
CREATE POLICY "wishlists_self" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id              bigserial PRIMARY KEY,
  order_no        text UNIQUE NOT NULL,
  user_id         uuid REFERENCES auth.users ON DELETE SET NULL,
  buyer_email     text,
  buyer_name      text,
  buyer_phone     text,
  shipping_address text,
  shipping_memo   text,
  items           jsonb NOT NULL,
  subtotal        integer NOT NULL,
  shipping_fee    integer DEFAULT 0,
  total           integer NOT NULL,
  payment_method  text,
  status          text DEFAULT 'pending'
    CHECK (status IN ('pending','paid','preparing','shipping','delivered','cancelled')),
  paid_at         timestamptz,
  shipped_at      timestamptz,
  tracking_no     text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_own_select" ON public.orders;
CREATE POLICY "orders_own_select" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_anyone_insert" ON public.orders;
CREATE POLICY "orders_anyone_insert" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 9. FEEDBACK (작가용 요청·버그 게시판 — 관리자만)
CREATE TABLE IF NOT EXISTS public.feedback (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES auth.users ON DELETE SET NULL,
  author      text,                            -- 작성자 표시명 (서티 / 클로드 등)
  type        text DEFAULT 'bug'
    CHECK (type IN ('bug','feature','design','content','idea')),
  priority    text DEFAULT 'med'
    CHECK (priority IN ('high','med','low')),
  status      text DEFAULT 'open'
    CHECK (status IN ('open','progress','done','wontfix')),
  title       text NOT NULL,
  body        text,
  page_url    text,                            -- 어느 페이지에서 발견했는지
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 관리자(profiles.is_admin)만 읽기·쓰기·수정·삭제 가능
DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;
CREATE POLICY "feedback_admin_all" ON public.feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback(status);
CREATE INDEX IF NOT EXISTS feedback_created_idx ON public.feedback(created_at DESC);

-- 첨부파일 (jsonb 배열: [{url, name, size, type, w?, h?}])
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- ============================================================
-- 10. STORAGE BUCKET · 요청 게시판 첨부파일
-- ============================================================
-- 'feedback-attachments' 버킷 (공개 읽기, 관리자만 쓰기)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-attachments', 'feedback-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "feedback_attach_public_read" ON storage.objects;
CREATE POLICY "feedback_attach_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'feedback-attachments');

DROP POLICY IF EXISTS "feedback_attach_admin_write" ON storage.objects;
CREATE POLICY "feedback_attach_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-attachments'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "feedback_attach_admin_delete" ON storage.objects;
CREATE POLICY "feedback_attach_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'feedback-attachments'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- SEED DATA · 사이트 콘텐츠 기본값
-- ============================================================
INSERT INTO public.site_content (key, value) VALUES
  ('home.eyebrow.main', 'STTY Studio'),
  ('home.eyebrow.sub',  '손그림 일러스트 아카이브'),
  ('home.title.line1',  '다정한 종이 위의'),
  ('home.title.line2',  '작은 풍경들.'),
  ('home.subtitle',     '2022년부터 손으로 그린 다꾸 일러스트·스티커·마스킹테이프를 기록하는 아카이브입니다.'),
  ('home.stat1.label',  '출시 컬렉션'),
  ('home.stat1.value',  '43'),
  ('home.stat2.label',  '활동 연차'),
  ('home.stat2.value',  '4년'),
  ('home.stat3.label',  '누적 판매'),
  ('home.stat3.value',  '12,000+'),
  ('contact.email',     'stty.studio@gmail.com'),
  ('contact.instagram', '@stty.studio'),
  ('contact.twitter',   '@stty_studio'),
  ('footer.copyright',  '© 2026 STTY')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 완료 · 결과 확인
-- ============================================================
SELECT 'Setup complete ✓' AS status,
       (SELECT count(*) FROM public.site_content) AS site_content_rows,
       (SELECT count(*) FROM information_schema.tables
         WHERE table_schema = 'public') AS total_tables;
