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

### Strict 4-Color Brand Palette Enforcement (SUIA & RTH)

All tutorial blocks belong to a single cohesive tutorial page. Every block MUST strictly adhere to the 4 canonical brand tokens without introducing unapproved rainbow hues:
- Token 1 (primary): Deep Navy #0B1B3D on SUIA / Rose Red #E11D48 on RTH. Used for structural text, major headings, card titles, and dark console containers.
- Token 2 (secondary): Magenta Pink #F54A8D on SUIA / Slate Navy #1E293B on RTH. Used for eyebrow pills, block version badges, and Step 1 brand accents.
- Token 3 (accent1): Sky Cyan #0284C7 on SUIA / Indigo Blue #6366F1 on RTH. Used for technical information, code focus, Step 2 accents, and informational callout notes.
- Token 4 (accent2): Emerald Green #10B981 on SUIA / Amber Warm #F59E0B on RTH. Used for success checkmarks, completed outcomes, and Step 3 mastery accents.
- STRICT BAN ON UNAPPROVED COLORS: Do NOT introduce arbitrary orange, purple, yellow, red, or rainbow gradients. Multi-card grids (such as 6-step layouts) MUST cycle through the 3 functional accents (secondary, accent1, accent2) or differentiate via Lucide icons and semantic badges, NEVER by inventing rainbow colors.
- STRICT BAN ON 3D / CARTOON DECORATIONS: Production tutorial blocks must not include 3D floating graphics, mascot cartoons, or marketing illustrations. All visuals must be functional SVG icons from lucide-react.

### Bullet & List Numbering GUI Component Standards (Ordered & Unordered)

Every list component (ordered \`<ol>\` or unordered \`<ul>\`) rendered across any tutorial block MUST adhere to the unified 3-accent color system:
1. Ordered Lists & Stepper Numbers (\`<ol>\`):
   - Numbered step badges / counters MUST compose \`<StepBadge />\` or match its 3-accent cycle:
     * Steps 1, 4, 7... -> Brand Accent (Magenta Pink on SUIA / Rose Red on RTH)
     * Steps 2, 5, 8... -> Info Accent (Sky Cyan on SUIA / Indigo Blue on RTH)
     * Steps 3, 6, 9... -> Success Accent (Emerald Green on SUIA / Amber Warm on RTH)
   - Number badges must be filled circles with bold white text achieving WCAG AAA contrast and high-contrast system borders.
2. Unordered Lists & Bullet GUI Markers (\`<ul>\`):
   - Bullets must NEVER use default unstyled browser dots or arbitrary rainbow colors.
   - Bullet GUI markers (dots, checkmarks, dashes, or icon discs) must strictly use the harmonized brand token system:
     * Informational / detail bullets: Info Accent (Sky Cyan on SUIA / Indigo Blue on RTH)
     * Action / emphasis bullets: Brand Accent (Magenta Pink on SUIA / Rose Red on RTH)
     * Validation / outcome checkmarks: Success Accent (Emerald Green on SUIA / Amber Warm on RTH)
     * Multi-item generic bulleted lists: Cycle bullet marker colors predictably through the 3 brand accents (1: Brand, 2: Info, 3: Success, repeating) to establish visual cadence and harmony across all blocks.

### 3-Tier Elevation and Surface Invariant (Matching I1, C1, D1, S1)

To ensure seamless visual continuity across Introduction (I1), Code (C1), Definition (D1), and Summary (S1) blocks:
- Header Consistency: MUST compose \`<BlockHeader />\` with eyebrow pill, relevant Lucide icon, headingLevel="h1", titleScale="hero" (text-[clamp(34px,4vw,52px)] font-extrabold leading-[1.1] tracking-[-1.1px]), and showAccentBar={true} (rendering the signature w-12 h-1 rounded-full brand accent bar in primary theme color). Never hand-roll an asymmetrical header, never omit the accent bar, and never downgrade to titleScale="standard" for primary block titles.
- CardSurface Resting Elevation: Compose CardSurface with elevation="dashboard" for primary cards:
  * Resting: shadow-xl border-t border-white/80 dark:border-white/10 backdrop-blur-md bg-white/85 dark:bg-slate-900/85
  * Border: subtle perimeter border border-slate-200 dark:border-slate-800
- Callout Uniformity: Compose CalloutBanner (tone="info" | "takeaway") for all bottom notes, tips, and takeaways. Asymmetrical left-side borders (border-l-*) are strictly prohibited.

### Responsive Layout and Boundary Contract

This contract applies to every block family and version. It governs the block's
own DOM only; the host application owns page navigation, sidebars, authentication,
and Composer chrome.

- Compose the outer block with BlockShell, use w-full and min-w-0 on flex/grid children that contain text, and let text wrap or break rather than expand the page.
- A parent owns its padding, gap, width, and overflow. No child card, icon, control, image, code sample, table, or long string may touch, clip through, or extend beyond its parent border.
- Never use page-level horizontal scrolling to solve a block layout. Ordinary instructional tables, comparisons, revision matrices, timelines, and card grids MUST reflow into labelled stacked records/cards below their usable breakpoint rather than relying on a scrollbar. Horizontal scrolling is allowed only inside a clearly bounded, keyboard-accessible code/source region or a genuinely non-reflowable data surface.
- Use fluid grids and stacking layouts. Do not use fixed/minimum widths that assume the viewport has no host navigation or progress sidebar.
- Keep display text readable and controls usable from 375, 640, 768, 1024, 1280, and 1536 CSS-pixel widths. Test normal, long, and sparse content; do not depend on a single example payload.
- Keep typography, spacing, card boundaries, focus indicators, and touch targets intact at every supported width. Decorative transforms must not create clipping and must respect reduced-motion preferences.
- Do not add host-shell workarounds, global overflow rules, sidebars, or registry/Composer changes to the candidate package. Project LLM owns integration and verifies the placed block in an isolated worktree.

### Accessibility Acceptance Contract

- Meet WCAG 2.1 AA color contrast for text, meaningful icons, badges, controls, and non-text UI boundaries across both injected brand themes (SkillUp India Academy / SUIA and RealTutorialHub / RTH). Validate the intended light and dark surfaces for both injected brands; a change that only passes the default Composer theme is incomplete.
- STRICT WCAG 2.1 AA COLOR-CONTRAST INVARIANT: NEVER use raw brand tokens directly as thin readable body or subtitle text. Brand primary (#E11D48) and secondary tokens do not meet the 4.5:1 threshold against white/dark surfaces.
- Consistent Frame & Expressive Core: Maintain platform uniformity by using BlockShell, standard card radius ('rounded-2xl'), and high-contrast semantic body copy ('text-slate-900 dark:text-slate-100' for titles and 'text-slate-700 dark:text-slate-300' for descriptions).
- Vibrant, Contrast-Safe Badges & Accents:
  - Numbered step badges MUST use filled circle backgrounds mapped dynamically from the domain theme with bold white text ('text-white font-extrabold') and forced-colors borders.
  - Category and taxonomy pills MUST use soft pastel tinted backgrounds paired with deep, contrast-safe text (e.g., deep rose '#9f1239' on soft rose, deep blue '#1e3a8a' on soft blue, deep emerald '#064e3b' on soft green) to guarantee >= 4.5:1 contrast.
  - Decorative icons and outline wrappers MUST include 'aria-hidden="true"' and retain visible perimeters in forced-colors mode.
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
