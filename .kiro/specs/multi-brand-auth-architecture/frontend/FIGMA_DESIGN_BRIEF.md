# Figma Design Brief
# Multi-Brand Authentication UI/UX

**Version**: 1.0  
**Date**: March 30, 2026  
**For**: Figma AI Design Generation  
**Project**: Multi-Brand Auth Architecture

---

## 🎯 Design Brief Summary

Create embeddable, brand-independent authentication UI/UX for two brands:
- **RTH (Real Tutorial Hub)** - AI tutor-based learning platform
- **SkillUp IT Academy** - Physical faculty-based training center

**Key Requirements**:
1. Same layout structure, different brand theming
2. Data-driven, flexible components
3. Embeddable in existing Next.js apps
4. Mobile-first, responsive design
5. WCAG 2.1 AA accessible

---

## 📋 Pages to Design

### 🔴 Critical Priority (Design First)

1. **Login Page** (Both brands)
2. **Register Page** (Both brands)
3. **Forgot Password Page** (Both brands)
4. **Reset Password Page** (Both brands)
5. **Email Verification Page** (Both brands)

### 🟡 Important Priority (Design Second)

6. **Email Verification Success Page** (Both brands)
7. **Account Locked Page** (Both brands)
8. **Session Management Page** (Both brands)

---

## 🎨 Brand Identity

### RTH (Real Tutorial Hub)

**Brand Personality**:
- Modern, tech-forward, innovative
- AI-focused, digital-first
- Self-paced learning
- Young, dynamic, cutting-edge

**Color Palette**:
```css
Primary:    #FF4B91  /* Pink */
Secondary:  #1A1A1A  /* Dark Gray */
Accent:     #FF6B9D  /* Light Pink */
Background: #FFFFFF  /* White */
Surface:    #F8F9FB  /* Light Gray */
Text:       #1A1A1A  /* Dark Gray */
Text Muted: #64748B  /* Slate */
Success:    #10B981  /* Green */
Error:      #EF4444  /* Red */
Warning:    #F59E0B  /* Amber */
```

**Typography**:
```css
Font Family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Headings: 700-900 (Bold to Black)
Body: 400-600 (Regular to Semibold)
Labels: 700-900 (Bold to Black), UPPERCASE, wide tracking
```

**Design Style**:
- Border Radius: Large (16px-32px)
- Shadows: Prominent, colored (pink tint)
- Spacing: Generous, airy
- Animations: Scale on hover, smooth transitions
- Icons: Lucide React (modern, minimal)

**Example Components**:
- Buttons: Rounded-full, bold text, pink gradient shadow
- Inputs: Rounded-xl, thick border, focus ring
- Cards: Rounded-2xl, subtle shadow
- Alerts: Rounded-xl, colored background

---

### SkillUp IT Academy

**Brand Personality**:
- Professional, approachable, supportive
- Training-focused, mentor-driven
- Structured learning, career-oriented
- Trustworthy, established, reliable

**Color Palette**:
```css
Primary:    #0EA5E9  /* Cyan */
Secondary:  #0F172A  /* Dark Blue */
Accent:     #38BDF8  /* Light Cyan */
Background: #FFFFFF  /* White */
Surface:    #F8F9FB  /* Light Gray */
Text:       #0F172A  /* Dark Blue */
Text Muted: #64748B  /* Slate */
Success:    #10B981  /* Green */
Error:      #EF4444  /* Red */
Warning:    #F59E0B  /* Amber */
```

**Typography**:
```css
Font Family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Headings: 700-800 (Bold to Extrabold)
Body: 400-600 (Regular to Semibold)
Labels: 600-700 (Semibold to Bold), Sentence case
```

**Design Style**:
- Border Radius: Very large (16px-full)
- Shadows: Soft, diffused (cyan tint)
- Spacing: Comfortable, balanced
- Animations: Smooth, professional
- Icons: Lucide React (clean, friendly)

**Example Components**:
- Buttons: Rounded-full, semibold text, cyan soft shadow
- Inputs: Rounded-2xl, thin border, subtle focus ring
- Cards: Rounded-2xl, soft shadow
- Alerts: Rounded-2xl, light colored background

---

## 📐 Layout Specifications

### Page Layout Structure

```
┌─────────────────────────────────────┐
│           Header/Logo               │
├─────────────────────────────────────┤
│                                     │
│         Main Content Area           │
│                                     │
│  ┌───────────────────────────┐      │
│  │                           │      │
│  │      Form Container       │      │
│  │                           │      │
│  │  ┌─────────────────────┐  │      │
│  │  │                     │  │      │
│  │  │   Form Fields       │  │      │
│  │  │                     │  │      │
│  │  └─────────────────────┘  │      │
│  │                           │      │
│  │  ┌─────────────────────┐  │      │
│  │  │   Submit Button     │  │      │
│  │  └─────────────────────┘  │      │
│  │                           │      │
│  └───────────────────────────┘      │
│                                     │
│         Helper Links                │
│                                     │
├─────────────────────────────────────┤
│            Footer                   │
└─────────────────────────────────────┘
```

### Responsive Breakpoints

**Mobile** (< 640px):
- Single column layout
- Full-width form (with padding)
- Stacked elements
- Touch-friendly (44px minimum)

**Tablet** (640px - 1024px):
- Centered form (max-width: 500px)
- Side padding increases
- Larger typography

**Desktop** (> 1024px):
- Centered form (max-width: 400px)
- Maximum side padding
- Optional sidebar/illustration

---

## 📄 Page Specifications

### 1. Login Page

**URL**: 
- RTH: `user.realtutorialhub.com/login`
- SkillUp: `user.skillupitacademy.com/login`

**Layout**:
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Welcome Back                       │
│  Sign in to continue                │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [Icon] Secure Entry          │   │
│  │ Sign in with your credentials│   │
│  └──────────────────────────────┘   │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐    │
│  │ [Mail Icon] you@example.com │    │
│  └─────────────────────────────┘    │
│                                     │
│  Password          [Forgot?]        │
│  ┌─────────────────────────────┐    │
│  │ [Lock Icon] ••••••• [Eye]   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Error Message if any]             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       Sign In               │    │
│  └─────────────────────────────┘    │ 
│                                     │
│  Need an account? [Create account]  │
└─────────────────────────────────────┘
```

**Components**:
1. Logo (brand-specific)
2. Heading: "Welcome Back" (h1, 2xl-3xl)
3. Subheading: "Sign in to continue" (text-sm, muted)
4. Info banner with icon
5. Email input with icon
6. Password input with show/hide toggle
7. Forgot password link (right-aligned)
8. Error alert (conditional)
9. Submit button (full-width, primary color)
10. Sign up link (centered)

**States**:
- Default
- Loading (button shows spinner)
- Error (red alert banner)
- Success (redirect)

**Interactions**:
- Email validation on blur
- Password show/hide toggle
- Form submission
- Redirect after success

---

### 2. Register Page

**URL**:
- RTH: `user.realtutorialhub.com/register`
- SkillUp: `user.skillupitacademy.com/register`

**Layout**:
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Create Your Account                │
│  Join thousands of learners         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [Icon] Get Started          │    │
│  │ Create your learner profile │    │
│  └─────────────────────────────┘    │
│                                     │
│  Full Name                          │
│  ┌─────────────────────────────┐    │
│  │ [User Icon] John Doe        │    │
│  └─────────────────────────────┘    │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐    │
│  │ [Mail Icon] you@example.com │    │
│  └─────────────────────────────┘    │
│                                     │
│  Password                           │
│  ┌─────────────────────────────┐    │
│  │ [Lock Icon] ••••••• [Eye]   │    │
│  └─────────────────────────────┘    │
│  [Password Strength Indicator]      │
│                                     │
│  □ I agree to Terms & Privacy       │
│                                     │
│  [Error Message if any]             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Create Account          │    │
│  └─────────────────────────────┘    │
│                                     │
│  Already have an account? [Sign in] │
└─────────────────────────────────────┘
```

**Components**:
1. Logo
2. Heading: "Create Your Account"
3. Subheading: "Join thousands of learners"
4. Info banner
5. Name input with icon
6. Email input with icon
7. Password input with show/hide toggle
8. Password strength indicator (weak/medium/strong)
9. Terms checkbox
10. Error alert (conditional)
11. Submit button
12. Sign in link

**Password Strength Indicator**:
```
Weak:     [▓░░░] Weak
Medium:   [▓▓▓░] Medium
Strong:   [▓▓▓▓] Strong
```

---

### 3. Forgot Password Page

**URL**:
- RTH: `user.realtutorialhub.com/forgot-password`
- SkillUp: `user.skillupitacademy.com/forgot-password`

**Layout**:
```
┌─────────────────────────────────────┐
│  [← Back to Login]                  │
│                                     │
│  Forgot Password?                   │
│  No worries, we'll send you reset   │
│  instructions                       │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐    │
│  │ [Mail Icon] you@example.com │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Success/Error Message if any]     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Send Reset Link          │    │
│  └─────────────────────────────┘    │
│                                     │
│  Remember password? [Sign in]       │
└─────────────────────────────────────┘
```

**Success State**:
```
┌────────────────────────────────────┐
│  [✓ Icon]                                                                                
│                                    │
│  Check Your Email                  │
│  We've sent password reset         │
│  instructions to your@example.com  │
│                                    │
│  Didn't receive? [Resend]          │
│                                    │
│  ┌─────────────────────────────┐   │
│  │    Return to Login          │   │
│  └─────────────────────────────┘   │
└────────────────────────────────────┘
```

---

### 4. Reset Password Page

**URL**:
- RTH: `user.realtutorialhub.com/reset-password?token=xxx`
- SkillUp: `user.skillupitacademy.com/reset-password?token=xxx`

**Layout**:
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Reset Your Password                │
│  Enter your new password below      │
│                                     │
│  New Password                       │
│  ┌─────────────────────────────┐    │
│  │ [Lock Icon] ••••••• [Eye]   │    │
│  └─────────────────────────────┘    │
│  [Password Strength Indicator]      │
│                                     │
│  Confirm Password                   │
│  ┌─────────────────────────────┐    │
│  │ [Lock Icon] ••••••• [Eye]   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Error Message if any]             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Reset Password           │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Success State**:
```
┌─────────────────────────────────────┐
│  [✓ Icon]                           
│                                     │
│  Password Reset Successful          │
│  Your password has been updated     │
│                                     │
│  Redirecting to login in 5s...      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Sign In Now              │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

### 5. Email Verification Page

**URL**:
- RTH: `user.realtutorialhub.com/verify-email?token=xxx`
- SkillUp: `user.skillupitacademy.com/verify-email?token=xxx`

**Loading State**:
```
┌─────────────────────────────────────┐
│  [Spinner]                          │
│                                     │
│  Verifying Your Email               │
│  Please wait...                     │
└─────────────────────────────────────┘
```

**Success State**:
```
┌─────────────────────────────────────┐
│  [✓ Icon]                           
│                                     │
│  Email Verified!                    │
│  Your email has been successfully   │
│  verified                           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Continue to Dashboard    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Error State**:
```
┌─────────────────────────────────────┐
│  [✗ Icon]                          
│                                     │
│  Verification Failed                │
│  This link is invalid or expired    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Resend Verification      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Back to Login]                    │
└─────────────────────────────────────┘
```

---

## 🎨 Component Library

### Buttons

**Primary Button**:
```
Width: Full or auto
Height: 44px minimum
Padding: 12px 24px
Border Radius: 9999px (full)
Font Weight: 700
Font Size: 14px
Text Transform: None
Background: Primary color
Text Color: White
Shadow: Colored (brand-specific)
Hover: Scale 1.02, darker background
Active: Scale 0.98
Disabled: Opacity 0.6, no hover
```

**Secondary Button**:
```
Same as primary but:
Background: Transparent
Border: 1px solid primary
Text Color: Primary
Hover: Light primary background
```

**Text Button**:
```
No background, no border
Text Color: Primary
Font Weight: 600
Hover: Underline
```

### Input Fields

**Text Input**:
```
Width: Full
Height: 44px
Padding: 12px 16px (48px left if icon)
Border: 1px solid #E2E8F0
Border Radius: 16px (xl)
Font Size: 14px
Background: White
Focus: 2px ring, primary color
Error: Red border, red ring
Icon: 20px, left-aligned, 16px from left
```

**Password Input**:
```
Same as text input plus:
Toggle button: Right-aligned, 16px from right
Toggle icon: Eye/EyeOff, 20px
```

### Form Field

**Structure**:
```
Label (above input)
  Font Size: 14px
  Font Weight: 600
  Color: Text color
  Margin Bottom: 8px

Input (main field)

Help Text (below input, optional)
  Font Size: 12px
  Color: Muted
  Margin Top: 4px

Error Message (below input, conditional)
  Font Size: 12px
  Color: Red
  Margin Top: 4px
```

### Alerts

**Info Alert**:
```
Background: Primary/10
Border: 1px solid Primary/20
Border Radius: 16px
Padding: 12px 16px
Icon: Info circle, 20px
Text: 14px, Primary color
```

**Success Alert**:
```
Background: Green/10
Border: 1px solid Green/20
Text Color: Green
Icon: Check circle
```

**Error Alert**:
```
Background: Red/10
Border: 1px solid Red/20
Text Color: Red
Icon: X circle
```

**Warning Alert**:
```
Background: Amber/10
Border: 1px solid Amber/20
Text Color: Amber
Icon: Alert triangle
```

---

## 📱 Responsive Design

### Mobile (< 640px)

- Form width: 100% (with 16px padding)
- Font sizes: Slightly smaller
- Touch targets: 44px minimum
- Spacing: Reduced but comfortable
- Single column layout

### Tablet (640px - 1024px)

- Form width: Max 500px, centered
- Font sizes: Base
- Spacing: Standard
- Optional two-column for some fields

### Desktop (> 1024px)

- Form width: Max 400px, centered
- Font sizes: Base or slightly larger
- Spacing: Generous
- Optional sidebar with illustration

---

## ♿ Accessibility Requirements

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Visible focus indicators (2px ring)
- Enter to submit forms
- Escape to close modals

### Screen Readers

- Semantic HTML (form, label, input, button)
- ARIA labels where needed
- Error announcements (aria-live)
- Loading state announcements

### Color Contrast

- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum
- Don't rely on color alone

### Focus Management

- Focus trap in modals
- Focus restoration after actions
- Skip links for navigation
- Clear focus indicators

---

## 🚀 Figma Deliverables

### Required Frames

For each page, create:

1. **Desktop** (1440px width)
   - Default state
   - Loading state
   - Success state
   - Error state

2. **Tablet** (768px width)
   - Default state
   - Error state

3. **Mobile** (375px width)
   - Default state
   - Error state

### Component Library

Create reusable components:
- Button (primary, secondary, text)
- Input (text, email, password)
- Form field (with label, help text, error)
- Alert (info, success, error, warning)
- Card
- Logo (both brands)
- Icons (from Lucide React)

### Design Tokens

Export as CSS variables:
- Colors (both brands)
- Typography
- Spacing
- Border radius
- Shadows

### Prototypes

Create interactive prototypes showing:
- Form validation
- Loading states
- Success/error flows
- Navigation between pages

---

## ✅ Design Checklist

Before finalizing designs:

- [ ] All pages designed for both brands
- [ ] All states covered (default, loading, success, error)
- [ ] Responsive designs for mobile, tablet, desktop
- [ ] Component library created
- [ ] Design tokens exported
- [ ] Accessibility annotations added
- [ ] Interactive prototypes created
- [ ] Stakeholder review completed
- [ ] Developer handoff ready

---

## 📞 Next Steps

1. **Review this brief** with design team
2. **Create Figma designs** following specifications
3. **Get stakeholder approval** on designs
4. **Export design tokens** as CSS variables
5. **Create component library** in Figma
6. **Hand off to developers** with annotations

---

**Last Updated**: March 30, 2026  
**Status**: Ready for Figma Design  
**Timeline**: 1 week for all designs
