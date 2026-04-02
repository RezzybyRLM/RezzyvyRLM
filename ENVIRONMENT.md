# Environment variables

## Stripe (member billing)

- `STRIPE_SECRET_KEY` — Secret API key (`sk_test_…` or `sk_live_…`). Omit or use a placeholder only in local dev; the app treats keys containing `dummy` as unset.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Publishable key for Checkout (`pk_test_…` / `pk_live_…`). Used for client-side status messaging.
- `STRIPE_WEBHOOK_SECRET` — Signing secret from the Stripe Dashboard for `/api/stripe/webhook`.
- `STRIPE_BASIC_MONTHLY_CENTS` / `STRIPE_PRO_MONTHLY_CENTS` — Optional; used for admin MRR estimates (defaults: 999 and 1999 cents).

Apply the SQL migration `supabase/migrations/20260329120000_stripe_events.sql` so webhook events are logged for the admin billing screen.

## Google AI (Interview Pro text)

- `GEMINI_API_KEY` — Required for hosted models via Google AI Studio.
- `INTERVIEW_GEMMA_MODEL_ID` — Model id for interview replies (default `gemma-2-2b-it`). Text in / text out only.
- `GEMINI_MODEL` — Optional; used by other Gemini features (e.g. resume tools).

## ElevenLabs (optional TTS)

- `ELEVENLABS_API_KEY` — If set, Interview Pro prefers ElevenLabs for playback; otherwise the browser speaks the reply.
- `ELEVENLABS_VOICE_ID` — Defaults to a stock voice id if unset.
- `ELEVENLABS_MODEL_ID` — Optional TTS model (default `eleven_turbo_v2_5`).

## Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only; required for admin APIs and webhooks writing with the service role client.
