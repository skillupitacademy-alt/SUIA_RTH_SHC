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

Evidence boundary: these requirements are checked through candidate tests, static qualification rules, and isolated Composer verification. They are not a claim of full WCAG certification until browser-level accessibility evidence is attached.
`;

export const DESIGN_SYSTEM_PARAMETER_COUNT = 12;
