# Page Contracts Index

## Purpose of Page Contracts
Page contracts serve as the authoritative technical specification for individual pages within the Quiz Platform. They define the mandatory behavior, data requirements, UI rules, and verification steps necessary to ensure consistency and quality across the application. Each contract acts as a source of truth for both human developers and AI agents.

## Folder Breakdown
The page contracts are organized by **User Journey** to reflect the flow and functional areas of the application:

- **[auth/](file:///d:/onlinewebsites/quiz-platform/docs/pages/auth/)**: Contains contracts related to user identity, including Sign In, Sign Up, and the Onboarding process.
- **[dashboard/](file:///d:/onlinewebsites/quiz-platform/docs/pages/dashboard/)**: Specifications for the primary user dashboard, providing an overview of progress and activity.
- **[exams/](file:///d:/onlinewebsites/quiz-platform/docs/pages/exams/)**: Contracts governing the end-to-end exam experience, from configuration (Start Exam) to the active attempt (Exam Session).
- **[reports/](file:///d:/onlinewebsites/quiz-platform/docs/pages/reports/)**: Detailed analytics and post-exam review specifications.
- **[settings/](file:///d:/onlinewebsites/quiz-platform/docs/pages/settings/)**: User profile management and account configuration rules.

## Global Compliance
All pages documented here must strictly comply with the global rules defined in [UX_BASELINE.md](file:///d:/onlinewebsites/quiz-platform/docs/ux/UX_BASELINE.md). This ensures baseline responsiveness, accessibility, and navigation integrity across the entire platform.
