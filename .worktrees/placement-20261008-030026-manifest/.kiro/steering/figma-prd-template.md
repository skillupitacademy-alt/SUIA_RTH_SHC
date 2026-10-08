---
title: Figma PRD Template
description: Copy-paste template for generating Figma-ready PRDs
inclusion: manual
keywords: figma, prd, template
---

# Figma PRD Template

Copy this template and fill in the brackets when creating a new feature.

---

```markdown
# [Feature Name] - UI/UX Specification

## Brand Context
- **Brand**: [RTH | SkillUp]
- **Domain**: [user.realtutorialhub.com | user.skillupitacademy.com]
- **Portal Identity**: user
- **Primary Color**: [#FF4B91 for RTH | #0EA5E9 for SkillUp]
- **Secondary Color**: [#FF2D55 for RTH | #0284C7 for SkillUp]
- **Font**: Inter, system-ui, sans-serif

## Page Details
- **Route**: /[route-name]
- **Auth Required**: [Yes | No]
- **Layout**: [Authenticated layout with sidebar | Public layout | Custom]
- **Responsive**: Mobile-first (320px), Tablet (768px), Desktop (1024px+)

## User Story
As a [user type], I want to [action] so that [benefit].

## Components Needed

### 1. [Component Name]
- **Purpose**: [What it does]
- **Props**: 
  - `[propName]`: [type] - [description]
  - `[propName]`: [type] - [description]
- **State**: [What state it manages]
- **Actions**: 
  - [Action 1]: [What happens]
  - [Action 2]: [What happens]

### 2. [Component Name]
- **Purpose**: [What it does]
- **Props**: 
  - `[propName]`: [type] - [description]
- **State**: [What state it manages]
- **Actions**: 
  - [Action 1]: [What happens]

## Data Requirements

### User Data
- `id`: string - User ID
- `name`: string - User full name
- `email`: string - User email
- `avatar`: string - Avatar URL
- `role`: string - User role

### Feature-Specific Data
- `[field]`: [type] - [description]
- `[field]`: [type] - [description]

### Actions
- **Create**: [What can be created]
- **Read**: [What can be viewed]
- **Update**: [What can be updated]
- **Delete**: [What can be deleted]

## API Endpoints Needed

### GET Endpoints
- `GET /api/[resource]` - Fetch all [resources]
  - Query params: `?page=1&limit=10&search=query`
  - Response: `{ data: [], total: number, page: number }`

- `GET /api/[resource]/:id` - Fetch single [resource]
  - Response: `{ data: {} }`

### POST Endpoints
- `POST /api/[resource]` - Create new [resource]
  - Body: `{ field1, field2, ... }`
  - Response: `{ data: {}, message: 'Created successfully' }`

### PUT Endpoints
- `PUT /api/[resource]/:id` - Update [resource]
  - Body: `{ field1, field2, ... }`
  - Response: `{ data: {}, message: 'Updated successfully' }`

### DELETE Endpoints
- `DELETE /api/[resource]/:id` - Delete [resource]
  - Response: `{ message: 'Deleted successfully' }`

## Design Guidelines

### Layout
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Spacing: Use Tailwind spacing scale (4, 6, 8, 12, 16, 24)
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### Typography
- Heading 1: `text-3xl font-bold tracking-tight`
- Heading 2: `text-2xl font-semibold`
- Heading 3: `text-xl font-semibold`
- Body: `text-base text-slate-700`
- Small: `text-sm text-slate-600`

### Colors
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Success: `bg-green-500 text-white`
- Error: `bg-red-500 text-white`
- Warning: `bg-yellow-500 text-white`

### Buttons
- Primary: `bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold`
- Secondary: `bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-lg font-semibold`
- Outline: `border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-lg font-semibold`

### Cards
- Base: `bg-white border border-slate-200 rounded-2xl shadow-sm p-6`
- Hover: `hover:shadow-md transition-shadow`

### Forms
- Input: `w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary`
- Label: `text-sm font-semibold text-slate-700 mb-2`
- Error: `text-sm text-red-600 mt-1`

### States
- Loading: Show skeleton loaders or spinners
- Empty: Show empty state with icon and message
- Error: Show error message with retry button

## Accessibility Requirements
- All interactive elements must be keyboard accessible
- All images must have alt text
- All forms must have labels
- Color contrast must meet WCAG AA standards
- Focus states must be visible

## Responsive Behavior

### Mobile (320px - 767px)
- Single column layout
- Stack all components vertically
- Full-width buttons
- Collapsible navigation

### Tablet (768px - 1023px)
- Two column layout where appropriate
- Side-by-side components
- Responsive navigation

### Desktop (1024px+)
- Three column layout where appropriate
- Full sidebar navigation
- Hover states enabled

## Performance Requirements
- Initial load: < 2 seconds
- Time to interactive: < 3 seconds
- Lazy load images
- Code splitting for large components

## Example Mockup Description
[Describe the visual layout in words, e.g.:]

The page has a header with the page title on the left and action buttons on the right. Below that is a stats section with 3 cards showing key metrics. The main content area has a grid of cards, each showing [resource] information with an image, title, description, and action buttons. At the bottom is pagination.
```

---

## Example: Filled Template

```markdown
# Course Catalog - UI/UX Specification

## Brand Context
- **Brand**: RTH
- **Domain**: user.realtutorialhub.com
- **Portal Identity**: user
- **Primary Color**: #FF4B91
- **Secondary Color**: #FF2D55
- **Font**: Inter, system-ui, sans-serif

## Page Details
- **Route**: /courses
- **Auth Required**: Yes
- **Layout**: Authenticated layout with sidebar
- **Responsive**: Mobile-first (320px), Tablet (768px), Desktop (1024px+)

## User Story
As a student, I want to browse available courses so that I can enroll in courses that match my learning goals.

## Components Needed

### 1. CourseCard
- **Purpose**: Display course information in a card format
- **Props**: 
  - `course`: Course - Course object with title, description, image, instructor
  - `onEnroll`: () => void - Callback when enroll button clicked
- **State**: None (stateless)
- **Actions**: 
  - Click card: Navigate to course details
  - Click enroll: Trigger enrollment flow

### 2. CourseFilters
- **Purpose**: Filter courses by category, level, duration
- **Props**: 
  - `onFilterChange`: (filters: Filters) => void - Callback when filters change
- **State**: Selected filters
- **Actions**: 
  - Select category: Filter courses by category
  - Select level: Filter courses by difficulty level
  - Clear filters: Reset all filters

### 3. SearchBar
- **Purpose**: Search courses by title or keyword
- **Props**: 
  - `onSearch`: (query: string) => void - Callback when search query changes
- **State**: Search query
- **Actions**: 
  - Type in search: Filter courses by search query

## Data Requirements

### User Data
- `id`: string - User ID
- `name`: string - User full name
- `email`: string - User email
- `enrolledCourses`: string[] - Array of enrolled course IDs

### Course Data
- `id`: string - Course ID
- `title`: string - Course title
- `description`: string - Course description
- `image`: string - Course thumbnail URL
- `instructor`: string - Instructor name
- `category`: string - Course category
- `level`: 'beginner' | 'intermediate' | 'advanced'
- `duration`: number - Duration in hours
- `enrolled`: boolean - Whether user is enrolled

### Actions
- **Read**: View all courses, view course details
- **Create**: Enroll in course

## API Endpoints Needed

### GET Endpoints
- `GET /api/courses` - Fetch all courses
  - Query params: `?page=1&limit=12&category=web&level=beginner&search=react`
  - Response: `{ data: Course[], total: number, page: number }`

- `GET /api/courses/:id` - Fetch single course
  - Response: `{ data: Course }`

### POST Endpoints
- `POST /api/courses/:id/enroll` - Enroll in course
  - Response: `{ message: 'Enrolled successfully' }`

## Design Guidelines

### Layout
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### Course Card
- Image: 16:9 aspect ratio, rounded-t-2xl
- Content: p-6 spacing
- Hover: Lift effect with shadow

## Example Mockup Description
The page has a header with "Course Catalog" title and a search bar. Below is a filter section with dropdowns for category, level, and duration. The main area shows a grid of course cards (3 columns on desktop, 2 on tablet, 1 on mobile). Each card has a course image, title, instructor name, duration badge, and "Enroll" button. At the bottom is pagination.
```

---

Use this template every time you need to create a Figma PRD!
