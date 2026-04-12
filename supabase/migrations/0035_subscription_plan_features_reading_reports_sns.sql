-- 리포트·SNS 해금: VIP 플랜 `caps_json.features`에 관리자(포인트·정책 CMS)에서 다루는 플래그 추가 (2026-04-05)

update public.subscription_plans
set caps_json = jsonb_set(
  caps_json,
  '{features}',
  coalesce(caps_json->'features', '{}'::jsonb)
    || jsonb_build_object(
      'reading_reports_unlocked', true,
      'sns_share_unlocked', true
    ),
  true
)
where plan_key = 'vip_standard';
