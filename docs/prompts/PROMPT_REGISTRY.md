# AI Implementation Prompt Registry

This registry maps the **Task IDs** from the [Master Blueprints](file:///d:/onlinewebsites/quiz-platform/docs/blueprints/) to their corresponding **Implementation Prompts**.

> [!TIP]
> **Prompt Hierarchy**: 
> 1. Use the **Registry** (this file) to find the high-level prompt for an entire phase or strategic gap.
> 2. For **detailed, step-by-step instructions** for a specific Task ID (e.g., T34), refer directly to the **[Phase Blueprints](file:///d:/onlinewebsites/quiz-platform/docs/blueprints/)**. Each task in the blueprint includes its own self-contained AI prompt.

## 🏗️ Phase 1: Foundation (Carry-Forward)
| Task ID | Component | Prompt File |
| :--- | :--- | :--- |
| T1–T13 | Testing | [load_test.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/load_test.prompt.md) |
| T37 | DB Timeouts | [safe_mode.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/safe_mode.prompt.md) |
| T38 | DB Indexes | [sharding.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/sharding.prompt.md) |
| T40 | CSRF Hardening | [biometric_guard.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/biometric_guard.prompt.md) |

## 🚀 Phase 2: Architectural Foundation
| Task Area | Domain | Prompt File |
| :--- | :--- | :--- |
| Auth Refactor | Security | [biometric_guard.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/biometric_guard.prompt.md) |
| Async Submissions | Scaling | [phase-2-async-prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-2-async-prompt.md) |
| Dashboard QA | UI/UX | [dashboard_sanity_prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/dashboard_sanity_prompt.md) |
| Foundation | Core Logic | [phase-2-async-prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-2-async-prompt.md) |
| T79–T91 Frontend Opt | Performance | [phase-2-frontend-optimization.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-2-frontend-optimization.prompt.md) |
| T92–T98 Database Opt | Data Layer | [phase-2-database-optimization.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-2-database-optimization.prompt.md) |
| CF-3/4/6/7 Carry-Forwards | Cleanup Sprint | [phase-2-carry-forwards.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-2-carry-forwards.prompt.md) |

## 🛡️ Phase 3: Scale Preparation (Reliance)
| Task Area | Domain | Prompt File |
| :--- | :--- | :--- |
| Cache & API Opt | Resilience | [rate_limiting.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/rate_limiting.prompt.md) |
| Message Queues | Operations | [observability_polish.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/observability_polish.prompt.md) |
| DB Sharding | Data | [sharding.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/sharding.prompt.md) |
| Disaster Recovery | Resilience | [backup_and_recovery.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/backup_and_recovery.prompt.md) |
| Foundation | Scale | [phase-3-data-layer-prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-3-data-layer-prompt.md) |

## 🌌 Phase 4: Enterprise / Hyperscale
| Task Area | Domain | Prompt File |
| :--- | :--- | :--- |
| Event Sourcing | Architecture | [phase-4-hyper-scale-prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-4-hyper-scale-prompt.md) |
| Multi-Region | Infrastructure | [phase-4-hyper-scale-prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/phase-4-hyper-scale-prompt.md) |
| Real-Time Auth | Security | [biometric_guard.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/biometric_guard.prompt.md) |
| Chaos Eng | Resilience | [safe_mode.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/safe_mode.prompt.md) |

## 🛠️ Specialized Strategic Prompts
| Name | Purpose | Link |
| :--- | :--- | :--- |
| **Master Super-Prompt** | End-to-end Hyper-Scale Implementation | [HYPER_SCALE_SUPER_PROMPT.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/HYPER_SCALE_SUPER_PROMPT.md) |
| **Accessibility (WCAG)** | Global Compliance Pass | [wcag_compliance.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/wcag_compliance.prompt.md) |
| **Internationalization** | Multi-region Ready | [internationalization.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/internationalization.prompt.md) |
| **PWA / Mobile** | Offline-first Experience | [progressive_web_app.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/progressive_web_app.prompt.md) |
| **Admin Audit Trail** | Governance & Compliance | [admin_audit_trail.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/admin_audit_trail.prompt.md) |
| **SEO & Social** | Growth & Organic Reach | [seo_and_social.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/seo_and_social.prompt.md) |
| **Content Versioning** | Question History | [question_versioning.prompt.md](file:///d:/onlinewebsites/quiz-platform/docs/prompts/question_versioning.prompt.md) |

---

> [!TIP]
> Always use the **Phase Master Blueprints** in `docs/blueprints/` to track overall progress, and pull from `docs/prompts/` only when starting a specific implementation task.
