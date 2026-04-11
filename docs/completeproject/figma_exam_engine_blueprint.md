# 🎨 Figma AI Exam Engine UI/UX Master Blueprint

> **AI DESIGN INSTRUCTIONS**: Generate a high-fidelity Figma UI design for the Exam Engine. This design must seamlessly integrate with the existing Landing Pages and `Start Learning` Gateways found at `http://localhost:3003` (RTH) and `http://localhost:3004` (SkillUp). You must construct the architecture per the `BRAND_AGNOSTIC_ARCHITECTURE.md` model, meaning the layout remains identical but color/text tokens are dynamic.

---

## 🏗️ 1. Core Architectural Aesthetics
* **Visual Continuity**: Carry over the modern SaaS, glassmorphic aesthetic defined in the `START_LEARNING_GATEWAY_PRD.md`.
* **Zero Horizontal Scroll**: Strictly enforce responsivity bounds per `responsive-guidelines.md` down to the `320px` mobile baseline.
* **Proportions**: Use absolute professional sizing. The Header is exactly `60px` tall. The Action Bar Footer is exactly `64px` tall. Action targets (buttons) must be a minimum of `44px` height for touch compliance.

---

## 🎨 2. The Dynamic Brand Config Dictionary
Based directly on the `src/share-branding/brandConfig.ts` codebase, your Figma variables must support these two strict themes:

### **Theme Variant A: RealTutorialHub**
An energetic, premium developer platform tone.
* **Primary Accent**: `#d03f00` (Deep Orange)
* **Dark Primary Hover**: `#b63600`
* **Secondary Base**: `#124fd6` (Deep Blue)

### **Theme Variant B: SkillUp IT Academy**
A strictly professional, corporate training academy tone.
* **Primary Accent**: `#f54a8d` (Bright Pink)
* **Dark Primary Hover**: `#d63d7a`
* **Secondary Base**: `#133382` (Navy Blue)

*(Note: The Elite Action Bar base background is uniformly `#0d2561` across both platforms to lock in the "Pro Console" feeling, regardless of brand).*

---

## 🧩 3. Component Hierarchy & Positioning Matrix
Based on the `V3.11 Elite Sandbox`, map these precise components into the Figma layout:

### **3.1 Global Header (Top Anchor)**
* **Height & Background**: `h-[60px]`, Glassmorphic Pure White (`backdrop-blur` / `white/95`), bottom border `1px solid #e2e8f0`.
* **Left**: Brand SVG Icon (Tinted with `Primary Accent`) + Brand Name Typography (Outfit Font, `800 Weight`).
* **Center**: Assessment Pulse Timer. Must feature a pulsating Red dot (`#ef4444`) simulating active biometric testing.
* **Right**: Student Profile Cluster.

### **3.2 Workspace "CODE IS KING" (Center Stage Vertical Split)**
* **Desktop Layout**: A strict 50% / 50% vertical split screen.
* **Left Pane (Expert Inquiry)**: 
  * Background: Pure White (`#ffffff`).
  * Upper Label: "EXPERT INQUIRY 0X" (uppercase, spacing, muted `#94a3b8`).
  * Question Text: High density `H2` (`Outfit`, `#0f172a`).
* **Right Pane (Decision Space)**:
  * Background: Slight off-white contrast (`#fdfdfe`).
  * Option Stack: A vertical flow of clickable cards. 
  * *Card Selected States*: Border switches to `Primary Accent`. Background shifts to a very faint tint of the Primary color (`#fdf2ed` for RTH, `#f0f4ff` for SkillUp).

### **3.3 Code Editor Components (Replacing basic `<pre>` tags)**
Instead of raw `<pre>` wireframes, the Figma AI must render high-fidelity **Syntax Highlighter / IDE Components** (e.g., mimicking Monaco Editor or Prism.js) when code is present:
* **Background**: Deep Slate (`#0f172a`) or Bright IDE Gray (`#f8fafc`).
* **Left Border Accents**: A thick `4px solid Primary Accent` border locking the code frame.
* **Typography**: Monospace `Fira Code` or `JetBrains Mono`.
* **Structural Overflow**: The editor component *must* have native scrollbars if logic exceeds 15+ lines, ensuring the 50/50 page split never violently shifts.

### **3.4 The Elite Action Bar (Footer)**
* **Height & Background**: `h-[64px]`, Solid Dark Blue (`#0d2561`).
* **Left Flex Node**: 
  * **"Legend & Navigator" Button**: Ghost button. Inside, stack 3 horizontal dots (Red `#ff5f56`, Yellow `#ffbd2e`, Green `#27c93f`) simulating a Mac window.
  * **"Mark for Review" Button**: Ghost outline.
* **Center Flex Node (Adjacent Grouping)**: 
  * **"Previous" Button**: Ghost outline, Left icon.
  * **"Save & Next" Button**: Solid `Primary Accent` button, Right icon.
* **Right Flex Node**: 
  * **"Submit Assessment" Button**: Solid White bg, Dark Blue text, heavy font weight.

### **3.5 The High-Reliability Root Popover (Navigator Utility)**
* **Position**: Floating absolute panel (`bottom: 80px`, `left: 32px`). Above the footer. Width `~340px`.
* **Elevation**: Heavy drop shadow (`0 30px 60px rgba(0,0,0,0.3)`).
* **Header**: Contains the Mac OS Dots (Red/Yellow/Green).
* **Internal Grid**: 5-column CSS grid displaying numbered cells (01 to 15).
  * Completed: Green (`#10b981`). Marked: Amber (`#f59e0b`). Current: `Primary Accent` border.

---

## 🛠️ 4. Data Permutations Scenarios
The designer must supply frames proving the **50/50 Split** accommodates these 4 critical UI states seamlessly. *Show exactly how the advanced Code Editor component scales vs plain text.*

1. **Standalone Theory: Text -> Text**
   * Left: Pure text paragraph. Right: Options are pure text strings with Radio selection dots.
2. **Diagnostic Evaluation: Code -> Text**
   * Left: Question text + Large `Code Editor Component`. Right: Pure text with Radios.
3. **Refactoring Test: Text -> Code**
   * Left: Single sentence question. Right: Option cards contain Mini `Code Editor Components`. Uses Checkbox (`[✓]`) geometry for multiple-select.
4. **Zenith Mode: Code -> Code**
   * Left: Massive `Code Editor Component`. Right: Option cards ALSO contain Mini `Code Editor Components`.

---
**End Blueprint Directive.**
