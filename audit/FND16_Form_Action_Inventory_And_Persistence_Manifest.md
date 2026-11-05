# FND16: Form/Action Inventory and Persistence Controls

**Finding:** FND16 (Partial / Implemented_Unverified)  
**Authority:** audit/W1_W3_Terra_Consolidated_Handoff.md, audit/W1_W3_Sol_Sonnet_Handover_Feedback_9ed39f2d.md  
**Status:** PARTIAL — RTH newsletter completed, other work pending

## Scope

Inventory all registration, enrollment, consent, marketing, and action forms across apps. Distinguish HTTP acknowledgement from actual delivery/persistence based on inspected server contracts. Implement timeout/unknown outcome vs rejection vs local draft semantics. Use non-enumerating error messages where appropriate.

**Assignment scope limits:** Admission/email consumer inspection and isolated tests permitted. SkillUp-admin CRM runtime changes require explicit root-cause evidence, manifest and Sol disposition before implementation.

## Previously Completed (from handoff)

1. **Newsletter (shared marketing footer)** — `40e05927`: Unavailable newsletter disclosed, email collection removed. Mounted test passed.
2. **Password recovery acknowledgement** — `49c44c63`, `audit/__tests__/recovery-acknowledgement.test.tsx`: RTH and SkillUp forgot-password pages distinguish HTTP OK from delivery confirmation and handle failures as uncertain outcomes. Mounted tests passed.

## Remaining Forms/Actions Inventory

### 1. Registration/Signup (AuthPage) — REQUIRES SERVER CONTRACT INSPECTION
- **Location:** `src/share-branding/AuthPage.tsx`
- **Action:** `signupUser()` in `src/share-branding/auth/authLoader.tsx`
- **Persistence claim:** Creates user account, sets authentication cookies
- **Current behavior:** Calls signup API, fetches session state, navigates
- **Server contract:** NOT INSPECTED — requires actual signup route handler review
- **Remediation status:** DO NOT alter accepted login/signup flows from generic assumption without source-backed contract evidence

### 2. Login (AuthPage) — REQUIRES SERVER CONTRACT INSPECTION
- **Location:** `src/share-branding/AuthPage.tsx`
- **Action:** `loginUser()` in `src/share-branding/auth/authLoader.tsx`
- **Persistence claim:** Authenticates user, establishes session
- **Current behavior:** Calls login API, fetches session state, navigates
- **Server contract:** NOT INSPECTED — requires actual login route handler review
- **Remediation status:** DO NOT alter accepted login/signup flows from generic assumption without source-backed contract evidence

### 3. Enquiry Edit (SkillUp Admin) — OUT OF SCOPE
- **Location:** `apps/skillup-admin/src/components/crm/EnquiryEditForm.tsx`
- **Action:** PATCH `/api/admin/crm/enquiries/{id}`
- **Server contract:** `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/route.ts` awaits `db.transaction`, performs update + follow-up insert, reads updated detail, returns `{updated: true, detail: updated}` with HTTP 200
- **Contract authority:** Committed server success with awaited transaction
- **Current behavior:** `response.ok` ? "Enquiry updated" + reload : "Save failed"
- **Assessment:** **Current success message is correct** — HTTP 200 confirms committed transaction
- **Scope ruling:** SkillUp-admin CRM runtime changes require explicit root-cause evidence and Sol disposition. No change authorized without manifest approval.

### 4. Enquiry Admission (SkillUp Admin)
- **Location:** `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts`
- **Action:** Creates user, admission, enrollment records and publishes event
- **Persistence claim:** Multi-step transaction with event dispatch
- **Current behavior:** Returns HTTP 200 with created IDs
- **Concern:** Event publish wrapped in try/catch with silent fallback (demo mode)
- **Remediation:** Distinguish account creation from event delivery, expose uncertain event state

### 5. Consent Management (Marketing)
- **Location:** `packages/marketing-site/src/components/privacy/ConsentBanner.tsx`
- **Action:** `updateConsent()`, `revokeConsent()` in `consent-manager.ts`
- **Persistence claim:** Saves consent state to localStorage
- **Current behavior:** Synchronous localStorage write
- **Concern:** **LOCAL ONLY** — no server persistence, no acknowledgement needed
- **Assessment:** Correct behavior for client-side preference; no HTTP persistence claim

### 6. Newsletter (RTH site local footer)
- **Location:** `apps/realtutorialhub-site/components/footer/FooterBrand.tsx`
- **Action:** Client-side `alert()` on form submit
- **Persistence claim:** "Thank you for subscribing" alert (false success)
- **Current behavior:** No HTTP call, pure UI simulation
- **Concern:** **FABRICATED SUCCESS** — claims subscription without any action
- **Remediation:** Remove form and false claim OR integrate actual subscription with acknowledgement semantics

### 7. Newsletter (shared marketing footer)
- **Location:** `packages/marketing-site/src/components/footer/FooterBrand.tsx`
- **Status:** ✅ ALREADY CORRECTED (`40e05927`)
- **Current behavior:** "Newsletter subscriptions are currently unavailable."
- **No action required**

### 8. Password Recovery (RTH/SkillUp)
- **Location:** `apps/realtutorialhub-web/src/app/forgot-password/page.tsx`, `apps/skillup-web/src/app/forgot-password/page.tsx`
- **Status:** ✅ ALREADY CORRECTED (`49c44c63`)
- **Current behavior:** "delivery is not confirmed" on HTTP OK, "Unable to confirm" on failure
- **Test:** `audit/__tests__/recovery-acknowledgement.test.tsx` passed
- **No action required**

## Actions Required (In-Scope Only)

1. **RTH local newsletter footer:** ✅ COMPLETED — Remove fabricated subscription, implement unavailable state
2. **Admission route:** Inspect consumer for event delivery uncertainty exposure (inspection and isolated tests permitted)
3. **AuthPage signup/login:** Inspect server contracts before any changes (DO NOT alter from generic assumption)

## Server Contract Inspection Principle

Before changing any success message or adding timeout/retry semantics:

1. **Inspect the actual server route handler**
2. **Identify the contract:** Does it await persistence? Return committed data? Queue async work?
3. **Distinguish response types:**
   - Committed server success: awaited transaction, returns persisted data → OK to confirm persistence
   - Accepted asynchronous work: queued event, deferred job → acknowledge acceptance, not completion
   - Explicit rejection: validation failure, auth denial → report failure
   - Unknown transport: fetch error, timeout → report uncertain outcome
4. **Apply contract-specific semantics** — do not weaken success messages without source-backed evidence

## Test Pattern (from recovery-acknowledgement.test.tsx)

```typescript
import '../../audit/W1_W3_Offline_Test_Network_Guard';
// Mock next modules before imports
vi.mock('next/link', () => ({ default: ({ children }) => <span>{children}</span> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => 'brand' }) }));
// Import component under test
import Component from './path';

it('acknowledges HTTP OK without claiming delivery', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  render(<Component />);
  // trigger submission
  expect(await screen.findByText(/delivery is not confirmed/i)).toBeTruthy();
});

it('reports uncertain outcome for timeout or HTTP failure', async () => {
  const fetchMock = vi.fn()
    .mockRejectedValueOnce(new Error('timeout'))
    .mockResolvedValueOnce(new Response(null, { status: 500 }));
  vi.stubGlobal('fetch', fetchMock);
  render(<Component />);
  // trigger submission
  expect(await screen.findByText(/Unable to confirm/i)).toBeTruthy();
});
```

**Note:** The above pattern applies to endpoints with uncertain persistence. For endpoints with awaited transactions returning committed data (like enquiry PATCH), current "success" messages are correct and should not be weakened.

## Verification Commands

```powershell
# RTH newsletter truth test (after clearing DB/cache/queue keys)
node --input-type=module -e "import { startVitest } from 'vitest/node'; import react from '@vitejs/plugin-react'; const v = await startVitest('test', ['apps/realtutorialhub-site/components/footer/__tests__/newsletter-truth.test.tsx'], { run: true, config: false, environment: 'jsdom', setupFiles: ['audit/W1_W3_Offline_Test_Network_Guard.ts'] }, { plugins: [react()] }); if (!v) process.exit(1); await v.close();"

# Typechecks
pnpm exec tsc --noEmit  # from apps/realtutorialhub-site

# Whitespace
git diff --check
```

## Limitations

- **Mocked services:** No actual HTTP, database, or email delivery
- **Client-side only:** No server-side session/persistence verification
- **Consent is local:** localStorage consent manager is client-side only (correct behavior)
- **Event delivery:** Admission route event publish uncertainty not exposed to caller
- **No browser:** Mounted React components in jsdom, not real browser navigation

## Disposition

PARTIAL — RTH newsletter completed and requires Sol review. Remaining work:
- **In-scope:** Admission event delivery inspection (consumer inventory and isolated tests permitted)
- **Blocked:** AuthPage signup/login changes require server contract inspection first
- **Out-of-scope:** EnquiryEditForm is SkillUp-admin CRM runtime — requires explicit manifest and Sol disposition
- Product impact of unavailable RTH newsletter requires Sol review
