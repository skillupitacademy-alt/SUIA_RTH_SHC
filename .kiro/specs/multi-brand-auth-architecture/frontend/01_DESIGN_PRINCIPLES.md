# Frontend UI/UX Design Principles
# Multi-Brand Authentication Architecture

**Version**: 1.0  
**Date**: March 30, 2026

---

## Core Design Principles

### 1. Brand Agnostic Structure

**Principle**: Layout and structure are independent of brand identity.

**Implementation**:
```typescript
// ❌ BAD: Brand-specific component
<RTHLoginForm />
<SkillUpLoginForm />

// ✅ GOOD: Generic component with brand theming
<LoginForm brand="rth" />
<LoginForm brand="skillup" />
```

**Benefits**:
- Single codebase for both brands
- Easier maintenance
- Consistent UX across brands
- Faster feature development

---

### 2. Data-Driven UI

**Principle**: UI adapts to data shape from BFF, not hardcoded structures.

**Implementation**:
```typescript
// ❌ BAD: Hardcoded structure
<div>
  <h1>{user.name}</h1>
  <p>{user.email}</p>
</div>

// ✅ GOOD: Data-driven rendering
<UserProfile fields={profileFields} data={user} />

// Where profileFields comes from API:
{
  fields: [
    { key: 'name', type: 'text', label: 'Full Name' },
    { key: 'email', type: 'email', label: 'Email Address' }
  ]
}
```

**Benefits**:
- Backend can change data structure without frontend changes
- Flexible field ordering
- Easy A/B testing
- Dynamic form generation

---

### 3. Component Composition

**Principle**: Build complex UIs from small, reusable components.

**Atomic Design Hierarchy**:
```
Atoms (smallest)
  ↓
Molecules (groups of atoms)
  ↓
Organisms (groups of molecules)
  ↓
Templates (page layouts)
  ↓
Pages (specific instances)
```

**Example**:
```typescript
// Atoms
<Button />
<Input />
<Label />

// Molecules
<FormField label="Email" input={<Input type="email" />} />

// Organisms
<LoginForm fields={[...]} />

// Templates
<AuthLayout sidebar={<...>} main={<...>} />

// Pages
<LoginPage brand="rth" />
```

---

### 4. Accessibility First

**WCAG 2.1 AA Compliance**:

1. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Logical tab order
   - Visible focus indicators

2. **Screen Reader Support**
   - Semantic HTML
   - ARIA labels where needed
   - Descriptive alt text

3. **Color Contrast**
   - Minimum 4.5:1 for normal text
   - Minimum 3:1 for large text
   - Don't rely on color alone

4. **Focus Management**
   - Focus trap in modals
   - Focus restoration after actions
   - Skip links for navigation

**Example**:
```typescript
<button
  aria-label="Sign in to your account"
  aria-describedby="login-help-text"
  className="focus:ring-2 focus:ring-offset-2"
>
  Sign In
</button>
```

---

### 5. Responsive Design

**Mobile-First Approach**:

```css
/* Base styles (mobile) */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

**Breakpoints**:
- `sm`: 640px (Mobile landscape)
- `md`: 768px (Tablet)
- `lg`: 1024px (Desktop)
- `xl`: 1280px (Large desktop)
- `2xl`: 1536px (Extra large)

**Touch-Friendly**:
- Minimum touch target: 44x44px
- Adequate spacing between interactive elements
- Swipe gestures where appropriate

---

## Design System Principles

### Consistency

- Use design tokens for colors, spacing, typography
- Consistent component behavior across pages
- Predictable interaction patterns

### Simplicity

- Clear visual hierarchy
- Minimal cognitive load
- Progressive disclosure of complexity

### Feedback

- Immediate visual feedback for actions
- Loading states for async operations
- Clear error messages
- Success confirmations

### Performance

- Lazy load components
- Optimize images
- Minimize bundle size
- Fast initial load

---

## Brand Independence Implementation

### Theme System

```typescript
// Brand theme definition
interface BrandTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

// RTH Theme
const rthTheme: BrandTheme = {
  colors: {
    primary: '#FF4B91',
    secondary: '#1A1A1A',
    accent: '#FF6B9D',
    background: '#FFFFFF',
    text: '#1A1A1A',
  },
  // ...
};

// SkillUp Theme
const skillupTheme: BrandTheme = {
  colors: {
    primary: '#0EA5E9',
    secondary: '#0F172A',
    accent: '#38BDF8',
    background: '#FFFFFF',
    text: '#0F172A',
  },
  // ...
};
```

### Component Usage

```typescript
// Component receives theme via context
function LoginButton() {
  const theme = useBrandTheme();
  
  return (
    <button
      style={{
        backgroundColor: theme.colors.primary,
        color: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
      }}
    >
      Sign In
    </button>
  );
}
```

---

## Data-Driven Layout System

### Field Configuration

```typescript
interface FieldConfig {
  key: string;
  type: 'text' | 'email' | 'password' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  helpText?: string;
}

// API returns field configuration
const loginFields: FieldConfig[] = [
  {
    key: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'you@example.com',
    required: true,
    validation: [{ type: 'email', message: 'Invalid email' }],
  },
  {
    key: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    validation: [{ type: 'minLength', value: 8, message: 'Min 8 characters' }],
  },
];

// Generic form renders based on configuration
<DynamicForm fields={loginFields} onSubmit={handleLogin} />
```

### Layout Configuration

```typescript
interface LayoutConfig {
  type: 'single-column' | 'two-column' | 'sidebar';
  sections: SectionConfig[];
}

interface SectionConfig {
  id: string;
  title?: string;
  components: ComponentConfig[];
}

// API returns layout configuration
const dashboardLayout: LayoutConfig = {
  type: 'two-column',
  sections: [
    {
      id: 'main',
      components: [
        { type: 'welcome-banner', props: { ... } },
        { type: 'upcoming-sessions', props: { ... } },
      ],
    },
    {
      id: 'sidebar',
      components: [
        { type: 'progress-card', props: { ... } },
        { type: 'quick-actions', props: { ... } },
      ],
    },
  ],
};

// Generic layout renderer
<DynamicLayout config={dashboardLayout} />
```

---

## Summary

These design principles ensure:

1. ✅ Brand-independent structure
2. ✅ Data-driven UI that adapts to API changes
3. ✅ Reusable, composable components
4. ✅ Accessible to all users
5. ✅ Responsive across devices
6. ✅ Consistent user experience
7. ✅ Easy to maintain and extend

**Next**: See `02_EXISTING_ANALYSIS.md` for analysis of current UI/UX
