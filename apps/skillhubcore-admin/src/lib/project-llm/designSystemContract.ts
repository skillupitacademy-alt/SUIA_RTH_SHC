/**
 * Generic design-system contract shared by Project LLM handoff surfaces.
 *
 * These are platform invariants. They do not prescribe a block's pedagogical
 * layout or visual composition; each family/version remains responsible for
 * its own content-specific presentation.
 */
export const DESIGN_SYSTEM_CONTRACT_MARKDOWN = `
## Shared Tutorial Design System Contract

Every candidate must align with these twelve platform parameters while keeping
its own family/version-specific UI and pedagogical composition:

1. Typography: use the existing font stack, BlockHeader hierarchy, readable line heights, and responsive title scales.
2. Color palette: consume the injected theme and semantic tokens; do not hard-code brand names or brand-specific runtime behavior.
3. Spacing: use the existing responsive spacing rhythm and shared primitive padding/gap conventions.
4. Shape, borders, and elevation: use shared radius, perimeter borders, and the CardSurface elevation tiers; never use shadow alone as a boundary.
5. Components: compose BlockShell, BlockHeader, CardSurface, CalloutBanner, TerminalWindow, StepBadge, and SyntaxPill where their semantics fit; do not recreate them unnecessarily.
6. Layout and grid: use responsive, content-safe layouts that preserve alignment and avoid overflow at supported breakpoints.
7. Iconography: use lucide-react icons for interface meaning and mark decorative icons aria-hidden="true"; do not use emoji as UI controls.
8. Interaction states: interactive elements need a real semantic role, keyboard operation, visible focus state, disabled/loading states where applicable, and must not imply clickability when static.
9. Responsive behavior: verify mobile, tablet, and desktop rendering, including wrapping, stacking, and horizontal overflow handling.
10. Accessibility: provide semantic structure, accessible names, keyboard support, reduced-motion behavior, forced-colors boundaries, and WCAG-focused tests.
11. Data/status conventions: use existing semantic status meanings and accessible text/labels; do not invent conflicting success, warning, error, or progress meanings.
12. Tokens and naming: keep visual values in shared primitives, theme utilities, or documented tokens; avoid duplicated magic values and legacy styling branches.

### Responsive Layout and Boundary Contract

This contract applies to every block family and version. It governs the block's
own DOM only; the host application owns page navigation, sidebars, authentication,
and Composer chrome.

- Compose the outer block with BlockShell, use w-full and min-w-0 on flex/grid children that contain text, and let text wrap or break rather than expand the page.
- A parent owns its padding, gap, width, and overflow. No child card, icon, control, image, code sample, table, or long string may touch, clip through, or extend beyond its parent border.
- Never use page-level horizontal scrolling to solve a block layout. Horizontal scrolling is allowed only inside a clearly bounded, keyboard-accessible code or data region that genuinely needs it.
- Use fluid grids and stacking layouts. Do not use fixed/minimum widths that assume the viewport has no host navigation or progress sidebar.
- Keep display text readable and controls usable from 375, 640, 768, 1024, 1280, and 1536 CSS-pixel widths. Test normal, long, and sparse content; do not depend on a single example payload.
- Keep typography, spacing, card boundaries, focus indicators, and touch targets intact at every supported width. Decorative transforms must not create clipping and must respect reduced-motion preferences.
- Do not add host-shell workarounds, global overflow rules, sidebars, or registry/Composer changes to the candidate package. Project LLM owns integration and verifies the placed block in an isolated worktree.

### Accessibility Acceptance Contract

- Meet WCAG 2.1 AA color contrast for text, meaningful icons, badges, controls, and non-text UI boundaries. Validate the intended light and dark surfaces for both injected brands; a change that only passes the default Composer theme is incomplete.
- STRICT WCAG 2.1 AA COLOR-CONTRAST INVARIANT: NEVER use style={{ color: primary }} or style={{ color: secondary }} on any readable text. Brand primary (#E11D48) and secondary tokens do not meet the 4.5:1 threshold against white/dark surfaces.
- ALL readable text MUST use semantic Tailwind classes: `text-slate-900 dark:text-slate-100` for titles, body, and list items; `text-slate-800 dark:text-slate-200` for subtitles.
- Brand tokens belong exclusively in backgrounds (`backgroundColor: withAlpha(primary, '14')`), accent lines (`backgroundColor: primary`), borders, or decorative icons with `aria-hidden="true"`. Use semantic high-contrast foreground classes for readable text, such as text-slate-900 dark:text-slate-100. Brand tokens belong in borders, decorative icons, backgrounds, and text decoration unless their contrast is known to be sufficient.
- Every meaningful rounded card, callout, badge, pill, panel, or icon wrapper must retain a real visible perimeter in forced-colors active mode. Use an explicit class-based border or outline and forced-colors:!border-[ButtonText] (or a shared primitive that supplies it). Never use shadow, blur, tint, an alpha-only border, or inline borderColor as the sole boundary; inline borderColor can override the forced-colors utility.
- Only genuine controls may be keyboard-focusable. Do not add tabIndex, role="button", pointer cursors, hover affordances, or keyboard handlers to static editorial content just to satisfy a test.
- A block with no genuine controls is expected to report keyboard navigation as NOT_APPLICABLE in Project LLM browser evidence. A block with controls must provide native semantics (or an equivalent accessible role), keyboard operation, and a visible focus-visible indicator.
- Include focused unit coverage for semantic structure, accessible names where controls exist, contrast-safe foreground choices, visible boundaries, reduced motion, and responsive containment. Check both supplied brand themes and light/dark class behavior in unit evidence. Project LLM remains the authority for isolated browser, forced-colors, keyboard, axe-core, and six-width gates.
- Upload qualification runs a deterministic Accessibility Preflight before manifest generation, approval, or placement. It rejects direct brand-token foreground text, inline borderColor, alpha-only inline surface borders, and candidate-authored rounded bordered surfaces without a forced-colors perimeter. This preflight is an early defect filter, not a substitute for the Stage 6.5 browser audit.
- Do not label a candidate, README, test, or preview as Stage 6.5 verified, WCAG certified, or guaranteed to meet a specific contrast ratio before Project LLM attaches browser evidence. Candidate tests may assert intended semantics and token usage, but they must not present class-name checks as browser accessibility proof.

### Evidence and Ownership

External AI supplies the portable component, schemas, integration metadata, and focused unit tests. Project LLM is the only authority that runs qualification, placement, isolated browser verification, and certification. A candidate must not claim those gates have passed. The isolated browser gate measures document overflow, block overflow, and child-to-parent bounds at all six supported widths before certification can pass.

Evidence boundary: these requirements are checked through candidate tests, static qualification rules, and isolated Composer verification. They are not a claim of full WCAG certification until browser-level accessibility evidence is attached.
`;

export const DESIGN_SYSTEM_PARAMETER_COUNT = 12;
