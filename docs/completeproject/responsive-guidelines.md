# 🌐 Responsive Design Guidelines (FAANG-Level Standard)

## 📌 Purpose

This document defines the **mandatory responsive design standards** for all web pages and components.

All implementations MUST follow this to ensure:

* Consistent UI/UX across devices
* Accessibility compliance
* Production-grade quality

---

## 🎯 Core Principles

1. **Content-Driven Design**

   * Do NOT design for devices
   * Design based on where layout breaks

2. **Mobile-First Approach**

   * Start from smallest screen (320px)
   * Scale upwards

3. **Fluid Layouts Over Fixed Layouts**

   * Avoid hardcoded widths
   * Use flexible units

4. **Minimal Breakpoints**

   * Add breakpoints ONLY when necessary

---

## 📱 Standard Breakpoints (Reference Only)

| Label | Width  |
| ----- | ------ |
| XS    | 320px  |
| SM    | 375px  |
| MD    | 768px  |
| LG    | 1024px |
| XL    | 1280px |
| 2XL   | 1440px |
| 3XL   | 1920px |

> ⚠️ These are NOT strict rules — use content-based breakpoints.

---

## 🧱 Layout Rules

### ✅ Containers

```css
max-width: 1200px–1440px;
margin: 0 auto;
padding: 0 1rem;
```

### ❌ Avoid

* Fixed widths (`width: 1200px`)
* Absolute positioning for layout

---

## 🔤 Typography Rules

### Use fluid typography:

```css
font-size: clamp(14px, 2vw, 18px);
```

### Rules:

* No text overflow
* Maintain readability on all devices

---

## 📦 Spacing Rules

Use scalable units:

* `rem`
* `%`
* `clamp()`

❌ Avoid:

* Fixed pixel spacing everywhere

---

## 🧩 Grid & Flexbox Rules

### Use:

```css
display: flex;
flex-wrap: wrap;
```

```css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
```

### Ensure:

* Elements wrap properly
* No overlap

---

## 🖼 Image Rules

```css
max-width: 100%;
height: auto;
```

* No distortion
* Responsive loading preferred

---

## 🍔 Navigation (CRITICAL RULE)

### Content-Based Breakpoint (MANDATORY)

Navbar MUST switch to hamburger when:

* Items wrap to next line
* Spacing becomes crowded
* Layout looks visually broken
* Header height increases

### DO NOT:

* Use fixed breakpoint blindly (e.g. always 768px)

---

### ✅ Hamburger Behavior

* Visible before layout breaks
* Opens drawer/menu
* Fully accessible
* Smooth animation

---

## 📏 Responsive Testing Checklist

Every page MUST pass:

### Layout

* No horizontal scroll
* No overflow

### Typography

* Readable text
* No clipping

### Navigation

* Works on all sizes
* Hamburger works correctly

### Components

* Buttons clickable
* Forms usable
* Tables scroll properly

### Media

* Images scale correctly

---

## ♿ Accessibility Rules

* Touch targets ≥ 44px
* Keyboard navigation works
* Proper contrast ratios

---

## ⚡ Performance Rules

* Avoid layout shift (CLS)
* Optimize images
* Avoid unnecessary re-renders

---

## 🔁 Testing Process (MANDATORY)

1. Test at:

   * 320 → 1920px

2. Detect:

   * Overflow
   * Broken layouts

3. Fix:

   * Use fluid design

4. Re-test

---

## 🚫 Anti-Patterns (STRICTLY FORBIDDEN)

* Fixed-width layouts
* Excessive media queries
* Hidden overflow hacks
* Breaking desktop for mobile fixes
* Ignoring edge cases

---

## 🧠 Advanced Practices (FAANG-Level)

* Use `clamp()` for typography & spacing
* Prefer `auto-fit` grids
* Use container-based logic (not device-based)
* Test real devices when possible

---

## ✅ Definition of Done

A page is considered responsive ONLY if:

* Works from 320px → 1920px+
* No layout break
* No overflow
* Navbar behaves correctly
* Fully usable on all devices

---

## 🚀 Enforcement

* All PRs MUST pass responsive checks
* Playwright tests MUST pass
* Violations must be fixed before merge

---

## 📌 Summary

This standard ensures:

* Consistency across all products
* Scalable UI system
* FAANG-level quality assurance

FOLLOW THIS STRICTLY.
