# Frontend UI/UX Documentation
# Multi-Brand Authentication Architecture

**Version**: 1.0  
**Date**: March 30, 2026  
**Status**: Ready for Figma Design

---

## 📚 Document Index

### Core Documents

1. **01_DESIGN_PRINCIPLES.md** - Design principles and architecture
2. **02_EXISTING_ANALYSIS.md** - Analysis of existing UI/UX
3. **03_MISSING_PAGES_SPEC.md** - Specifications for missing pages (TO CREATE)
4. **04_FIGMA_DESIGN_SPEC.md** - Figma design requirements (TO CREATE)
5. **05_IMPLEMENTATION_SEQUENCE.md** - Implementation order (TO CREATE)
6. **06_API_INTEGRATION.md** - API integration patterns (TO CREATE)
7. **07_COMPONENT_LIBRARY.md** - Shared component specifications (TO CREATE)

---

## 🎯 Quick Summary

### What Exists

**RTH (Real Tutorial Hub)**:
- ✅ Admin login, forgot password, reset password
- ❌ User login, register, email verification

**SkillUp IT Academy**:
- ✅ User login, register, student dashboard
- ❌ Forgot password, reset password, email verification

### What's Missing (Critical)

**Both Brands Need**:
1. Email verification pages
2. Email verification success pages
3. Account locked pages
4. Session management pages

**RTH Needs**:
1. User login page
2. User register page

**SkillUp Needs**:
1. Forgot password page
2. Reset password page

---

## 🎨 Design Approach

### Brand-Independent Structure

All pages use the same component structure with brand-specific theming:

```typescript
// Same component, different themes
<LoginPage brand="rth" />      // Pink theme
<LoginPage brand="skillup" />  // Cyan theme
```

### Data-Driven UI

UI adapts to API response shape:

```typescript
// API returns field configuration
const fields = await api.getLoginFields(brand);

// UI renders based on configuration
<DynamicForm fields={fields} />
```

### Component Composition

Build from small, reusable pieces:

```
Atoms → Molecules → Organisms → Templates → Pages
```

---

## 📋 Missing Pages Summary

### Priority 🔴 Critical (Must Create Before Launch)

#### RTH User Portal

1. **Login Page** - `user.realtutorialhub.com/login`
   - Email/password form
   - Show/hide password
   - Error handling
   - Redirect after login
   - "Forgot password?" link
   - "Create account" link

2. **Register Page** - `user.realtutorialhub.com/register`
   - Name, email, password form
   - Password strength indicator
   - Terms acceptance checkbox
   - Error handling
   - Auto-login after registration

3. **Email Verification Page** - `user.realtutorialhub.com/verify-email`
   - Token validation
   - Success/error messages
   - Resend verification link
   - Redirect to login

#### SkillUp User Portal

1. **Forgot Password Page** - `user.skillupitacademy.com/forgot-password`
   - Email input
   - Success message
   - Back to login link
   - Rate limiting message

2. **Reset Password Page** - `user.skillupitacademy.com/reset-password`
   - Token validation
   - New password input
   - Confirm password input
   - Password strength indicator
   - Success/error messages

3. **Email Verification Page** - `user.skillupitacademy.com/verify-email`
   - Token validation
   - Success/error messages
   - Resend verification link
   - Redirect to login

---

## 🎨 Figma Design Requirements

### Design System Tokens

**Colors** (Brand-specific):
```css
/* RTH */
--primary: #FF4B91;
--secondary: #1A1A1A;
--accent: #FF6B9D;

/* SkillUp */
--primary: #0EA5E9;
--secondary: #0F172A;
--accent: #38BDF8;
```

**Typography**:
```css
--font-family: system-ui, -apple-system, sans-serif;
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 1.875rem;
```

**Spacing**:
```css
--spacing-1: 0.25rem;
--spacing-2: 0.5rem;
--spacing-3: 0.75rem;
--spacing-4: 1rem;
--spacing-6: 1.5rem;
--spacing-8: 2rem;
```

**Border Radius**:
```css
--radius-sm: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--radius-xl: 1.5rem;
--radius-2xl: 2rem;
--radius-full: 9999px;
```

### Component Specifications

**Input Field**:
- Height: 44px (touch-friendly)
- Padding: 12px 16px
- Border: 1px solid
- Border radius: var(--radius-xl)
- Focus: 2px ring, brand color

**Button**:
- Height: 44px minimum
- Padding: 12px 24px
- Border radius: var(--radius-full)
- Font weight: 700 (bold)
- Shadow: Brand-specific

**Form Layout**:
- Max width: 400px
- Spacing between fields: 16px
- Label above input
- Error message below input

### Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 🔧 Implementation Sequence

### Week 1: Create Missing Auth Pages

**Day 1-2: RTH User Login & Register**
1. Create `apps/realtutorialhub-user/src/app/login/page.tsx`
2. Create `apps/realtutorialhub-user/src/app/register/page.tsx`
3. Extract LoginForm component to `packages/ui/`
4. Extract RegisterForm component to `packages/ui/`
5. Add RTH brand theming

**Day 3-4: SkillUp Password Recovery**
1. Create `apps/skillup-web/src/app/forgot-password/page.tsx`
2. Create `apps/skillup-web/src/app/reset-password/page.tsx`
3. Extract ForgotPasswordForm to `packages/ui/`
4. Extract ResetPasswordForm to `packages/ui/`
5. Add SkillUp brand theming

**Day 5: Email Verification (Both Brands)**
1. Create `packages/ui/src/EmailVerificationPage.tsx`
2. Add to RTH: `apps/realtutorialhub-user/src/app/verify-email/page.tsx`
3. Add to SkillUp: `apps/skillup-web/src/app/verify-email/page.tsx`
4. Create success pages for both brands

### Week 2: Enhance & Polish

**Day 6-7: Account Locked Pages**
1. Create `packages/ui/src/AccountLockedPage.tsx`
2. Add to both brands
3. Add unlock request functionality

**Day 8-9: Session Management**
1. Create `packages/ui/src/SessionManagementPage.tsx`
2. List active sessions
3. Logout from specific session
4. Logout from all sessions

**Day 10: Testing & Polish**
1. Accessibility testing
2. Responsive testing
3. Cross-browser testing
4. Performance optimization

---

## 📊 Component Reusability Strategy

### Shared Components (packages/ui/)

**Auth Components**:
- `<LoginForm brand={brand} />`
- `<RegisterForm brand={brand} />`
- `<ForgotPasswordForm brand={brand} />`
- `<ResetPasswordForm brand={brand} />`
- `<EmailVerificationPage brand={brand} />`
- `<AccountLockedPage brand={brand} />`

**Layout Components**:
- `<AuthLayout brand={brand}>`
- `<DashboardLayout brand={brand}>`
- `<PortalLayout brand={brand}>`

**UI Components**:
- `<Button variant={...} />`
- `<Input type={...} />`
- `<FormField label={...} />`
- `<Card />`
- `<Alert type={...} />`

### Brand-Specific Pages (apps/)

**RTH User Portal** (`apps/realtutorialhub-user/`):
- `/login` - Uses `<LoginForm brand="rth" />`
- `/register` - Uses `<RegisterForm brand="rth" />`
- `/verify-email` - Uses `<EmailVerificationPage brand="rth" />`

**SkillUp User Portal** (`apps/skillup-web/`):
- `/login` - Uses `<LoginForm brand="skillup" />`
- `/register` - Uses `<RegisterForm brand="skillup" />`
- `/verify-email` - Uses `<EmailVerificationPage brand="skillup" />`

---

## 🔌 API Integration Pattern

### Data Fetching

```typescript
// Client-side fetching
const { data, error, isLoading } = useAuth({
  endpoint: '/auth/login',
  method: 'POST',
  body: { email, password, platform: brand },
});

// Server-side fetching
const data = await fetchAuthApi('/auth/login', {
  method: 'POST',
  body: { email, password, platform: brand },
});
```

### Error Handling

```typescript
try {
  const response = await api.login(email, password, brand);
  // Success
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    setError('Invalid email or password');
  } else if (error.code === 'ACCOUNT_LOCKED') {
    router.push('/account-locked');
  } else {
    setError('An error occurred. Please try again.');
  }
}
```

### Loading States

```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="mr-2" />
      Signing in...
    </>
  ) : (
    'Sign In'
  )}
</Button>
```

---

## ✅ Success Criteria

### Functional Requirements

- [ ] All missing pages created
- [ ] Brand theming works correctly
- [ ] API integration functional
- [ ] Error handling comprehensive
- [ ] Loading states implemented
- [ ] Redirects work correctly

### Non-Functional Requirements

- [ ] WCAG 2.1 AA compliant
- [ ] Responsive on all devices
- [ ] Fast initial load (< 2s)
- [ ] Smooth animations
- [ ] Cross-browser compatible
- [ ] SEO optimized

### User Experience

- [ ] Clear visual feedback
- [ ] Helpful error messages
- [ ] Intuitive navigation
- [ ] Consistent branding
- [ ] Professional appearance
- [ ] Trust-building design

---

## 📞 Next Steps

1. **Review this documentation** with design team
2. **Create Figma designs** based on specifications
3. **Get stakeholder approval** on designs
4. **Start Week 1 implementation** (RTH login/register)
5. **Follow implementation sequence** day by day

---

## 📚 Additional Resources

- **Design Principles**: `01_DESIGN_PRINCIPLES.md`
- **Existing Analysis**: `02_EXISTING_ANALYSIS.md`
- **Gap Analysis**: `../GAP_ANALYSIS.md`
- **Implementation Priority**: `../IMPLEMENTATION_PRIORITY.md`

---

**Last Updated**: March 30, 2026  
**Status**: Ready for Figma Design  
**Timeline**: 2 weeks for all missing pages
