# Objective O1 Block Package

This package contains all files required for integrating Objective Block Version 1 (O1) into the repository.

## File Hierarchy & Paths

```
packages/
├── types/
│   └── src/
│       └── tutorial-rich-document/
│           └── schemas/
│               ├── objective-o1.schema.ts
│               └── objective-o1.schema.json
├── ui/
│   └── src/
│       └── tutorial/
│           ├── blocks/
│           │   ├── ObjectiveO1Block.tsx
│           │   └── __tests__/
│           │       └── ObjectiveO1Block.test.tsx
│           ├── registry.ts
│           └── TutorialBlockRenderer.tsx
└── db-tutorial/
    └── src/
        └── services/
            └── tutorial-composer.service.ts
```

## Contract Compliance
- **UBRC Compatibility**: Generates `<article data-block-id="..." data-block-type="objective" data-block-version="O1">`
- **Theme & Brand Independence**: No hardcoded colors; dynamic token resolution via `theme` prop and `DEFAULT_THEME`.
- **Dual Export**: Dual exports (`ObjectiveBlock`, `ObjectiveO1Block`, and default export).
