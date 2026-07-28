# Renderer Highlighting System - Visual Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     GLOBAL ARCHITECTURE PAGE                                 │
│                     (page.tsx)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌──────────────────────────┐      ┌──────────────────────────┐
    │  MICRO COMPONENT EDITOR  │      │ RENDERER DECISION PREVIEW│
    │                          │      │                          │
    │  ┌────────────────────┐  │      │  ┌────────────────────┐ │
    │  │ Select Child Part  │  │      │  │ ContractAware      │ │
    │  │    Dropdown        │  │      │  │ ComponentPreview   │ │
    │  │                    │  │      │  │                    │ │
    │  │ ┌────────────────┐ │  │      │  │ ┌────────────────┐│ │
    │  │ │ container      │ │  │◄─────┼──┼─│ Highlight      ││ │
    │  │ │ header         │ │  │      │  │ │ Functions      ││ │
    │  │ │ icon_badge     │ │  │      │  │ │                ││ │
    │  │ │ title          │ │  │      │  │ │ • getHighlight ││ │
    │  │ │ description    │ │  │      │  │ │   Style()      ││ │
    │  │ │ body           │ │  │      │  │ │ • getHighlight ││ │
    │  │ │ progress_bar   │ │  │      │  │ │   Class()      ││ │
    │  │ │ ...            │ │  │      │  │ └────────────────┘│ │
    │  │ └────────────────┘ │  │      │  │                    │ │
    │  │                    │  │      │  │ ┌────────────────┐│ │
    │  │ Data Source:       │  │      │  │ │ Visual Elements││ │
    │  │ • notesPartPresets │  │      │  │ │ with           ││ │
    │  │ • educationalPart  │  │      │  │ │ data-part-id   ││ │
    │  │   Presets          │  │      │  │ │ attributes     ││ │
    │  └────────────────────┘  │      │  │ └────────────────┘│ │
    └──────────────────────────┘      │  └────────────────────┘ │
                │                     └──────────────────────────┘
                │                                 │
                │                                 │
                │     State: selectedRendererSubcomponentId
                │                                 │
                └─────────────────┬───────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   USER INTERACTION      │
                    │                         │
                    │ 1. User selects part    │
                    │    from dropdown        │
                    │         ↓               │
                    │ 2. State updates        │
                    │         ↓               │
                    │ 3. Preview receives     │
                    │    highlightedSubcomp   │
                    │    onentId prop         │
                    │         ↓               │
                    │ 4. Matching element     │
                    │    gets indigo border   │
                    └─────────────────────────┘
```

---

## Component Breakdown: concept_card

```
┌─────────────────────────────────────────────────────────────────┐
│ DROPDOWN PRESET (notesPartPresets.concept_card)                 │
├─────────────────────────────────────────────────────────────────┤
│ [0]  container              ←──┐                                │
│ [1]  header                 ←──┼──┐                             │
│ [2]  icon_badge            ←──┼──┼──┐                          │
│ [3]  difficulty_badge      ←──┼──┼──┼──┐                       │
│ [4]  brand_badge           ←──┼──┼──┼──┼──┐                    │
│ [5]  title                 ←──┼──┼──┼──┼──┼──┐                 │
│ [6]  description           ←──┼──┼──┼──┼──┼──┼──┐              │
│ [7]  secondary_button      ←──┼──┼──┼──┼──┼──┼──┼──┐           │
│ [8]  quick_look_pill_0     ←──┼──┼──┼──┼──┼──┼──┼──┼──┐        │
│ [9]  quick_look_pill_1     ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┐     │
│ [10] quick_look_pill_2     ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┐  │
│ [11] quick_look_pill_3     ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼─┐│
│ [12] body                  ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼─┤│
│ [13] preview_label         ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼─┤│
│ [14] preview_title         ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼─┤│
│ [15] preview_description   ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼─┤│
│ [16] progress_bar          ←──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼─┘│
└─────────────────────────────────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼───┘
                                  │  │  │  │  │  │  │  │  │  │
                    ══════════════╧══╧══╧══╧══╧══╧══╧══╧══╧══╧════
                              PERFECT 1:1 MAPPING
                    ══════════════╤══╤══╤══╤══╤══╤══╤══╤══╤══╤════
                                  │  │  │  │  │  │  │  │  │  │
┌─────────────────────────────────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼───┐
│ TSX RENDERER (ContractAwareComponentPreview.tsx)              ││
├─────────────────────────────────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼───┤│
│                                 ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼   ││
│ <div data-part-id="container" ● className={getHighlightClass()}││
│   <div data-part-id="header" ● style={getHighlightStyle()}>   ││
│     <span data-part-id="icon_badge" ●>JS</span>               ││
│     <span data-part-id="difficulty_badge" ●>Beginner</span>   ││
│     <span data-part-id="brand_badge" ●>RTH</span>             ││
│     <h2 data-part-id="title" ●>What is Python?</h2>           ││
│     <p data-part-id="description" ●>Intro text...</p>          ││
│     <div data-part-id="secondary_button" ●>                   ││
│       <span data-part-id="quick_look_pill_0" ●>Definition</span>│
│       <span data-part-id="quick_look_pill_1" ●>Mechanics</span>││
│       <span data-part-id="quick_look_pill_2" ●>Syntax</span>  ││
│       <span data-part-id="quick_look_pill_3" ●>Examples</span>││
│     </div>                                                     ││
│   </div>                                                       ││
│   <div data-part-id="body" ●>                                 ││
│     <p data-part-id="preview_label" ●>Simple Words</p>        ││
│     <p data-part-id="preview_title" ●>Begin with meaning</p>  ││
│     <p data-part-id="preview_description" ●>Overview text</p> ││
│     <div data-part-id="progress_bar" ●></div>                 ││
│   </div>                                                       ││
│ </div>                                                         ││
│                                                                ││
│ ● = Highlighting enabled with getHighlightClass() & Style()   ││
└────────────────────────────────────────────────────────────────┘│
```

---

## Highlighting Flow Visualization

```
┌──────────────────────────────────────────────────────────────────────┐
│                    USER SELECTS "icon_badge"                         │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │ setSelectedRendererSubcomp    │
                 │ onentId('icon_badge')         │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │ State Update:                              │
        │ selectedRendererSubcomponentId = 'icon_badge'│
        └───────────────┬────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────────┐
        │ ContractAwareComponentPreview receives:   │
        │ highlightedSubcomponentId='icon_badge'    │
        └───────────────┬───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────────┐
        │ For each element with data-part-id:       │
        │                                            │
        │ getHighlightStyle('container')             │
        │   → partId !== 'icon_badge' → {}           │
        │                                            │
        │ getHighlightStyle('header')                │
        │   → partId !== 'icon_badge' → {}           │
        │                                            │
        │ getHighlightStyle('icon_badge') ✓          │
        │   → partId === 'icon_badge' → {            │
        │        outline: '3px solid #6366f1',       │
        │        outlineOffset: '2px',               │
        │        boxShadow: '0 0 0 4px rgba(...)'    │
        │      }                                     │
        │                                            │
        │ getHighlightStyle('title')                 │
        │   → partId !== 'icon_badge' → {}           │
        │                                            │
        │ ... and so on for all parts                │
        └───────────────┬───────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────────┐
        │ VISUAL RESULT IN PREVIEW:                 │
        │                                            │
        │ ┌──────────────────────────────┐          │
        │ │ ┏━━━━━━━━━┓                  │          │
        │ │ ┃   JS    ┃ ← Indigo Border  │          │
        │ │ ┗━━━━━━━━━┛                  │          │
        │ │ Beginner                      │          │
        │ │                               │          │
        │ │ What is Python?               │          │
        │ │ Clear overview...             │          │
        │ └──────────────────────────────┘          │
        │                                            │
        │ Only the JS badge has the indigo border!  │
        └───────────────────────────────────────────┘
```

---

## Data Structure Visualization

```
commonDefaults Array (Line 579-594)
┌─────────────────────────────────────────────────────────┐
│ Index │ ID              │ Label                         │
├───────┼─────────────────┼───────────────────────────────┤
│  [0]  │ container       │ Outer Surface                 │
│  [1]  │ header          │ Header Area                   │
│  [2]  │ body            │ Body Area                     │
│  [3]  │ action          │ Action Area                   │
│  [4]  │ icon_badge      │ JS Badge                      │
│  [5]  │ difficulty_badge│ Difficulty Badge              │
│  [6]  │ brand_badge     │ Brand Badge                   │
│  [7]  │ title           │ Title Text                    │
│  [8]  │ description     │ Description Text              │
│  [9]  │ stat_cards      │ Stat Cards                    │
│  [10] │ stat_value      │ Stat Values                   │
│  [11] │ primary_button  │ Primary Button                │
│  [12] │ secondary_button│ Roadmap Button                │
│  [13] │ progress_bar    │ Progress Bar                  │
└───────┴─────────────────┴───────────────────────────────┘

notesPartPresets (Lines 598-670)
┌─────────────────────────────────────────────────────────┐
│ Component         │ Parts │ Structure                   │
├───────────────────┼───────┼─────────────────────────────┤
│ concept_card      │  17   │ spread + explicit IDs       │
│ definition_block  │   8   │ spread commonDefaults[0-13] │
│ syntax_block      │   5   │ spread commonDefaults       │
│ component_grid    │   6   │ spread commonDefaults       │
│ example_panel     │   6   │ spread commonDefaults       │
│ practice_card     │   5   │ spread commonDefaults       │
│ warning_faq       │   6   │ spread commonDefaults       │
│ summary_card      │   6   │ spread commonDefaults       │
└───────────────────┴───────┴─────────────────────────────┘
        │
        │ Maps to dropdown options
        ▼
Select Child Part Dropdown
┌─────────────────────────────────────┐
│ ○ Outer Surface (container)        │
│ ○ Header Area (header)              │
│ ○ JS Badge (icon_badge)             │
│ ● Difficulty Badge (difficulty...)  │ ← Currently selected
│ ○ Brand Badge (brand_badge)         │
│ ○ Title Text (title)                │
│ ○ Description Text (description)    │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## Highlight Rendering Algorithm

```
For each visual element in TSX:

  1. Check if it has data-part-id attribute
     │
     ├─ NO → Render normally (no highlighting)
     │
     └─ YES → Continue to step 2
               │
               2. Extract part ID from data-part-id
                  │
                  3. Call getHighlightStyle(partId)
                     │
                     ├─ Does partId === highlightedSubcomponentId?
                     │  │
                     │  ├─ NO → Return empty object {}
                     │  │      (Element renders with base styles)
                     │  │
                     │  └─ YES → Return highlight styles
                     │          {
                     │            outline: '3px solid #6366f1',
                     │            outlineOffset: '2px',
                     │            boxShadow: '0 0 0 4px rgba(99,102,241,0.1)'
                     │          }
                     │          (Element renders with indigo border)
                     │
                     4. Call getHighlightClass(partId)
                        │
                        ├─ Does partId === highlightedSubcomponentId?
                        │  │
                        │  ├─ NO → Return empty string ''
                        │  │
                        │  └─ YES → Return 'transition-all duration-200'
                        │          (Smooth transition animation)
                        │
                        5. Apply both to element:
                           <div 
                             data-part-id={partId}
                             className={`base-classes ${getHighlightClass(partId)}`}
                             style={{...baseStyles, ...getHighlightStyle(partId)}}
                           >

Result: Exactly ONE element in entire preview has indigo border
```

---

## Complete System State Machine

```
┌─────────────┐
│   INITIAL   │ selectedRendererSubcomponentId = 'container'
│   STATE     │ (default selection)
└──────┬──────┘
       │
       │ User clicks dropdown
       ▼
┌─────────────┐
│  DROPDOWN   │ Shows all parts from preset:
│   OPEN      │ - notesPartPresets[componentKey] OR
└──────┬──────┘ - educationalPartPresets[componentKey]
       │
       │ User selects 'icon_badge'
       ▼
┌─────────────┐
│   STATE     │ setSelectedRendererSubcomponentId('icon_badge')
│  UPDATING   │ React state update triggers re-render
└──────┬──────┘
       │
       │ Props propagate
       ▼
┌─────────────┐
│  PREVIEW    │ highlightedSubcomponentId = 'icon_badge'
│  RE-RENDER  │ All elements evaluate highlight functions
└──────┬──────┘
       │
       │ Rendering algorithm runs
       ▼
┌─────────────┐
│  HIGHLIGHT  │ Element with data-part-id="icon_badge"
│   APPLIED   │ receives indigo border styles
└──────┬──────┘
       │
       │ Visual update complete
       ▼
┌─────────────┐
│    IDLE     │ Waiting for next user interaction
│   STATE     │ 'icon_badge' remains highlighted
└──────┬──────┘
       │
       │ User selects different part OR closes dropdown
       │
       └─────► Cycle repeats
```

---

## Browser DevTools View (Example)

When you inspect highlighted element:

```html
<!-- Before Selection (container selected by default) -->
<div 
  data-part-id="icon_badge" 
  class="rounded-full px-3 py-1 text-xs font-black inline-flex"
  style="background-color: rgb(79, 70, 229); color: rgb(255, 255, 255);"
>
  JS
</div>

<!-- After Selecting icon_badge in Dropdown -->
<div 
  data-part-id="icon_badge" 
  class="rounded-full px-3 py-1 text-xs font-black inline-flex transition-all duration-200"
  style="
    background-color: rgb(79, 70, 229); 
    color: rgb(255, 255, 255);
    outline: 3px solid rgb(99, 102, 241);
    outline-offset: 2px;
    box-shadow: rgba(99, 102, 241, 0.1) 0px 0px 0px 4px;
  "
>
  JS
</div>
```

**Visible Changes:**
- ✅ Indigo outline appears around badge
- ✅ Subtle shadow for depth
- ✅ Smooth 200ms transition animation
- ✅ No layout shift (outline-offset prevents reflow)

---

## Summary

This visualization shows how:

1. **User interaction** (dropdown selection) triggers state update
2. **State change** propagates to preview component
3. **Highlight functions** evaluate each element's part ID
4. **Matching element** receives indigo border styling
5. **Visual feedback** appears instantly with smooth transition

The system is **fully declarative** and **type-safe**, ensuring reliable highlighting for all 14 components and their ~100 total parts.

**Result:** Perfect 1:1 mapping between dropdown options and visual elements! 🎯
