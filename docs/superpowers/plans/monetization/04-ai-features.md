# Phase 4 — AI Features (Anthropic proxy + premium UI)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax. Requires Phases 1–3.

**Goal:** The four premium AI features — message generator, deep scan, resume tailoring, interview prep — live on the result page behind an entitlement gate, powered by ONE edge proxy.

**Architecture:** `ai-proxy` (Deno) verifies the user's JWT, checks entitlement + monthly quota, builds the prompt server-side, calls Anthropic, logs token usage, returns text. The SPA has one `callAi` client and one `<AiAssistant>` tabbed section. Four features = four prompt configs, not four systems. The post text is processed in memory and never stored server-side — and the UI says so.

**Tech Stack:** Supabase Edge Functions (Deno), Anthropic Messages API, React.

---

### Task 1: Shared prompt builders + entitlement mirror (Deno)

**Files:**
- Create: `supabase/functions/_shared/prompts.ts`
- Create: `supabase/functions/_shared/entitlement.ts`

- [ ] **Step 1: Write the entitlement mirror**

`supabase/functions/_shared/entitlement.ts` (mirror of `src/lib/entitlement.js` — the Vitest suite in Phase 1 is the spec; keep both in sync):

```ts
export const AI_MONTHLY_CAP = 60;

export function effectiveTier(row: any, now = new Date()): "free" | "premium" {
  if (!row || typeof row !== "object") return "free";
  if (row.tier !== "premium") return "free";
  const end = typeof row.current_period_end === "string" ? row.current_period_end : "";
  if (!end) return "free";
  return end >= now.toISOString().slice(0, 10) ? "premium" : "free";
}
```

- [ ] **Step 2: Write the prompt builders**

`supabase/functions/_shared/prompts.ts`:

```ts
// Prompts for the four premium features. The job post is always fenced so
// the model treats it as data, never as instructions (prompt-injection guard).

type Feature = "message" | "deepscan" | "resume" | "interview";

interface PromptInput {
  rawText: string;
  intake?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

function fence(text: string) {
  return `"""\n${(text || "").trim()}\n"""`;
}

function aboutMe(input: PromptInput) {
  const i = input.intake || {};
  const s = input.settings || {};
  return [
    `About the applicant:`,
    `- Name: ${(s.name as string) || "(the applicant will fill this in)"}`,
    `- Target role: ${(i.role as string) || "(see the post)"}`,
    `- Skills: ${(i.skills as string) || "(not listed)"}`,
    `- Experience level: ${(i.experience as string) || "(not stated)"}`,
  ].join("\n");
}

export const FEATURES: Record<Feature, { system: string; maxTokens: number; build: (input: PromptInput) => string }> = {
  message: {
    maxTokens: 700,
    system:
      "You write short, human, specific job application messages for Filipino remote workers. " +
      "120–160 words, first person, no buzzwords, no \"I am excited to apply\". Never invent skills or experience.",
    build: (input) => [
      `Write an application message for the remote job post below.`,
      ``,
      aboutMe(input),
      ``,
      `The job post:`,
      fence(input.rawText),
      ``,
      `Requirements:`,
      `1. Open with one specific reason this role fits them (no "Dear Hiring Manager").`,
      `2. Name two concrete things they can do for the employer, tied to what the post asks for.`,
      `3. End with a short, low-pressure line about talking further.`,
    ].join("\n"),
  },
  deepscan: {
    maxTokens: 900,
    system:
      "You are a scam analyst protecting Filipino remote job seekers. You read job posts critically and " +
      "report in clear, plain markdown. You never say a post is 'safe' or 'verified' — you report findings " +
      "and always tell the reader to verify the employer independently.",
    build: (input) => [
      `Analyze this remote job post for scam signals a keyword scanner would miss:`,
      `- Inconsistencies (pay vs. responsibilities vs. requirements)`,
      `- Too-good-to-be-true economics for the Philippine market`,
      `- Pressure, vagueness, or evasiveness about the employer`,
      `- Anything that suggests identity theft, money mules, or advance-fee fraud`,
      ``,
      `The job post:`,
      fence(input.rawText),
      ``,
      `Reply in exactly this markdown structure:`,
      `## Overall read — one short paragraph`,
      `## Findings — 3 to 5 bullets, each: what you noticed and why it matters`,
      `## Questions to ask the poster — up to 3 bullets`,
      `## Bottom line — one sentence, ending with advice to verify independently`,
    ].join("\n"),
  },
  resume: {
    maxTokens: 1200,
    system:
      "You tailor resumes for Filipino remote workers applying to specific job posts. You reorganize and " +
      "rephrase what the person actually wrote — you never invent jobs, titles, employers, or metrics. " +
      "Output clean markdown.",
    build: (input) => [
      `Tailor the applicant's resume text for the job post below.`,
      ``,
      `The job post:`,
      fence(input.rawText),
      ``,
      `Their current resume text:`,
      fence(String(input.extra?.resume || "")),
      ``,
      `Produce:`,
      `## Tailored summary — 2–3 sentences aimed at this role`,
      `## Skills to lead with — reordered from their real skills, most relevant first`,
      `## Rewritten bullets — their existing bullets rephrased to mirror the post's language (max 6)`,
      `## Honest gaps — what the post wants that they don't show; suggest how to address each in one line`,
    ].join("\n"),
  },
  interview: {
    maxTokens: 900,
    system:
      "You prepare Filipino remote workers for job interviews. Questions must be specific to the actual " +
      "post, not generic. Suggested answers use only the applicant's stated skills and experience.",
    build: (input) => [
      `Prepare the applicant for an interview for this remote job.`,
      ``,
      aboutMe(input),
      ``,
      `The job post:`,
      fence(input.rawText),
      ``,
      `Produce:`,
      `## 5 likely questions — each with a 2–3 sentence suggested answer in the first person`,
      `## 2 questions they should ask the employer — specific to what the post leaves unclear`,
      `## 1 thing to research about the employer before the call`,
    ].join("\n"),
  },
};

export function isFeature(value: string): value is Feature {
  return value in FEATURES;
}
```

- [ ] **Step 2b: Commit**

```bash
git add supabase/functions/_shared/prompts.ts supabase/functions/_shared/entitlement.ts
git commit -m "feat: ai feature prompt builders and entitlement mirror"
```

---

### Task 2: `ai-proxy` edge function

**Files:**
- Create: `supabase/functions/ai-proxy/index.ts`

- [ ] **Step 1: Write the function**

`supabase/functions/ai-proxy/index.ts`:

```ts
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient, requireUser } from "../_shared/admin.ts";
import { AI_MONTHLY_CAP, effectiveTier } from "../_shared/entitlement.ts";
import { FEATURES, isFeature } from "../_shared/prompts.ts";

const MAX_POST_CHARS = 12000;   // cost guard: no megabyte posts
const MAX_RESUME_CHARS = 8000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // 1. Auth
    const user = await requireUser(req);
    if (!user) return json({ error: "Sign in to use AI features.", code: "auth" }, 401);

    // 2. Entitlement (service-role read — the browser can't fake this)
    const supabase = adminClient();
    const { data: ent } = await supabase
      .from("entitlements")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (effectiveTier(ent) !== "premium") {
      return json({ error: "AI features are part of Premium.", code: "upgrade" }, 402);
    }

    // 3. Monthly quota
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString());
    const used = count ?? 0;
    if (used >= AI_MONTHLY_CAP) {
      return json({ error: `Monthly AI limit reached (${AI_MONTHLY_CAP}). Resets on the 1st.`, code: "quota" }, 429);
    }

    // 4. Validate input
    const body = await req.json().catch(() => ({}));
    const feature = String(body.feature || "");
    if (!isFeature(feature)) return json({ error: "Unknown feature." }, 400);
    const rawText = String(body.rawText || "").slice(0, MAX_POST_CHARS);
    if (!rawText.trim()) return json({ error: "Missing the job post text." }, 400);
    const extra = { ...(body.extra || {}) };
    if (extra.resume) extra.resume = String(extra.resume).slice(0, MAX_RESUME_CHARS);
    if (feature === "resume" && !String(extra.resume || "").trim()) {
      return json({ error: "Paste your resume text first." }, 400);
    }

    // 5. Build prompt + call Anthropic
    const def = FEATURES[feature];
    const prompt = def.build({ rawText, intake: body.intake || {}, settings: body.settings || {}, extra });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5",
        max_tokens: def.maxTokens,
        system: def.system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Anthropic error", res.status, data);
      return json({ error: "The AI provider had a problem. Try again in a moment.", code: "provider" }, 502);
    }
    const text = (data?.content || []).map((b: any) => b?.text || "").join("").trim();
    if (!text) return json({ error: "The AI returned nothing useful. Try again.", code: "provider" }, 502);

    // 6. Meter + respond. The post text itself is never stored.
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      feature,
      tokens_in: data?.usage?.input_tokens ?? 0,
      tokens_out: data?.usage?.output_tokens ?? 0,
    });

    return json({ text, remaining: AI_MONTHLY_CAP - used - 1 });
  } catch (err) {
    console.error("ai-proxy error", err);
    return json({ error: "Something went wrong on our side. Try again.", code: "error" }, 500);
  }
});
```

- [ ] **Step 2: Set secrets + deploy**

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
npx supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5
npx supabase functions deploy ai-proxy
```

- [ ] **Step 3: Verify the gate (curl)**

```bash
# No JWT must be rejected:
curl -i -X POST https://YOUR-PROJECT.supabase.co/functions/v1/ai-proxy -H "Content-Type: application/json" -d "{\"feature\":\"deepscan\",\"rawText\":\"test post\"}"
```

Expected: `401`. (A premium JWT succeeds in the E2E task.)

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-proxy
git commit -m "feat: ai-proxy edge function with entitlement and quota gates"
```

---

### Task 3: Frontend AI client

**Files:**
- Create: `src/lib/ai.js`

- [ ] **Step 1: Write the client**

`src/lib/ai.js`:

```js
// ai.js — calls the ai-proxy edge function. Throws an Error whose `code`
// tells the UI what to show: "auth" | "upgrade" | "quota" | "provider" | "error".
import { supabase } from "./supabase.js";

export async function callAi(feature, { rawText, intake, settings, extra } = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    const err = new Error("Sign in to use AI features.");
    err.code = "auth";
    throw err;
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ feature, rawText, intake, settings, extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Try again.");
    err.code = data.code || (res.status === 402 ? "upgrade" : res.status === 429 ? "quota" : "error");
    throw err;
  }
  return data; // { text, remaining }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai.js
git commit -m "feat: ai proxy client"
```

---

### Task 4: `<AiAssistant>` — the premium section on the result page

One tabbed card with four features. The free copy-prompt path stays directly above it, untouched and clearly labeled as the free option.

**Files:**
- Create: `src/components/AiAssistant.jsx`
- Modify: `src/components/ResultView.jsx`

- [ ] **Step 1: Write the component**

`src/components/AiAssistant.jsx`:

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { callAi } from "../lib/ai.js";
import { copyToClipboard } from "../lib/clipboard.js"; // use the name the repo's helper actually exports

const RESUME_KEY = "applyguard.resume"; // localStorage, this device only (never synced)

const TABS = [
  { id: "message", label: "Message", desc: "A ready-to-send application message, written for this post." },
  { id: "deepscan", label: "Deep scan", desc: "An AI second opinion on scam signals a keyword scan can miss." },
  { id: "resume", label: "Resume", desc: "Your resume text, tailored to mirror this post." },
  { id: "interview", label: "Interview", desc: "Likely questions with suggested answers, from this post." },
];

function GateCard({ children }) {
  return (
    <section className="rise d5 rounded-3xl border border-brand/40 bg-brand/5 p-6 sm:p-8">
      <p className="eyebrow text-brand-deep">Premium AI</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function AiAssistant({ job }) {
  const { user, backendEnabled, tier, usageCount, aiCap, refreshEntitlement } = useAuth();
  const { settings, notify } = useApp();
  const [tab, setTab] = useState("message");
  const [resume, setResume] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // The resume text is the user's own device-local convenience — never synced.
  useEffect(() => {
    try {
      setResume(window.localStorage.getItem(RESUME_KEY) || "");
    } catch { /* ignore */ }
  }, []);
  const saveResume = (value) => {
    setResume(value);
    try {
      window.localStorage.setItem(RESUME_KEY, value);
    } catch { /* ignore */ }
  };

  if (!backendEnabled) return null;

  if (!user) {
    return (
      <GateCard>
        <h2 className="font-display text-2xl text-ink">Let AI do the writing</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Premium AI can write the application for you, deep-scan this post, tailor your
          resume, and prep your interview. Sign in to see Premium.
        </p>
        <Link to="/account" className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep">
          Sign in
        </Link>
      </GateCard>
    );
  }

  if (tier !== "premium") {
    return (
      <GateCard>
        <h2 className="font-display text-2xl text-ink">This is where Premium works</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Four AI tools for this exact post — the written application, a deeper scam read,
          a tailored resume, and interview prep. {aiCap} uses a month.
        </p>
        <Link to="/offers" className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep">
          See Premium
        </Link>
      </GateCard>
    );
  }

  const runFeature = async () => {
    setBusy(true);
    setOutput("");
    setCopied(false);
    try {
      const { text, remaining } = await callAi(tab, {
        rawText: job.rawText,
        intake: job.intake,
        settings,
        extra: tab === "resume" ? { resume } : {},
      });
      setOutput(text);
      refreshEntitlement(); // refresh "uses left"
      if (remaining <= 5) notify(`${remaining} AI uses left this month.`, "info");
    } catch (err) {
      if (err.code === "quota") notify("Monthly AI limit reached. Resets on the 1st.", "error");
      else if (err.code === "upgrade") notify("Premium has ended — renew to keep using AI.", "error");
      else notify(err.message || "The AI call failed. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const copyOutput = async () => {
    const ok = await copyToClipboard(output);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1900);
    } else {
      notify("Couldn't copy automatically. Select the text and copy it.", "error");
    }
  };

  const active = TABS.find((t) => t.id === tab);

  return (
    <section className="rise d5 elev rounded-3xl border border-brand/40 bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="eyebrow text-brand-deep">Premium AI</p>
          <h2 className="mt-1 font-display text-2xl text-ink">Work this post with AI</h2>
        </div>
        <span className="rounded-full bg-panel px-3 py-1 font-mono text-xs text-ink-soft">
          {Math.max(0, aiCap - usageCount)} / {aiCap} uses left
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="AI features">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setOutput("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none ${
              tab === t.id ? "bg-ink text-paper" : "bg-panel text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink-soft">{active.desc}</p>

      {tab === "resume" && (
        <textarea
          value={resume}
          onChange={(e) => saveResume(e.target.value)}
          rows={6}
          placeholder="Paste your current resume text here. It stays on this device — it's sent to the AI only when you click Generate."
          aria-label="Your resume text"
          className="mt-3 w-full resize-y rounded-2xl border border-line bg-paper p-4 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
        />
      )}

      <button
        type="button"
        onClick={runFeature}
        disabled={busy || (tab === "resume" && !resume.trim())}
        className="mt-4 rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Generating…" : `Generate ${active.label.toLowerCase()}`}
      </button>
      <p className="mt-2 text-xs text-ink-faint">
        Sends this job post to Anthropic (our AI provider) to generate the result. The text is
        processed, not stored. Your free copy-prompt above always works too.
      </p>

      {output && (
        <div className="settle mt-5">
          <div className="prose-sm max-w-none whitespace-pre-wrap rounded-2xl border border-line bg-paper p-5 text-sm leading-relaxed text-ink">
            {output}
          </div>
          <button
            type="button"
            onClick={copyOutput}
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none ${
              copied ? "bg-go" : "bg-ink hover:bg-ink-soft"
            }`}
            aria-live="polite"
          >
            <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
            {copied ? "Copied" : "Copy result"}
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Mount it on the result page + retire the stale CTA**

In `src/components/ResultView.jsx`:

1. Add the import: `import AiAssistant from "./AiAssistant.jsx";`
2. Render `<AiAssistant job={data} />` immediately AFTER the "Message generator" `</section>` and BEFORE the "Save" section.
3. Replace the old "POST-RESULT optional extras CTA" section (the one saying "checkout is not active yet") with:

```jsx
{tier !== "premium" && (
  <section className="rise d6 rounded-3xl border border-brand/40 bg-brand/5 p-6 sm:p-8">
    <p className="eyebrow text-brand-deep">Premium</p>
    <h2 className="mt-2 font-display text-2xl text-ink">Want AI to do the heavy lifting?</h2>
    <p className="mt-2 max-w-2xl text-ink-soft">
      The scanner stays free forever. Premium writes the application, deep-scans the post,
      tailors your resume, and preps your interview.
    </p>
    <Link
      to="/offers"
      className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep active:translate-y-0 active:scale-[0.99]"
    >
      See Premium
    </Link>
  </section>
)}
```

(Add `tier` from `useAuth()` to the component — import the hook.)

- [ ] **Step 3: Verify build + commit**

Run: `npm run build`
Expected: build succeeds.

```bash
git add src/components/AiAssistant.jsx src/components/ResultView.jsx
git commit -m "feat: premium ai assistant on the result page"
```

---

### Task 5: README rewrite + final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README**

Replace the Stack section:

```markdown
## Stack

- **React + Vite** (functional components and hooks)
- **Tailwind CSS v4** (utility-first, mobile-first)
- **Vitest** for unit tests
- **Supabase** (optional accounts: magic-link auth, Postgres + RLS cloud sync, Deno edge functions)
- **PayMongo** (Premium subscriptions: card/Maya recurring; GCash 30-day manual renewal)
- **Anthropic** (Premium AI features, called from a server-side proxy — keys never ship to the browser)
- The free scanner still needs **no backend, no account, no paid APIs**. Persistence is localStorage.
```

Replace the Monetization section:

```markdown
## Monetization

The scanner is free and never gated. **Premium** (₱299/mo or ₱2,990/yr, card/Maya auto-renew;
₱299 per 30 days via GCash manual renewal) adds four AI features on the result page:
application message generator, deep scam analysis, resume tailoring, and interview prep —
60 AI uses per month. The Message Pack (₱149 one-time) is also available. Entitlements are
written ONLY by the signature-verified PayMongo webhook; the browser can never self-upgrade.
```

Replace the Privacy section:

```markdown
## Privacy

- **No account:** scans run entirely in your browser. Nothing is uploaded.
- **With an account:** your settings and saved jobs sync to private cloud rows protected by
  row-level security. Still your data; export or wipe it any time from Settings.
- **Premium AI features:** the job post text is sent to Anthropic to generate the result.
  It is processed in memory and never stored on our servers. Only token counts are metered.
```

Add a Backend setup section:

```markdown
## Backend setup (optional — accounts & Premium)

The app runs fully local-only without this. To enable accounts/subscriptions/AI:

1. Create `.env.local` from `.env.example` with your Supabase URL + anon key.
2. `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. `npx supabase functions deploy` and set secrets (`PAYMONGO_SECRET_KEY`,
   `PAYMONGO_WEBHOOK_SECRET`, `PAYMONGO_PLAN_MONTHLY_ID`, `PAYMONGO_PLAN_YEARLY_ID`,
   `ANTHROPIC_API_KEY`, `APP_ORIGIN`).
4. Register the PayMongo webhook to `<supabase-url>/functions/v1/paymongo-webhook`.
5. Set the same `VITE_*` vars in Netlify → Site settings → Environment.

Full step-by-step: `docs/superpowers/plans/monetization/`.
```

- [ ] **Step 2: Full verification**

```bash
npm test
npm run build
```

Expected: all tests pass; build succeeds.

E2E checklist (test keys, signed-in Premium account):
1. Result page shows the AI section with 4 tabs + "uses left" counter.
2. Message tab → Generate → a specific, non-generic application message appears; counter drops by 1.
3. Deep scan → markdown with the 4 required sections.
4. Resume tab without text → Generate disabled; with text → tailored markdown.
5. Interview tab → 5 questions with answers.
6. A second Premium account with a free-tier JWT gets `402`; quota exhaustion returns `429`.
7. The free copy-prompt section still works with no account at all.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite readme for accounts, premium, and ai features"
```

---

**Phase 4 done when:** all four AI features generate real output for a Premium user, free users hit the upgrade card (never a broken button), the consent line renders under every Generate button, and `npm test && npm run build` are green.
