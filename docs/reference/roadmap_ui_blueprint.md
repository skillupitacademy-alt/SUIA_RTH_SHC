# UI/UX Blueprint: Million User Roadmap Tab
*Phase 14: Radical Transparency & Executive Visibility*

## 📜 Design Objective
To transform complex architectural documents into a premium, interactive "Mission Control" experience for admins, ensuring total visibility into the platform's hyper-scale readiness.

---

## 🎨 Design Tokens (Light Theme Only)
- **Primary Accent**: `#FF4B91` (Vibrant Pink)
- **Background**: `#FFFFFF` (Solid White)
- **Surface**: `slate-50` (Very Light Gray)
- **Borders**: `slate-200` (Thin, clean lines)
- **Typography**: `Outfit` (Headings, Black weight) / `Inter` (Body, Medium weight)

---

## 🏗️ Component Structure

### 1. The Tab Switcher (`RoadmapTabTrigger`)
- Located below the main header.
- **Style**: Pill-shaped button group.
- **States**: 
    - `Active`: BG: `#FF4B91`, Text: `White`, Shadow: `Pink/30`.
    - `Inactive`: BG: `Transparent`, Text: `Slate-400`, Hover BG: `Slate-50`.

### 2. The Phase Grid (`PhaseCardGrid`)
- A 3-column layout (Desktop) / 1-column (Mobile).
- **Phase Card Interaction**:
    - **Hover**: Scale `1.02`, Shadow: `2xl` (Slate-200/50).
    - **Header**: Large Phase ID (e.g., "P11") in Primary accent.
    - **Body**: Title (Bold, Uppercase) + layman description.
    - **Footer**: "View Technical Blueprint" Link with `ArrowRight` icon.

### 3. The Blueprint Drawer (`RoadmapDrawer`)
- A slide-out panel from the right.
- **Top Section**: Phase Title + Layman Summary.
- **Middle Section (Tabs)**:
    - **Blueprint**: Rendered Markdown of the technical strategy.
    - **Implementation**: The "Copyable" AI Prompt block.
- **Bottom Section**: "Copy to Clipboard" button for the AI prompt.

---

## 🛠️ Layman Mission Mappings (Card Content)
*Examples of the 13 card summaries:*
- **Phase 09 (Resilience)**: "Electronic Armor for your site. Shields the exam-taking mission by automatically turning off secondary features during massive traffic spikes."
- **Phase 11 (Sharding)**: "Infinite Filing System. Automatically splits billions of student records across multiple servers so looking up a result is always instant."
- **Phase 13 (FinOps)**: "The Fuel Gauge. Automatically monitors costs and shuts down expensive AI features if your budget is almost empty."

---

## 🏁 Quality Standards
- **Zero Dark Mode**: All components must use pure white backgrounds.
- **No Scrolling Drawers**: Use pagination or clear sections within the sidebar to keep content organized.
- **Premium Animations**: Use `framer-motion` for the drawer slide-in (spring physics) and card hover transitions.

*Document Version: 1.0 (Roadmap UI Release)*
