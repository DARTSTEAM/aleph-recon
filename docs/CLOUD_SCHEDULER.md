# 🕐 Cloud Scheduler Setup — Aleph Recon Studio

This document explains how to configure the automated cron jobs for Sprint 2 features:
escalation, reminders, and weekly summary.

---

## Prerequisites

- Backend deployed to Cloud Run (`aleph-recon-api`)
- `CRON_SECRET` environment variable set in Cloud Run
- Same `CRON_SECRET` value used in Cloud Scheduler HTTP headers

---

## Jobs to Create

### 1. Escalation (7-day rule)

| Field | Value |
|---|---|
| **Name** | `aleph-recon-escalation` |
| **Schedule** | `0 9 * * *` (every day at 09:00 ART = 12:00 UTC) |
| **Timezone** | `America/Argentina/Buenos_Aires` |
| **Target** | HTTP — POST |
| **URL** | `https://YOUR_CLOUD_RUN_URL/api/scheduled/escalate` |
| **Headers** | `x-cron-secret: YOUR_CRON_SECRET` |
| **Body** | *(empty)* |

**What it does:** Scans Firestore for Error items older than 7 days. Marks them `escalated: true` and emails the regional director.

---

### 2. Reminders (3-day rule)

| Field | Value |
|---|---|
| **Name** | `aleph-recon-reminders` |
| **Schedule** | `0 9 */3 * *` (every 3 days at 09:00 ART) |
| **Timezone** | `America/Argentina/Buenos_Aires` |
| **Target** | HTTP — POST |
| **URL** | `https://YOUR_CLOUD_RUN_URL/api/scheduled/reminders` |
| **Headers** | `x-cron-secret: YOUR_CRON_SECRET` |
| **Body** | *(empty)* |

**What it does:** Re-sends the follow-up email to the manager for every IO still in `Error` status that hasn't been contacted in 3+ days.

---

### 3. Weekly Summary (Monday 09:00 ART)

| Field | Value |
|---|---|
| **Name** | `aleph-recon-weekly-summary` |
| **Schedule** | `0 9 * * 1` (every Monday at 09:00 ART = 12:00 UTC) |
| **Timezone** | `America/Argentina/Buenos_Aires` |
| **Target** | HTTP — POST |
| **URL** | `https://YOUR_CLOUD_RUN_URL/api/scheduled/weekly-summary` |
| **Headers** | `x-cron-secret: YOUR_CRON_SECRET` |
| **Body** | *(empty)* |

**What it does:** Sends a weekly HTML summary email to the regional director with open errors, in-progress items, and match rate per manager.

---

## How to Create via gcloud CLI

```bash
# Set your variables
PROJECT_ID=hike-agentic-playground
API_URL=https://YOUR_CLOUD_RUN_URL
CRON_SECRET=your-random-cron-secret

# 1. Escalation — daily
gcloud scheduler jobs create http aleph-recon-escalation \
  --project=$PROJECT_ID \
  --location=us-central1 \
  --schedule="0 12 * * *" \
  --uri="${API_URL}/api/scheduled/escalate" \
  --http-method=POST \
  --headers="x-cron-secret=${CRON_SECRET}" \
  --time-zone="America/Argentina/Buenos_Aires"

# 2. Reminders — every 3 days
gcloud scheduler jobs create http aleph-recon-reminders \
  --project=$PROJECT_ID \
  --location=us-central1 \
  --schedule="0 12 */3 * *" \
  --uri="${API_URL}/api/scheduled/reminders" \
  --http-method=POST \
  --headers="x-cron-secret=${CRON_SECRET}" \
  --time-zone="America/Argentina/Buenos_Aires"

# 3. Weekly summary — every Monday
gcloud scheduler jobs create http aleph-recon-weekly-summary \
  --project=$PROJECT_ID \
  --location=us-central1 \
  --schedule="0 12 * * 1" \
  --uri="${API_URL}/api/scheduled/weekly-summary" \
  --http-method=POST \
  --headers="x-cron-secret=${CRON_SECRET}" \
  --time-zone="America/Argentina/Buenos_Aires"
```

---

## Inbound Email (Billing File Auto-Upload)

### Option A: Mailgun Inbound Routes

1. Go to **Mailgun → Receiving → Routes**
2. Create a new route with filter: `match_recipient("billing@mg.alephholding.com")`
3. Action: **Forward** → `https://YOUR_CLOUD_RUN_URL/api/inbound-email`
4. When IMS sends the monthly billing file to that address, Mailgun will forward the attachment to the API

### Option B: Gmail Push Notifications (advanced)

1. Configure a Gmail service account
2. Set up a Pub/Sub topic subscription
3. Forward to the `/api/inbound-email` endpoint via Cloud Run trigger

---

## Environment Variables for Cloud Run

```bash
gcloud run services update aleph-recon-api \
  --region=us-central1 \
  --set-env-vars="CRON_SECRET=your-random-cron-secret,\
ESCALATION_DAYS=7,\
REMINDER_DAYS=3,\
ESCALATION_EMAIL=regional-director@alephholding.com,\
WEEKLY_SUMMARY_EMAIL=regional-director@alephholding.com"
```
