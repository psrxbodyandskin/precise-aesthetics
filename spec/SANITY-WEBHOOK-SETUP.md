# Sanity Webhook Setup

> One-time configuration to wire Sanity Studio publish events through to the Supabase mirror. After P4 ships, do this once per environment.

The endpoint at `/api/webhooks/sanity/protocol` handles **both** `protocol` and `indication` document types — branch on `_type` after signature verification.

---

## 1. Generate a webhook secret

```bash
openssl rand -hex 32
```

Save the output. This is `SANITY_WEBHOOK_SECRET`.

## 2. Add the secret to environments

**Local (`.env.local`):**
```
SANITY_WEBHOOK_SECRET=<generated value>
```

**Vercel:**
- `vercel env add SANITY_WEBHOOK_SECRET production` (paste the value when prompted)
- Redeploy: `vercel --prod --force`

## 3. Configure the webhook in Sanity Studio

1. Open Sanity → **Manage** → **API** → **Webhooks** → **Create webhook**
2. Fill in:

| Field | Value |
|---|---|
| **Name** | `Protocol library sync` |
| **URL** | `https://preciseaesthetics.com/api/webhooks/sanity/protocol` |
| **Dataset** | `production` |
| **Trigger on** | ☑ Create  ☑ Update  ☑ Delete |
| **Filter** | `_type == "protocol" || _type == "indication"` |
| **Projection** | *(leave blank — Sanity sends the full document by default, which is what the sync layer expects)* |
| **HTTP method** | `POST` |
| **HTTP headers** | *(none — signature is added automatically)* |
| **API version** | `v2024-01-01` (or the latest stable) |
| **Include drafts** | ☐ unchecked (we sync published state only; draft documents stay in Sanity) |
| **Secret** | *(paste the same value as `SANITY_WEBHOOK_SECRET`)* |
| **Enable signature** | ☑ checked |

3. Save. Sanity sends a test event — confirm it's received with HTTP 200 in Vercel logs.

## 4. Verify end-to-end

Manual test sequence after migration `0007_protocols.sql` is applied:

1. In Sanity Studio, create a new `indication` (e.g., "Pigmentary disorders").
2. Publish it. Webhook fires → check Supabase: row appears in `public.indication_categories`.
3. In Sanity Studio, create a new `protocol` referencing that indication. Fill in title, slug, fitzpatrickTypes, parameter envelope.
4. Publish. Webhook fires → Supabase: `protocols` row at status='published', version=1.0, plus a `protocol_versions` snapshot with `version=1.0` and the full Sanity payload.
5. In `/admin/protocols` (after deploying P4), the protocol appears with status=Published, v1.0.
6. Edit the Sanity protocol (e.g., adjust shortDescription). Publish again → version increments to 1.1, new snapshot created.
7. In the admin detail view, click **"Mark next publish as major"**. Then republish in Sanity → version increments to 2.0 (not 1.2). The flag clears automatically.
8. Click **Force resync** in admin → no duplicate snapshot is created (idempotent on `_rev`).
9. In Sanity Studio, change protocol status to "archived" or unpublish → Supabase status flips to archived. Treatment-log integrity preserved (versions intact).

## 5. Common failure modes

| Symptom | Likely cause |
|---|---|
| Webhook returns 401 "Invalid signature" | `SANITY_WEBHOOK_SECRET` mismatch between Sanity Studio config and Vercel env |
| Webhook returns 503 "Webhook not configured" | `SANITY_WEBHOOK_SECRET` env var missing in Vercel |
| Protocol synced with `indication_category_id = null` | Indication webhook hasn't fired yet — publish the indication first, then republish the protocol (or click Force resync) |
| Duplicate webhook deliveries | Sanity may retry on slow responses. Sync is idempotent on `_rev` — duplicates are no-ops |
| Webhook payload missing `_id` / `_type` | Projection misconfigured in Sanity. Leave projection blank to send the full document |

## 6. Rotating the secret

If the secret leaks:

1. Generate a new value (`openssl rand -hex 32`)
2. Update Vercel env var, redeploy
3. Update the webhook secret in Sanity Studio Manage → API → Webhooks
4. The old secret stops working immediately on both sides
