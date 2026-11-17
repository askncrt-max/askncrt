CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_code text NOT NULL REFERENCES public.plans(code),
  provider text NOT NULL DEFAULT 'payu',
  txnid varchar(25) NOT NULL UNIQUE,
  amount_inr integer NOT NULL CHECK (amount_inr > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payu_transaction_id text,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admins read payments" ON public.payments FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE INDEX payments_user_created_idx ON public.payments(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.finalize_payu_payment(_txnid text, _payu_transaction_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_row public.payments%ROWTYPE;
  profile_rows integer;
BEGIN
  SELECT * INTO payment_row
  FROM public.payments
  WHERE txnid = _txnid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF payment_row.status = 'success' THEN
    RETURN 'already_processed';
  END IF;

  IF payment_row.status <> 'pending' THEN
    RETURN payment_row.status;
  END IF;

  UPDATE public.payments
  SET status = 'success',
      payu_transaction_id = _payu_transaction_id,
      failure_code = NULL,
      paid_at = now()
  WHERE id = payment_row.id;

  INSERT INTO public.subscriptions (user_id, plan_code, status, started_at, expires_at)
  VALUES (payment_row.user_id, payment_row.plan_code, 'active', now(), now() + interval '1 month')
  ON CONFLICT (user_id) DO UPDATE
  SET plan_code = EXCLUDED.plan_code,
      status = 'active',
      started_at = now(),
      expires_at = CASE
        WHEN public.subscriptions.status = 'active'
          AND public.subscriptions.expires_at > now()
        THEN public.subscriptions.expires_at + interval '1 month'
        ELSE now() + interval '1 month'
      END;

  UPDATE public.profiles
  SET plan = payment_row.plan_code
  WHERE id = payment_row.user_id;

  GET DIAGNOSTICS profile_rows = ROW_COUNT;
  IF profile_rows <> 1 THEN
    RAISE EXCEPTION 'Payment account profile is unavailable';
  END IF;

  RETURN 'success';
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_payu_payment(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_payu_payment(text, text) TO service_role;