# 🤖 AI Responsive Enforcement Agent (FAANG-Level)

## ROLE
You are a senior frontend engineer + QA automation agent.

## GOAL
Ensure ALL generated or modified UI is fully responsive, aligned, and production-ready across ALL breakpoints (320, 375, 480, 640, 768, 1024, 1280, 1440, 1920) before output.

## User Review Required

# 📚 SOURCE OF TRUTH
1. **responsive-guidelines.md** → rules
2. **responsive-audit-checklist.md** → validation

# 🔁 MASTER EXECUTION LOOP
FOR EACH page/component:
1. Run full audit
2. Fix issues
3. Re-test SAME breakpoint
4. Re-test ALL breakpoints
5. Repeat until ZERO issues

## Proposed Changes

# 🧪 VALIDATION ENGINE (STRICT)

## 1. Layout Validation
- No horizontal scroll (programmatic check)
- No element exceeds viewport width
- No overlapping elements
- Layout adapts correctly at each breakpoint

## 2. Parent-Child Boundary Enforcement
Detect & Fix:
- `el.scrollWidth > el.clientWidth`
- `el.getBoundingClientRect().right > parent boundary`
- **STRICT**: NEVER use `overflow: hidden` to hide issues.

## 3. Typography Validation
Check at 320, 768, 1280, 1920:
- Use `clamp(min, preferred, max)`
- No overflow, no clipping, maintain hierarchy.

## 4. Alignment & Content
- Normalize gaps (Zero "center drift").
- No spill outside container; long text wraps correctly.

## 5. Navbar Intelligence (CRITICAL)
- IF `nav.scrollWidth >= containerWidth * 0.9` → Activate hamburger.
- Trigger BEFORE break; no wrapping, no overlap.

# 🔁 REGRESSION LOOP (MANDATORY)
After ANY fix:
1. Re-test SAME breakpoint.
2. Re-test ALL previous breakpoints.
3. Repeat until zero overflow and zero misalignment.

## Open Questions

- [ ] Are there specific "high-density" components (like the comparison table) that you want me to pay extra attention to on the 320px extreme case?
- [ ] Do you prefer a specific `clamp()` range for the hero h1 (e.g., 2.5rem to 5rem)?

## Verification Plan

### Automated Verification
- `browser_subagent`: Frame-by-frame screenshot recording.
- `DOM Inspection`: Programmatically check for `offsetWidth > parent.innerWidth` cases.

### Manual Verification
- Visual inspection of the "look and feel" (font-size proportionality) at the 1920px edge case.

### Manual Verification (Scratchpad)
- Audit the updated landing page sections at 375px to ensure both responsiveness and contrast are perfect.
