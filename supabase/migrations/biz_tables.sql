-- 비즈니스 테이블 (입점처·정산·세금/관리비)
-- 관리자만 read/write 가능 — 사이트 방문자에겐 공개되지 않음

CREATE TABLE IF NOT EXISTS public.vendors (
  id           bigserial PRIMARY KEY,
  name         text NOT NULL,
  biz_no       text,
  manager      text,
  biz_type     text,
  biz_category text,
  email        text,
  address      text,
  commission   integer,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendors_admin_all" ON public.vendors;
CREATE POLICY "vendors_admin_all" ON public.vendors
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TABLE IF NOT EXISTS public.settlements (
  id              bigserial PRIMARY KEY,
  title           text NOT NULL,
  vendor          text NOT NULL,             -- vendor.name 매칭 (간단함을 위해 denormalized)
  settlement_date date,
  paid_date       date,
  status          text DEFAULT '확인 필요' CHECK (status IN ('완료','확인 필요','보류','취소')),
  total           bigint DEFAULT 0,
  supply          bigint DEFAULT 0,
  vat             bigint DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS settlements_vendor_idx ON public.settlements(vendor);
CREATE INDEX IF NOT EXISTS settlements_date_idx ON public.settlements(settlement_date DESC);
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settlements_admin_all" ON public.settlements;
CREATE POLICY "settlements_admin_all" ON public.settlements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TABLE IF NOT EXISTS public.tax_payments (
  id         bigserial PRIMARY KEY,
  item       text NOT NULL,
  date       date,
  category   text DEFAULT '세금' CHECK (category IN ('세금','사무실','기타')),
  amount     bigint DEFAULT 0,
  memo       text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tax_payments_date_idx ON public.tax_payments(date DESC);
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tax_payments_admin_all" ON public.tax_payments;
CREATE POLICY "tax_payments_admin_all" ON public.tax_payments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
