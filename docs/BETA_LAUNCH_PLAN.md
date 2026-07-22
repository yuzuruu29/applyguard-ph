# Closed Beta & Public Launch Validation Plan — ApplyGuard PH

This document details the operational execution plan for the closed beta rollout and public launch validation of ApplyGuard PH Pro Preview.

---

## 1. Closed Beta Cohort Recruitment (20–30 Job Seekers)

### Target Audience
Filipino remote job seekers actively applying on platforms like OnlineJobs.ph, Upwork, LinkedIn, and Facebook remote worker communities.

### Outreach Channels
1. **University Career Groups & Alumni Networks** (UP, PUP, UST, DLSU IT/Business graduates).
2. **OnlineJobs.ph Applicant Communities** & Remote Work Philippines FB Groups.
3. **Freelance & Virtual Assistant Communities** (VA Philippines, Virtual Assistant Community PH).

### Trial Provisioning & Onboarding
- Beta participants register using standard email Magic Link auth.
- Standard 7-day Pro Preview triggers automatically upon running their first AI feature.
- No special admin override or artificial unlimited status is given, ensuring authentic usage metrics.

---

## 2. Beta Feedback Collection

After 7 days of usage, participants complete a structured 5-minute feedback survey measuring:

1. **Decision Utility**: Did an AI deep scan or background check change an application decision (prevented applying to a scam or encouraged applying to a verified role)?
2. **Trust & Clarity**: Were risk signals understandable and actionable without causing unnecessary alarm?
3. **Feature Preference**: Which premium feature was used first and most frequently (`deep_scan`, `resume_tailor`, `outreach`, `mock_interview`)?
4. **Price Sentiment**: Does ₱299/month feel fair for full AI access?
5. **Conversion Driver**: What specific trigger would cause them to purchase 30-Day Pro?

---

## 3. Commercial Validation Metrics (First 100–200 Visitors)

| Stage | Metric Target | Actionable Threshold |
|---|---|---|
| **Landing Visit → Free Scan** | > 45% completion | If < 30%, simplify post input UI |
| **Free Scan → Account Created** | > 20% sign-up | If < 10%, refine CTA messaging |
| **Account Created → Trial Activated** | > 70% activation | High intent indicator |
| **Trial Activated → 2nd AI Action** | > 50% repeat usage | Proves ongoing feature value |
| **Trial Exhausted/Expired → Paid Conversion** | 3% – 5% conversion | First valid commercial signal |

---

## 4. API Cost & Budget Safety Benchmarks

- **Target Average Trial API Cost**: Keep total API cost for a fully consumed trial (3 deep scans, 2 resume tailors, 5 outreach messages, 1 voice interview) **under $0.15 USD**.
- **Daily Circuit Breaker**: $10.00 USD/day hard cap on edge function proxy.
- **Monitoring Cadence**: Daily review of `ai_usage_ledger` token metrics, prompt cache hit rate (target > 60% cache hit rate on repeated rubrics), and cost per user.
