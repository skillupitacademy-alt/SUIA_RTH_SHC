---
title: Figma Integration Quick Start
description: Quick reference for Figma to fullstack integration
inclusion: manual
keywords: figma, quick, reference, cheatsheet
---

# Figma Integration Quick Start

## 🚀 Quick Workflow

```
1. Tell AI: "Create [feature] page for [RTH/SkillUp]"
2. AI generates Figma PRD
3. You paste PRD into v0.dev or Figma AI
4. You paste generated code back to AI
5. AI implements everything automatically
```

---

## 📁 Where Files Go

### ❌ NOT in .kiro folder
The `.kiro` folder is for AI guidance, NOT UI/UX code.

### ✅ Actual File Locations

```
apps/realtutorialhub-quiz/src/
├── app/(authenticated)/
│   └── [feature-name]/
│       └── page.tsx              ← Figma page code
└── components/
    └── [feature-name]/
        ├── Component1.tsx         ← Figma components
        ├── Component2.tsx
        └── index.ts

apps/api-server/src/
├── app/api/
│   └── [resource]/
│       └── route.ts              ← BFF routes
└── modules/
    └── [resource]/
        └── [resource].service.ts  ← BFF services

services/skillhubcore-service/src/modules/
└── [resource]/
    ├── [resource].routes.ts      ← Backend routes
    └── [resource].service.ts     ← Backend services

packages/api-client/src/modules/
└── [resource].client.ts          ← API client
```

---

## 🎨 Brand Colors

| Brand | Primary | Tailwind Class |
|-------|---------|----------------|
| RTH | `#FF4B91` | `bg-primary` |
| SkillUp | `#0EA5E9` | `bg-primary` |

**Replace in Figma code**:
- `style={{ backgroundColor: '#FF4B91' }}` → `className="bg-primary"`
- `style={{ color: '#FF4B91' }}` → `className="text-primary"`

---

## 🔐 Authentication Pattern

```typescript
// Frontend
apiClient.client.setBrand('realtutorialhub');
apiClient.client.setPortalIdentity('user');

// BFF
export const GET = withAuth(handler);

// Backend
app.get('/resource', requireAuth, requirePlatform('realtutorialhub'), handler);
```

---

## 📝 Example Commands

### Create New Page
```
"Create a courses page for RTH that shows all available courses with filters"
```

### Create New Component
```
"Create a course card component for SkillUp with enroll button"
```

### Add Feature
```
"Add user profile editing to the RTH dashboard"
```

---

## ✅ What AI Does Automatically

1. ✅ Generates Figma-ready PRD
2. ✅ Helps you integrate Figma code
3. ✅ Creates BFF routes
4. ✅ Creates BFF services
5. ✅ Creates backend routes
6. ✅ Creates backend services
7. ✅ Extends API client
8. ✅ Adds authentication
9. ✅ Adds brand awareness
10. ✅ Adds error handling

---

## 🎯 You Only Need To

1. Describe what you want
2. Paste PRD into Figma AI (v0.dev)
3. Paste generated code back to AI
4. Done! ✨

---

## 📚 Full Guide

For detailed instructions, see: `.kiro/steering/figma-to-fullstack-integration.md`
