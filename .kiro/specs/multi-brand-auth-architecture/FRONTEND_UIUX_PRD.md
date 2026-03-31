# Frontend UI/UX Product Requirements Document (PRD)
# Multi-Brand Authentication Architecture

**Version**: 1.0  
**Date**: March 30, 2026  
**Status**: Ready for Figma Design  
**Target**: Figma AI Design Generation

---

## 🎯 Executive Summary

This PRD defines the frontend UI/UX requirements for the multi-brand authentication architecture separating Real Tutorial Hub (RTH) and SkillUp IT Academy. The designs must be:

1. **Brand-Independent** - Flexible layout that adapts to brand theming
2. **Data-Driven** - UI structure independent of BFF/Backend data shape
3. **Embeddable** - Can be integrated into existing Next.js apps
4. **API-Ready** - Properly integrated with REST APIs

---

## 📋 Table of Contents

1. Design Principles
2. Existing UI/UX Analysis
3. Missing UI/UX Pages
4. New UI/UX Pages Required
5. Component Architecture
6. Brand Theming System
7. Data-Driven Layout System
8. API Integration Patterns
9. Figma Design Specifications
10. Implementation Sequence

---

## 1. Design Principles

### Core Principles

1. **Brand Agnostic Structure**
   - Layout and structure independent of brand
   - Brand identity applied via theming system
   - Same component library for both brands

2. **Data-Driven UI**
   - UI adapts to data shape from BFF
   - No hardcoded data structures
   - Flexible rendering based on API response

3. **Component Composition**
   - Small, reusable components
   - Composable layouts
   - Atomic design methodology

4. **Accessibility First**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus management

5. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: 640px, 768px, 1024px, 1280px
   - Touch-friendly interactions

---

## 2. Existing UI/UX Analysis

### ✅ What Already Exists

#### RTH (Real Tutorial Hub)

**Existing Pages**:
- ❌ Login page - Does NOT exist (needs to be created)
- ❌ Register page - Does NOT exist (needs to be created)
- ✅ Forgot password page - EXISTS (`apps/realtutorialhub-admin/src/app/(public)/forgot-password/page.tsx`)
- ✅ Reset password page - EXISTS (`apps/realtutorialhub-admin/src/app/(public)/reset-password/page.tsx`)
- ✅ Learning dashboard - EXISTS (`apps/realtutorialhub-web/src/app/(learning)/learn/`)
- ✅ Tutorial pages - EXISTS
- ✅ AI Tutor interface - EXISTS

**Existing Components**:
- ✅ Admin login form (reusable)
- ✅ Password reset form
- ✅ Forgot password form

**Brand Identity**:
- Primary Color: `#FF4B91` (Pink)
- Font: System fonts with bold tracking
- Style: Modern, tech-forward, AI-focused
- Tone: Innovative, self-paced, digital


#### SkillUp IT Academy

**Existing Pages**:
- ✅ Login page - EXISTS (`apps/skillup-web/src/app/login/page.tsx`)
- ✅ Register page - EXISTS (`apps/skillup-web/src/app/register/page.tsx`)
- ❌ Forgot password page - Does NOT exist (needs to be created)
- ❌ Reset password page - Does NOT exist (needs to be created)
- ❌ Email verification page - Does NOT exist (needs to be created)
- ✅ Student dashboard - EXISTS (`apps/skillup-web/src/app/student/page.tsx`)
- ✅ My Batch page - EXISTS
- ✅ Attendance page - EXISTS
- ✅ Payments page - EXISTS
- ✅ Placement page - EXISTS
- ✅ Programs page - EXISTS
- ✅ Faculty page - EXISTS

**Existing Components**:
- ✅ LoginForm component (`apps/skillup-web/src/components/auth/LoginForm.tsx`)
- ✅ RegisterForm component (`apps/skillup-web/src/components/auth/RegisterForm.tsx`)

**Brand Identity**:
- Primary Color: `#0EA5E9` (Cyan/Blue)
- Font: System fonts with rounded corners
- Style: Professional, approachable, training-focused
- Tone: Supportive, structured, mentor-driven

---

## 3. Missing UI/UX Pages

### 🔴 Critical Missing Pages (Must Create)

#### RTH (Real Tutorial Hub)

1. **Login Page** - `user.realtutorialhub.com/login`
   - Status: ❌ Does NOT exist
   - Priority: 🔴 Critical
   - Reason: Users cannot authenticate to RTH brand

2. **Register Page** - `user.realtutorialhub.com/register`
   - Status: ❌ Does NOT exist
   - Priority: 🔴 Critical
   - Reason: Users cannot create RTH accounts

3. **Email Verification Page** - `user.realtutorialhub.com/verify-email`
   - Status: ❌ Does NOT exist
   - Priority: 🔴 Critical
   - Reason: Users cannot verify their email

4. **Email Verification Success Page** - `user.realtutorialhub.com/verify-email/success`
   - Status: ❌ Does NOT exist
   - Priority: 🟡 Important
   - Reason: Confirmation after email verification

#### SkillUp IT Academy

1. **Forgot Password Page** - `user.skillupitacademy.com/forgot-password`
   - Status: ❌ Does NOT exist
   - Priority: 🔴 Critical
   - Reason: Users cannot recover their accounts

2. **Reset Password Page** - `user.skillupitacademy.com/reset-password`
   - Status: ❌ Does NOT exist
   - Priority: 🔴 Critical
   - Reason: Users cannot reset their passwords

3. **Email Verification Page** - `user.skillupitacademy.com/verify-email`
   - Status: ❌ Does NOT exist
   - Priority: 🔴 Critical
   - Reason: Users cannot verify their email

4. **Email Verification Success Page** - `user.skillupitacademy.com/verify-email/success`
   - Status: ❌ Does NOT exist
   - Priority: 🟡 Important
   - Reason: Confirmation after email verification

### 🟡 Important Missing Pages (Should Create)

#### Both Brands

1. **Account Locked Page** - `/account-locked`
   - Status: ❌ Does NOT exist
   - Priority: 🟡 Important
   - Reason: Inform users when account is locked due to failed attempts

2. **Session Management Page** - `/account/sessions`
   - Status: ❌ Does NOT exist
   - Priority: 🟡 Important
   - Reason: View and manage active sessions

3. **Profile Settings Page** - `/account/settings`
   - Status: ⚠️ Partial (exists in admin, not in user portal)
   - Priority: 🟡 Important
   - Reason: Update email, password, profile info

---

## 4. New UI/UX Pages Required

### Page Specifications

