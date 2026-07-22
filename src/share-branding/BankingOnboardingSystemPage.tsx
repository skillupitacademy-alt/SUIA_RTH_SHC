import type { CSSProperties } from 'react';

import type { BrandConfig } from './brandConfig';

interface BankingOnboardingSystemPageProps {
  config: BrandConfig;
}

const originalStyles = "/* Design Tokens */\n    :root {\n      --primary-navy: var(--primary-navy);\n      --primary-magenta: var(--primary-magenta);\n      --primary-magenta-hover: var(--primary-magenta-hover);\n      --accent-blue: #3b82f6;\n      --accent-purple: #8b5cf6;\n      --accent-green: #10b981;\n      --accent-orange: #f59e0b;\n\n      --bg-dark: #0f172a;\n      --bg-light: #f8fafc;\n      --bg-card: #ffffff;\n\n      --bg-light-pink: var(--bg-light-pink);\n      --bg-light-blue: #eff6ff;\n      --bg-light-purple: #faf5ff;\n      --bg-light-green: #ecfdf5;\n      --bg-light-orange: #fffbeb;\n\n      --border-pink: var(--border-pink);\n      --border-blue: #bfdbfe;\n      --border-purple: #e9d5ff;\n      --border-green: #a7f3d0;\n      --border-orange: #fde68a;\n      --border-slate: #cbd5e1;\n\n      --text-dark: #0f172a;\n      --text-muted: #64748b;\n      --text-light: #f8fa5c;\n\n      --font-main: 'Outfit', sans-serif;\n      --font-code: 'Fira Code', monospace;\n    }\n\n    /* Reset and Base Styles */\n    * {\n      box-sizing: border-box;\n      margin: 0;\n      padding: 0;\n    }\n\n    html {\n      overflow-x: hidden;\n    }\n\n    body {\n      font-family: var(--font-main);\n      background-color: var(--bg-light);\n      color: var(--text-dark);\n      line-height: 1.5;\n      padding: 24px;\n      display: flex;\n      justify-content: center;\n      align-items: flex-start;\n      overflow-x: hidden;\n      min-width: 0;\n    }\n\n    .container {\n      width: 100%;\n      max-width: 1380px;\n      min-width: 0;\n      background-color: #ffffff;\n      border-radius: 20px;\n      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 8px rgba(0, 0, 0, 0.02);\n      padding: 24px;\n      display: flex;\n      flex-direction: column;\n      gap: 24px;\n      overflow: hidden;\n    }\n\n    /* Typography & Badges */\n    h1,\n    h2,\n    h3,\n    h4,\n    h5 {\n      font-weight: 700;\n    }\n\n    /* Header Section */\n    .header-wrapper {\n      display: grid;\n      grid-template-columns: 240px 1fr 180px;\n      align-items: center;\n      gap: 20px;\n    }\n\n    .assignment-badge {\n      background-color: var(--primary-magenta);\n      color: white;\n      border-radius: 14px;\n      padding: 16px;\n      text-align: center;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      gap: 8px;\n      box-shadow: 0 4px 12px rgba(225, 29, 72, 0.2);\n    }\n\n    .assignment-badge .badge-tag {\n      font-size: 11px;\n      font-weight: 800;\n      letter-spacing: 1.5px;\n      text-transform: uppercase;\n      opacity: 0.9;\n    }\n\n    .assignment-badge .badge-title {\n      font-size: 18px;\n      font-weight: 800;\n      line-height: 1.2;\n      letter-spacing: 0.5px;\n    }\n\n    .assignment-badge svg {\n      width: 24px;\n      height: 24px;\n    }\n\n    .title-block {\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      text-align: center;\n      gap: 12px;\n    }\n\n    .title-block h1 {\n      font-size: 38px;\n      font-weight: 800;\n      line-height: 1.15;\n    }\n\n    .title-block h1 span.blue-text {\n      color: var(--primary-navy);\n    }\n\n    .title-block h1 span.magenta-text {\n      color: var(--primary-magenta);\n    }\n\n    .topics-bar {\n      background-color: var(--primary-navy);\n      color: white;\n      border-radius: 30px;\n      padding: 8px 20px;\n      font-size: 13px;\n      font-weight: 500;\n      display: inline-flex;\n      align-items: center;\n      gap: 8px;\n      box-shadow: 0 2px 8px rgba(14, 23, 44, 0.15);\n    }\n\n    .topics-bar svg {\n      color: var(--primary-magenta);\n      flex-shrink: 0;\n    }\n\n    .topics-dot {\n      color: var(--primary-magenta);\n      margin: 0 4px;\n    }\n\n    .logo-block {\n      display: flex;\n      align-items: center;\n      justify-content: flex-end;\n      gap: 8px;\n    }\n\n    .logo-block span {\n      font-size: 26px;\n      font-weight: 700;\n      color: #374151;\n    }\n\n    /* Sub-header Bar */\n    .subheader-bar {\n      display: grid;\n      grid-template-columns: 1fr 1fr 1.5fr;\n      gap: 16px;\n    }\n\n    .subheader-box {\n      border: 1px dashed var(--border-purple);\n      border-radius: 12px;\n      padding: 12px 20px;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      background-color: var(--bg-light-purple);\n    }\n\n    .subheader-box.pink-box {\n      background-color: var(--bg-light-pink);\n      border-color: var(--border-pink);\n    }\n\n    .subheader-box.blue-box {\n      background-color: #eff6ff;\n      border-color: #bfdbfe;\n    }\n\n    .subheader-box svg {\n      width: 24px;\n      height: 24px;\n      flex-shrink: 0;\n    }\n\n    .subheader-box.pink-box svg {\n      color: var(--primary-magenta);\n    }\n\n    .subheader-box.blue-box svg {\n      color: var(--accent-blue);\n    }\n\n    .subheader-box.purple-box svg {\n      color: var(--accent-purple);\n    }\n\n    .subheader-box .box-text {\n      font-size: 14px;\n      font-weight: 500;\n      color: var(--primary-navy);\n    }\n\n    .subheader-box .box-text strong {\n      font-weight: 700;\n    }\n\n    /* Main Layout Grid */\n    .main-grid {\n      display: grid;\n      grid-template-columns: 1fr 1.25fr 1fr 1.2fr;\n      gap: 20px;\n      min-width: 0;\n    }\n\n    .row-grid-2 {\n      display: flex;\n      flex-direction: column;\n      gap: 20px;\n      min-width: 0;\n    }\n\n    .what-you-need-layout {\n      display: grid;\n      grid-template-columns: 1fr 1.15fr;\n      gap: 24px;\n      align-items: start;\n    }\n\n    .what-you-need-layout > :last-child {\n      border-left: 1px solid var(--border-slate);\n      padding-left: 24px;\n    }\n\n    .starter-skeleton-layout {\n      display: grid;\n      grid-template-columns: 1fr 1fr;\n      gap: 16px;\n    }\n\n    .star-note-card {\n      grid-column: span 2;\n      background-color: var(--bg-light-pink);\n      border: 1px solid var(--border-pink);\n      border-radius: 12px;\n      padding: 10px 16px;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      margin-top: 8px;\n    }\n\n    .star-note-card svg {\n      color: var(--primary-magenta);\n      flex-shrink: 0;\n    }\n\n    .star-note-card p {\n      font-size: 12px;\n      font-weight: 700;\n      color: var(--primary-navy);\n      line-height: 1.4;\n    }\n\n    .main-grid>*,\n    .mid-grid>*,\n    .bottom-grid>*,\n    .part-e-layout>*,\n    .part-c-layout>* {\n      min-width: 0;\n    }\n\n    /* Card Styles */\n    .card {\n      background-color: var(--bg-card);\n      border: 1px solid var(--border-slate);\n      border-radius: 16px;\n      overflow: hidden;\n      display: flex;\n      flex-direction: column;\n      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\n      min-width: 0;\n    }\n\n    .card-header {\n      background-color: var(--primary-navy);\n      color: white;\n      padding: 12px 20px;\n      font-size: 15px;\n      font-weight: 700;\n      letter-spacing: 0.5px;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n    }\n\n    .card-header.gradient-pink {\n      background: linear-gradient(135deg, var(--primary-magenta), var(--primary-magenta-hover));\n    }\n\n    .card-header.gradient-purple {\n      background: linear-gradient(135deg, #7c3aed, #6d28d9);\n    }\n\n    .card-body {\n      padding: 20px;\n      display: flex;\n      flex-direction: column;\n      gap: 16px;\n      flex-grow: 1;\n      min-width: 0;\n    }\n\n    /* Column 1 Card: Background */\n    .bg-row {\n      display: flex;\n      align-items: flex-start;\n      gap: 12px;\n      padding-bottom: 12px;\n      border-bottom: 1px dashed var(--border-slate);\n    }\n\n    .bg-row:last-child {\n      border-bottom: none;\n      padding-bottom: 0;\n    }\n\n    .bg-row-icon {\n      width: 42px;\n      height: 42px;\n      border-radius: 50%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      flex-shrink: 0;\n    }\n\n    .bg-row-icon.pink {\n      background-color: var(--bg-light-pink);\n      color: var(--primary-magenta);\n    }\n\n    .bg-row-icon.blue {\n      background-color: var(--bg-light-blue);\n      color: var(--accent-blue);\n    }\n\n    .bg-row-icon.purple {\n      background-color: var(--bg-light-purple);\n      color: var(--accent-purple);\n    }\n\n    .bg-row-content {\n      font-size: 13.5px;\n    }\n\n    .bg-row-content h4 {\n      font-size: 14.5px;\n      font-weight: 700;\n      margin-bottom: 2px;\n      color: var(--primary-navy);\n    }\n\n    .bg-row-content p {\n      color: var(--text-muted);\n      font-weight: 500;\n    }\n\n    .bg-row-content p strong {\n      color: var(--primary-magenta);\n      font-weight: 600;\n    }\n\n    .intro-box {\n      display: flex;\n      gap: 12px;\n      align-items: flex-start;\n      background-color: var(--bg-light-pink);\n      border: 1px dashed var(--border-pink);\n      border-radius: 12px;\n      padding: 12px;\n      font-size: 13px;\n      font-weight: 500;\n      color: var(--primary-navy);\n    }\n\n    .intro-box svg {\n      width: 24px;\n      height: 24px;\n      color: var(--primary-magenta);\n      flex-shrink: 0;\n    }\n\n    /* Checklist Items */\n    .checklist {\n      display: flex;\n      flex-direction: column;\n      gap: 10px;\n    }\n\n    .checklist-item {\n      display: flex;\n      align-items: flex-start;\n      gap: 8px;\n      font-size: 13px;\n      font-weight: 500;\n      color: var(--text-dark);\n    }\n\n    .checklist-item.bold-desc {\n      font-weight: 600;\n    }\n\n    .check-circle {\n      width: 18px;\n      height: 18px;\n      border-radius: 50%;\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      flex-shrink: 0;\n      margin-top: 1px;\n    }\n\n    .check-circle.green {\n      background-color: #d1fae5;\n      color: #059669;\n    }\n\n    .check-circle.pink {\n      background-color: var(--bg-light-pink);\n      color: var(--primary-magenta);\n    }\n\n    .check-circle.purple {\n      background-color: #f3e8ff;\n      color: #7c3aed;\n    }\n\n    .check-circle svg {\n      width: 12px;\n      height: 12px;\n    }\n\n    /* Parts with Badges */\n    .part-section {\n      display: flex;\n      flex-direction: column;\n      gap: 12px;\n      border-bottom: 1px solid var(--border-slate);\n      padding-bottom: 12px;\n    }\n\n    .part-section:last-child {\n      border-bottom: none;\n      padding-bottom: 0;\n    }\n\n    .part-title-wrapper {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n    }\n\n    .part-badge {\n      background-color: var(--primary-magenta);\n      color: white;\n      font-size: 11px;\n      font-weight: 800;\n      width: 22px;\n      height: 22px;\n      border-radius: 50%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      flex-shrink: 0;\n    }\n\n    .part-title {\n      font-size: 14px;\n      font-weight: 700;\n      color: var(--primary-navy);\n    }\n\n    /* Code Blocks styling */\n    .code-container {\n      background-color: var(--bg-dark);\n      border-radius: 12px;\n      overflow: hidden;\n      overflow-x: auto;\n      font-family: var(--font-code);\n      font-size: 11.5px;\n      border: 1px solid #334155;\n      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);\n      min-width: 0;\n    }\n\n    .code-header {\n      background-color: #1e293b;\n      padding: 8px 12px;\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      border-bottom: 1px solid #334155;\n    }\n\n    .window-dots {\n      display: flex;\n      gap: 6px;\n    }\n\n    .window-dot.red {\n      background-color: #ef4444;\n    }\n\n    .window-dot.yellow {\n      background-color: #eab308;\n    }\n\n    .window-dot.green {\n      background-color: #22c55e;\n    }\n\n    .window-label {\n      color: #94a3b8;\n      font-size: 10.5px;\n      font-weight: 500;\n    }\n\n    .code-content {\n      padding: 14px;\n      color: #f8fafc;\n      overflow-x: auto;\n      white-space: pre;\n      margin: 0;\n      display: block;\n      font-family: var(--font-code);\n      font-size: inherit;\n    }\n\n    /* Code Syntax Highlighting */\n    .kw {\n      color: #f472b6;\n      font-weight: 500;\n    }\n\n    /* Keyword */\n    .cls {\n      color: #67e8f9;\n    }\n\n    /* Class */\n    .fn {\n      color: #38bdf8;\n    }\n\n    /* Function */\n    .str {\n      color: #fbbf24;\n    }\n\n    /* String */\n    .var {\n      color: #fbcfe8;\n    }\n\n    /* Variable self/cls */\n    .arg {\n      color: #fed7aa;\n    }\n\n    /* args/kwargs */\n    .cm {\n      color: #64748b;\n      font-style: italic;\n    }\n\n    /* Comment */\n    .num {\n      color: #c084fc;\n    }\n\n    /* Number */\n\n    /* Layout Col 2 / Col 3 adjustments */\n    .col-flex-container {\n      display: flex;\n      flex-direction: column;\n      gap: 20px;\n      min-width: 0;\n    }\n\n    /* Diagram in Big Picture Architecture */\n    .diagram-container {\n      background-color: #ffffff;\n      border: 1px solid var(--border-slate);\n      border-radius: 12px;\n      padding: 12px;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n    }\n\n    /* Part B Extensibility details */\n    .arrow-divider {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      margin: 8px 0;\n      color: var(--primary-navy);\n    }\n\n    .arrow-divider svg {\n      width: 24px;\n      height: 24px;\n    }\n\n    .assert-line-wrapper {\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n    }\n\n    .tip-card {\n      background-color: var(--bg-light-pink);\n      border: 1px solid var(--border-pink);\n      border-radius: 12px;\n      padding: 12px;\n      display: flex;\n      gap: 12px;\n      align-items: flex-start;\n      margin-top: 4px;\n    }\n\n    .tip-card svg {\n      color: var(--primary-magenta);\n      flex-shrink: 0;\n      margin-top: 2px;\n    }\n\n    .tip-card p {\n      font-size: 12.5px;\n      font-weight: 500;\n      color: var(--primary-navy);\n      line-height: 1.4;\n    }\n\n    .tip-card p strong {\n      color: var(--primary-magenta);\n    }\n\n    /* Row 2 Grid: Part B & Part C */\n    .mid-grid {\n      display: flex;\n      flex-direction: column;\n      gap: 20px;\n      min-width: 0;\n    }\n\n    .part-c-layout {\n      display: grid;\n      grid-template-columns: 1fr 160px;\n      gap: 20px;\n      min-width: 0;\n    }\n\n    .part-c-layout > :last-child {\n      border-left: 1px solid var(--border-slate);\n      padding-left: 20px;\n    }\n\n    /* Vertical Chains (Inheritance & MRO) */\n    .vertical-chain {\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      gap: 6px;\n    }\n\n    .vertical-chain-title {\n      font-size: 11px;\n      font-weight: 800;\n      text-transform: uppercase;\n      letter-spacing: 0.5px;\n      color: var(--text-muted);\n      text-align: center;\n      margin-bottom: 4px;\n    }\n\n    .chain-box {\n      width: 100%;\n      max-width: 140px;\n      padding: 6px 10px;\n      border-radius: 8px;\n      text-align: center;\n      font-size: 11px;\n      font-weight: 700;\n      border: 1px solid var(--border-slate);\n      background-color: #f1f5f9;\n      color: var(--primary-navy);\n      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);\n    }\n\n    .chain-box.pink {\n      border-color: var(--border-pink);\n      background-color: var(--bg-light-pink);\n    }\n\n    .chain-box.blue {\n      border-color: var(--border-blue);\n      background-color: var(--bg-light-blue);\n    }\n\n    .chain-box.purple {\n      border-color: var(--border-purple);\n      background-color: var(--bg-light-purple);\n    }\n\n    .chain-box.navy {\n      border-color: var(--primary-navy);\n      background-color: var(--primary-navy);\n      color: white;\n    }\n\n    .chain-arrow {\n      color: var(--text-muted);\n      display: flex;\n      justify-content: center;\n      align-items: center;\n    }\n\n    .chain-arrow svg {\n      width: 14px;\n      height: 14px;\n    }\n\n    /* Part D Table Styling */\n    .edge-cases-table {\n      width: 100%;\n      border-collapse: collapse;\n      font-size: 12px;\n      margin-top: 4px;\n    }\n\n    .edge-cases-table th {\n      background-color: #f1f5f9;\n      color: var(--primary-navy);\n      font-weight: 700;\n      text-align: left;\n      padding: 10px 12px;\n      border-bottom: 2px solid var(--border-slate);\n    }\n\n    .edge-cases-table td {\n      padding: 10px 12px;\n      border-bottom: 1px solid #e2e8f0;\n      vertical-align: top;\n      color: var(--text-dark);\n      font-weight: 500;\n    }\n\n    .edge-cases-table tr:last-child td {\n      border-bottom: none;\n    }\n\n    .table-case-cell {\n      display: flex;\n      align-items: flex-start;\n      gap: 8px;\n    }\n\n    .table-case-cell svg {\n      flex-shrink: 0;\n      margin-top: 1px;\n    }\n\n    .table-case-cell .case-title {\n      font-weight: 700;\n      color: var(--primary-navy);\n    }\n\n    .table-case-cell .case-code {\n      font-family: var(--font-code);\n      background-color: #f1f5f9;\n      padding: 1px 4px;\n      border-radius: 4px;\n      font-size: 11px;\n      display: inline-block;\n      margin-top: 2px;\n    }\n\n    /* Bottom Grid: Part D & Part E */\n    .bottom-grid {\n      display: flex;\n      flex-direction: column;\n      gap: 20px;\n      min-width: 0;\n    }\n\n    .part-e-layout {\n      display: grid;\n      grid-template-columns: 1.1fr 1.3fr 1fr;\n      gap: 24px;\n      min-width: 0;\n    }\n\n    .part-e-layout > :not(:first-child) {\n      border-left: 1px solid var(--border-slate);\n      padding-left: 24px;\n    }\n\n    .mro-vs-box {\n      display: flex;\n      flex-direction: column;\n      gap: 8px;\n      align-items: center;\n      justify-content: center;\n      position: relative;\n    }\n\n    .mro-chain-summary {\n      background-color: var(--bg-light);\n      border: 1px solid var(--border-slate);\n      border-radius: 8px;\n      padding: 10px 12px;\n      font-size: 11.5px;\n      width: 100%;\n      font-weight: 500;\n      color: var(--text-dark);\n    }\n\n    .mro-chain-summary code {\n      font-family: var(--font-code);\n      font-size: 10px;\n      font-weight: 600;\n      color: var(--primary-magenta);\n      display: block;\n      margin-bottom: 4px;\n    }\n\n    .vs-divider {\n      background-color: var(--primary-magenta);\n      color: white;\n      font-size: 11px;\n      font-weight: 800;\n      width: 24px;\n      height: 24px;\n      border-radius: 50%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 10;\n      box-shadow: 0 2px 6px rgba(225, 29, 72, 0.3);\n      margin: 4px 0;\n    }\n\n    .scales-wrapper {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      margin-top: auto;\n      padding-top: 12px;\n      color: var(--primary-navy);\n    }\n\n    .scales-wrapper svg {\n      width: 48px;\n      height: 48px;\n    }\n\n    /* MRO Flow Diagram */\n    .mro-flow-card {\n      background-color: var(--bg-card);\n      border: 1px solid var(--border-slate);\n      border-radius: 16px;\n      padding: 16px;\n      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n    }\n\n    .mro-flow-header {\n      font-size: 12px;\n      font-weight: 800;\n      color: var(--primary-navy);\n      text-transform: uppercase;\n      letter-spacing: 0.5px;\n      text-align: center;\n      margin-bottom: 12px;\n      line-height: 1.2;\n    }\n\n    .mro-flow-header span {\n      display: block;\n      font-size: 10px;\n      color: var(--text-muted);\n      font-weight: 500;\n      margin-top: 2px;\n    }\n\n    .flow-box {\n      width: 100%;\n      max-width: 130px;\n      padding: 6px 10px;\n      border-radius: 8px;\n      text-align: center;\n      font-size: 11px;\n      font-weight: 700;\n      border: 1.5px solid var(--border-slate);\n      background-color: white;\n      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);\n    }\n\n    .flow-box.pink {\n      border-color: var(--primary-magenta);\n      color: var(--primary-magenta);\n      background-color: var(--bg-light-pink);\n    }\n\n    .flow-box.blue {\n      border-color: var(--accent-blue);\n      color: var(--accent-blue);\n      background-color: var(--bg-light-blue);\n    }\n\n    .flow-box.purple {\n      border-color: var(--accent-purple);\n      color: var(--accent-purple);\n      background-color: var(--bg-light-purple);\n    }\n\n    .flow-box.object {\n      border-color: #475569;\n      color: #475569;\n      background-color: #f1f5f9;\n    }\n\n    /* Footer Evaluating Bar */\n    .evaluating-bar {\n      background-color: var(--primary-navy);\n      color: white;\n      border-radius: 16px;\n      overflow: hidden;\n      display: grid;\n      grid-template-columns: 240px 1fr;\n      box-shadow: 0 4px 12px rgba(14, 23, 44, 0.15);\n    }\n\n    .evaluating-title {\n      background-color: #090e1d;\n      padding: 16px 20px;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      font-size: 14px;\n      font-weight: 800;\n      letter-spacing: 0.5px;\n      text-transform: uppercase;\n      border-right: 1px solid #1e293b;\n    }\n\n    .evaluating-title svg {\n      width: 24px;\n      height: 24px;\n      color: var(--primary-magenta);\n    }\n\n    .evaluating-checklist {\n      padding: 16px 24px;\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      gap: 12px;\n      flex-wrap: wrap;\n    }\n\n    .eval-item {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      font-size: 12px;\n      font-weight: 700;\n    }\n\n    .eval-item .check-circle.pink {\n      background-color: var(--bg-light-pink);\n      color: var(--primary-magenta);\n      width: 16px;\n      height: 16px;\n    }\n\n    .eval-item .check-circle.pink svg {\n      width: 10px;\n      height: 10px;\n    }\n\n    /* 20% Font Size Increase for all Card Contents */\n    .card-body {\n      font-size: 16px;\n    }\n    \n    .card-header {\n      font-size: 18px !important;\n    }\n    \n    .intro-box {\n      font-size: 15.5px !important;\n    }\n    \n    .bg-row-content {\n      font-size: 16px !important;\n    }\n    \n    .bg-row-content h4 {\n      font-size: 17.5px !important;\n    }\n    \n    .checklist-item {\n      font-size: 15.5px !important;\n    }\n    \n    .checklist-item code,\n    .checklist-item span code {\n      font-size: 14px !important;\n    }\n    \n    .part-badge {\n      font-size: 13px !important;\n      width: 26px !important;\n      height: 26px !important;\n    }\n    \n    .part-title {\n      font-size: 17px !important;\n    }\n    \n    .code-container {\n      font-size: 14px !important;\n    }\n    \n    .window-label {\n      font-size: 12.5px !important;\n    }\n    \n    .star-note-card p {\n      font-size: 14.5px !important;\n    }\n    \n    .vertical-chain-title {\n      font-size: 13px !important;\n    }\n    \n    .chain-box {\n      font-size: 13px !important;\n    }\n    \n    .edge-cases-table {\n      font-size: 14.5px !important;\n    }\n    \n    .table-case-cell .case-code {\n      font-size: 13px !important;\n    }\n    \n    .mro-chain-summary {\n      font-size: 14px !important;\n    }\n    \n    .mro-chain-summary code {\n      font-size: 12px !important;\n    }\n    \n    .vs-divider {\n      font-size: 13px !important;\n    }\n    \n    .flow-box {\n      font-size: 13px !important;\n    }\n    \n    .evaluating-title {\n      font-size: 17px !important;\n    }\n    \n    .eval-item {\n      font-size: 14.5px !important;\n    }\n\n    pre.code-content {\n      font-size: 13px !important;\n    }\n\n    .bg-row-icon span {\n      font-size: 24px !important;\n    }\n    \n    .what-you-need-layout span,\n    .part-e-layout span {\n      font-size: 16px !important;\n    }\n    \n    .part-e-layout p {\n      font-size: 13px !important;\n    }\n\n    .diagram-container svg text {\n      font-size: 14px !important;\n    }\n    .diagram-container svg text[y=\"46\"] {\n      font-size: 12.5px !important;\n    }\n    .diagram-container svg text[y=\"128\"] {\n      font-size: 12px !important;\n    }\n    .diagram-container svg text[y=\"200\"] {\n      font-size: 11.5px !important;\n    }\n    .diagram-container svg text[y=\"256\"] {\n      font-size: 11px !important;\n    }";

const originalMarkup = "<div class=\"container\">\n\n    <!-- Header Block -->\n    <header class=\"header-wrapper\">\n      <div class=\"assignment-badge\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n          stroke-linejoin=\"round\">\n          <path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path>\n          <polyline points=\"14 2 14 8 20 8\"></polyline>\n          <line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"></line>\n          <line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"></line>\n          <polyline points=\"10 9 9 9 8 9\"></polyline>\n        </svg>\n        <span class=\"badge-tag\">FAANG / MAANG</span>\n        <span class=\"badge-title\">TAKE-HOME<br>ASSIGNMENT</span>\n      </div>\n\n      <div class=\"title-block\">\n        <h1>\n          <span class=\"blue-text\">Multi-Protocol International</span><br>\n          <span class=\"magenta-text\">Banking Onboarding System</span>\n        </h1>\n        <div class=\"topics-bar\">\n          <svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"\n            stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <polyline points=\"16 18 22 12 16 6\"></polyline>\n            <polyline points=\"8 6 2 12 8 18\"></polyline>\n          </svg>\n          Topics: Cooperative Multiple Inheritance <span class=\"topics-dot\">•</span> MRO <span\n            class=\"topics-dot\">•</span> @classmethod Factories <span class=\"topics-dot\">•</span> Extensible Mixin Design\n        </div>\n      </div>\n\n      <div class=\"logo-block\">\n        <!-- SVG Python Logo styled with theme colors -->\n        <svg viewBox=\"0 0 110 110\" width=\"36\" height=\"36\">\n          <path\n            d=\"M55 2C25.7 2 26.6 14.5 26.6 14.5l.1 12.3H56v3.5H23.5S2 29.5 2 58.7c0 29.2 17.6 28 17.6 28h10.5V72.1s-.4-17.1 16.7-17.1h29.2s16.1.4 16.1-15.6V23.6S92 2 55 2zm-12.7 9.8c2.7 0 4.8 2.1 4.8 4.8s-2.1 4.8-4.8 4.8-4.8-2.1-4.8-4.8 2.1-4.8 4.8-4.8z\"\n            fill=\"var(--primary-magenta)\" />\n          <path\n            d=\"M55 108c29.3 0 28.4-12.5 28.4-12.5l-.1-12.3H54v-3.5h32.5s21.5.8 21.5-28.4c0-29.2-17.6-28-17.6-28H79.9v14.6s.4 17.1-16.7 17.1H34s-16.1-.4-16.1 15.6v15.8s.1 21.6 37.1 21.6zm12.7-9.8c2.7 0 4.8 2.1 4.8 4.8s-2.1 4.8-4.8 4.8-4.8-2.1-4.8-4.8 2.1-4.8 4.8-4.8z\"\n            fill=\"var(--primary-navy)\" />\n        </svg>\n        <span>python</span>\n      </div>\n    </header>\n\n    <!-- Sub-header Meta-bar -->\n    <div class=\"subheader-bar\">\n      <div class=\"subheader-box pink-box\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n          stroke-linejoin=\"round\">\n          <path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path>\n          <circle cx=\"8.5\" cy=\"7\" r=\"4\"></circle>\n          <circle cx=\"19\" cy=\"11\" r=\"2\"></circle>\n          <path d=\"M19 8v6\"></path>\n          <path d=\"M22 11h-6\"></path>\n        </svg>\n        <span class=\"box-text\">Level: <strong>Senior Backend Engineer</strong></span>\n      </div>\n      <div class=\"subheader-box blue-box\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n          stroke-linejoin=\"round\">\n          <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>\n          <polyline points=\"12 6 12 12 16 14\"></polyline>\n        </svg>\n        <span class=\"box-text\">Time Box: <strong>90 minutes</strong></span>\n      </div>\n      <div class=\"subheader-box purple-box\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n          stroke-linejoin=\"round\">\n          <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>\n          <circle cx=\"12\" cy=\"12\" r=\"6\"></circle>\n          <circle cx=\"12\" cy=\"12\" r=\"2\"></circle>\n        </svg>\n        <span class=\"box-text\">Goal: <strong>Design an extensible, maintainable, future-proof class\n            hierarchy</strong></span>\n      </div>\n    </div>\n\n    <!-- Row 1: Background & What You Need to Build -->\n    <div class=\"row-grid-2\">\n\n      <!-- COLUMN 1: Background -->\n      <div class=\"col-flex-container\">\n\n        <!-- Background Card -->\n        <div class=\"card\">\n          <div class=\"card-header\">Background</div>\n          <div class=\"card-body\" style=\"gap: 14px;\">\n            <div class=\"intro-box\">\n              <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n                stroke-linejoin=\"round\">\n                <path d=\"M3 21h18\"></path>\n                <path d=\"M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4\"></path>\n                <path d=\"M9 21h6\"></path>\n                <path d=\"M12 3v12\"></path>\n                <path d=\"M12 3L8 7\"></path>\n                <path d=\"M12 3l4 4\"></path>\n              </svg>\n              <span>IntlSBI must satisfy compliance requirements from three independent regulatory domains, each owned\n                by different teams.</span>\n            </div>\n\n            <div class=\"bg-row\">\n              <div class=\"bg-row-icon pink\">\n                <span style=\"font-size: 20px; font-weight: 800; line-height: 1;\">₹</span>\n              </div>\n              <div class=\"bg-row-content\">\n                <div class=\"bg-row-heading\">RBI Compliance</div>\n                <p>Every account must carry a currency and a <strong>vault_security_key</strong>.</p>\n              </div>\n            </div>\n\n            <div class=\"bg-row\">\n              <div class=\"bg-row-icon blue\">\n                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"\n                  stroke-linejoin=\"round\">\n                  <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>\n                  <line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\"></line>\n                  <path d=\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\">\n                  </path>\n                </svg>\n              </div>\n              <div class=\"bg-row-content\">\n                <div class=\"bg-row-heading\">SWIFT Protocol</div>\n                <p>Every account must carry a <strong>swift_code</strong> for wire routing.</p>\n              </div>\n            </div>\n\n            <div class=\"bg-row\">\n              <div class=\"bg-row-icon purple\">\n                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"\n                  stroke-linejoin=\"round\">\n                  <path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"></path>\n                  <circle cx=\"12\" cy=\"11\" r=\"3\"></circle>\n                </svg>\n              </div>\n              <div class=\"bg-row-content\">\n                <div class=\"bg-row-heading\">KYC Protocol</div>\n                <p>Every account must carry a <strong>kyc_level</strong>.</p>\n              </div>\n            </div>\n          </div>\n        </div>\n\n      </div>\n\n      <!-- COLUMN 2: What You Need to Build + Big Picture Architecture -->\n      <div class=\"col-flex-container\">\n\n        <!-- What You Need to Build -->\n        <div class=\"card\" style=\"height: 100%;\">\n          <div class=\"card-header gradient-pink\">What You Need to Build</div>\n          <div class=\"card-body\" style=\"padding: 20px;\">\n            <div class=\"what-you-need-layout\">\n              <div class=\"checklist\">\n                <div class=\"checklist-item bold-desc\">\n                  <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Cooperative mixin classes (RBI, SwiftProtocol, KYCProtocol) that call super().__init__(*args,\n                    **kwargs).</span>\n                </div>\n                <div class=\"checklist-item bold-desc\">\n                  <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>A composite class IntlSBI that works regardless of mixin order and accepts branch_code.</span>\n                </div>\n                <div class=\"checklist-item bold-desc\">\n                  <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Two @classmethod factories that parse different inputs generically (no hardcoded field-by-field\n                    mapping).</span>\n                </div>\n                <div class=\"checklist-item bold-desc\">\n                  <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Extensibility: A new mixin (<span style=\"color: var(--primary-magenta);\">FraudRiskProfile</span>)\n                    can be added without modifying existing code.</span>\n                </div>\n              </div>\n\n              <!-- Big Picture Architecture -->\n              <div style=\"display: flex; flex-direction: column; gap: 8px;\">\n                <span style=\"font-size: 13.5px; font-weight: 700; color: var(--primary-navy); text-align: center;\">Big Picture Architecture</span>\n                <div class=\"diagram-container\">\n                  <!-- SVG Architecture Diagram -->\n                  <svg width=\"100%\" height=\"240\" viewBox=\"0 0 500 270\" style=\"display: block;\">\n                    <defs>\n                      <!-- Arrow Markers -->\n                      <marker id=\"arrowhead\" markerWidth=\"6\" markerHeight=\"6\" refX=\"5\" refY=\"3\" orient=\"auto\">\n                        <polygon points=\"0 0, 6 3, 0 6\" fill=\"#64748b\" />\n                      </marker>\n                      <marker id=\"arrowhead-red\" markerWidth=\"6\" markerHeight=\"6\" refX=\"5\" refY=\"3\" orient=\"auto\">\n                        <polygon points=\"0 0, 6 3, 0 6\" fill=\"var(--primary-magenta)\" />\n                      </marker>\n                    </defs>\n\n                    <!-- TOP BOXES -->\n                    <!-- RBI -->\n                    <rect x=\"15\" y=\"10\" width=\"135\" height=\"50\" rx=\"8\" fill=\"var(--bg-light-pink)\" stroke=\"var(--border-pink)\" stroke-width=\"1.5\" />\n                    <text x=\"82.5\" y=\"30\" font-family=\"'Outfit', sans-serif\" font-size=\"12\" font-weight=\"700\" fill=\"#0f172a\"\n                      text-anchor=\"middle\">RBI</text>\n                    <text x=\"82.5\" y=\"46\" font-family=\"'Outfit', sans-serif\" font-size=\"10.5\" font-weight=\"500\"\n                      fill=\"#64748b\" text-anchor=\"middle\">(currency)</text>\n\n                    <!-- SwiftProtocol -->\n                    <rect x=\"182.5\" y=\"10\" width=\"135\" height=\"50\" rx=\"8\" fill=\"#eff6ff\" stroke=\"#bfdbfe\"\n                      stroke-width=\"1.5\" />\n                    <text x=\"250\" y=\"30\" font-family=\"'Outfit', sans-serif\" font-size=\"12\" font-weight=\"700\" fill=\"#0f172a\"\n                      text-anchor=\"middle\">SwiftProtocol</text>\n                    <text x=\"250\" y=\"46\" font-family=\"'Outfit', sans-serif\" font-size=\"10.5\" font-weight=\"500\"\n                      fill=\"#64748b\" text-anchor=\"middle\">(swift_code)</text>\n\n                    <!-- KYCProtocol -->\n                    <rect x=\"350\" y=\"10\" width=\"135\" height=\"50\" rx=\"8\" fill=\"#faf5ff\" stroke=\"#e9d5ff\"\n                      stroke-width=\"1.5\" />\n                    <text x=\"417.5\" y=\"30\" font-family=\"'Outfit', sans-serif\" font-size=\"12\" font-weight=\"700\"\n                      fill=\"#0f172a\" text-anchor=\"middle\">KYCProtocol</text>\n                    <text x=\"417.5\" y=\"46\" font-family=\"'Outfit', sans-serif\" font-size=\"10.5\" font-weight=\"500\"\n                      fill=\"#64748b\" text-anchor=\"middle\">(kyc_level)</text>\n\n                    <!-- MIDDLE BOX -->\n                    <!-- IntlSBI -->\n                    <rect x=\"150\" y=\"95\" width=\"200\" height=\"42\" rx=\"8\" fill=\"var(--primary-navy)\" stroke=\"#1e293b\" stroke-width=\"1\" />\n                    <text x=\"250\" y=\"114\" font-family=\"'Outfit', sans-serif\" font-size=\"12.5\" font-weight=\"700\"\n                      fill=\"#ffffff\" text-anchor=\"middle\">IntlSBI</text>\n                    <text x=\"250\" y=\"128\" font-family=\"'Outfit', sans-serif\" font-size=\"10\" font-weight=\"500\" fill=\"#cbd5e1\"\n                      text-anchor=\"middle\">(branch_code)</text>\n\n                    <!-- Top-to-Middle Connectors -->\n                    <path d=\"M82.5 60 L82.5 75 L210 75 L210 90\" fill=\"none\" stroke=\"#64748b\" stroke-width=\"1.5\"\n                      stroke-dasharray=\"3,3\" marker-end=\"url(#arrowhead)\" />\n                    <path d=\"M250 60 L250 90\" fill=\"none\" stroke=\"#64748b\" stroke-width=\"1.5\" stroke-dasharray=\"3,3\"\n                      marker-end=\"url(#arrowhead)\" />\n                    <path d=\"M417.5 60 L417.5 75 L290 75 L290 90\" fill=\"none\" stroke=\"#64748b\" stroke-width=\"1.5\"\n                      stroke-dasharray=\"3,3\" marker-end=\"url(#arrowhead)\" />\n\n                    <!-- BOTTOM-MID BOXES -->\n                    <!-- from_swift_message -->\n                    <rect x=\"15\" y=\"170\" width=\"220\" height=\"40\" rx=\"8\" fill=\"#ecfdf5\" stroke=\"#a7f3d0\"\n                      stroke-width=\"1.5\" />\n                    <!-- green file sheet icon wrapper in SVG -->\n                    <g transform=\"translate(25, 180)\">\n                      <path d=\"M12 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6z\" fill=\"none\" stroke=\"#10b981\"\n                        stroke-width=\"1.5\" />\n                      <path d=\"M12 2v4h4\" fill=\"none\" stroke=\"#10b981\" stroke-width=\"1.5\" />\n                    </g>\n                    <text x=\"145\" y=\"187\" font-family=\"'Outfit', sans-serif\" font-size=\"11\" font-weight=\"700\" fill=\"#065f46\"\n                      text-anchor=\"middle\">from_swift_message()</text>\n                    <text x=\"145\" y=\"200\" font-family=\"'Outfit', sans-serif\" font-size=\"9.5\" font-weight=\"500\"\n                      fill=\"#059669\" text-anchor=\"middle\">(raw message)</text>\n\n                    <!-- from_admin_registration -->\n                    <rect x=\"265\" y=\"170\" width=\"220\" height=\"40\" rx=\"8\" fill=\"#fffbeb\" stroke=\"#fde68a\"\n                      stroke-width=\"1.5\" />\n                    <g transform=\"translate(275, 180)\">\n                      <path d=\"M12 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6z\" fill=\"none\" stroke=\"#d97706\"\n                        stroke-width=\"1.5\" />\n                      <path d=\"M12 2v4h4\" fill=\"none\" stroke=\"#d97706\" stroke-width=\"1.5\" />\n                    </g>\n                    <text x=\"390\" y=\"187\" font-family=\"'Outfit', sans-serif\" font-size=\"11\" font-weight=\"700\" fill=\"#92400e\"\n                      text-anchor=\"middle\">from_admin_registration()</text>\n                    <text x=\"390\" y=\"200\" font-family=\"'Outfit', sans-serif\" font-size=\"9.5\" font-weight=\"500\"\n                      fill=\"#d97706\" text-anchor=\"middle\">(JSON form)</text>\n\n                    <!-- Middle-to-Bottom-Mid Connectors -->\n                    <path d=\"M250 137 L250 152 L125 152 L125 165\" fill=\"none\" stroke=\"#64748b\" stroke-width=\"1.5\"\n                      marker-end=\"url(#arrowhead)\" />\n                    <path d=\"M250 137 L250 152 L375 152 L375 165\" fill=\"none\" stroke=\"#64748b\" stroke-width=\"1.5\"\n                      marker-end=\"url(#arrowhead)\" />\n\n                    <!-- BOTTOM-MOST BOX -->\n                    <!-- One Validated Object -->\n                    <rect x=\"150\" y=\"232\" width=\"200\" height=\"32\" rx=\"8\" fill=\"var(--bg-light-pink)\" stroke=\"var(--border-pink)\"\n                      stroke-width=\"1.5\" />\n                    <text x=\"250\" y=\"244\" font-family=\"'Outfit', sans-serif\" font-size=\"11\" font-weight=\"800\" fill=\"var(--primary-magenta)\"\n                      text-anchor=\"middle\">One Validated Object</text>\n                    <text x=\"250\" y=\"256\" font-family=\"'Outfit', sans-serif\" font-size=\"9\" font-weight=\"700\" fill=\"var(--primary-magenta-hover)\"\n                      text-anchor=\"middle\">Same for all channels</text>\n\n                    <!-- Bottom-Mid-to-Bottom-Most Connectors -->\n                    <path d=\"M125 210 L125 224 L210 224 L210 230\" fill=\"none\" stroke=\"var(--primary-magenta)\" stroke-width=\"1.2\"\n                      marker-end=\"url(#arrowhead-red)\" />\n                    <path d=\"M375 210 L375 224 L290 224 L290 230\" fill=\"none\" stroke=\"var(--primary-magenta)\" stroke-width=\"1.2\"\n                      marker-end=\"url(#arrowhead-red)\" />\n                  </svg>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n      </div>\n\n    </div>\n\n    <!-- Row 2: Part A & Starter Skeleton -->\n    <div class=\"row-grid-2\">\n\n      <!-- COLUMN 1: Part A – Core Requirements -->\n      <div class=\"col-flex-container\">\n\n        <div class=\"card\" style=\"height: 100%;\">\n          <div class=\"card-header\">Part A – Core Requirements</div>\n          <div class=\"card-body\" style=\"gap: 14px;\">\n\n            <div class=\"part-section\">\n              <div class=\"part-title-wrapper\">\n                <span class=\"part-badge\">A1</span>\n                <span class=\"part-title\">Cooperative Multiple Inheritance</span>\n              </div>\n              <div class=\"checklist\">\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Create mixin classes: <code style=\"font-weight: 700; color: var(--primary-magenta);\">RBI</code>,\n                    <code style=\"font-weight: 700; color: var(--accent-blue);\">SwiftProtocol</code>, <code\n                      style=\"font-weight: 700; color: var(--accent-purple);\">KYCProtocol</code>.</span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Each accepts exactly one attribute it owns.</span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Each MUST call <code\n                      style=\"font-family: var(--font-code); font-size: 11.5px; font-weight: 600;\">super().__init__(*args, **kwargs)</code>.</span>\n                </div>\n              </div>\n            </div>\n\n            <div class=\"part-section\">\n              <div class=\"part-title-wrapper\">\n                <span class=\"part-badge\">A2</span>\n                <span class=\"part-title\">The Composite Class</span>\n              </div>\n              <div class=\"checklist\">\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Create <code\n                      style=\"font-weight: 700; color: var(--primary-navy);\">IntlSBI(RBI, SwiftProtocol, KYCProtocol)</code>.</span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Accepts its own attribute: <code\n                      style=\"font-weight: 700; color: var(--primary-magenta);\">branch_code</code>.</span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>All four attributes must be set correctly.</span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>No hardcoded routing of fields.</span>\n                </div>\n              </div>\n            </div>\n\n            <div class=\"part-section\">\n              <div class=\"part-title-wrapper\">\n                <span class=\"part-badge\">A3</span>\n                <span class=\"part-title\">@classmethod Factories</span>\n              </div>\n              <div class=\"checklist\">\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span><code\n                      style=\"font-weight: 700; color: var(--primary-magenta);\">from_swift_message(raw: str)</code>\n                    &rarr; Parses semicolon format: <code\n                      style=\"font-family: var(--font-code); font-size: 11px;\">\"CCY;...;SWIFT;...;BRANCH;...;KYC;...\"</code></span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span><code\n                      style=\"font-weight: 700; color: var(--primary-magenta);\">from_admin_registration(json: str)</code>\n                    &rarr; Parses JSON generically and forwards via <code\n                      style=\"font-family: var(--font-code); font-size: 11.5px; font-weight: 600;\">cls(**data)</code>.</span>\n                </div>\n              </div>\n            </div>\n\n          </div>\n        </div>\n\n      </div>\n\n      <!-- COLUMN 2: Starter Skeleton -->\n      <div class=\"col-flex-container\">\n\n        <!-- Starter Skeleton -->\n        <div class=\"card\" style=\"height: 100%;\">\n          <div class=\"card-header\">\n            <div class=\"window-dots\">\n              <div class=\"window-dot red\"></div>\n              <div class=\"window-dot yellow\"></div>\n              <div class=\"window-dot green\"></div>\n            </div>\n            <div class=\"window-label\">Starter Skeleton (What You're Given)</div>\n            <div></div>\n          </div>\n          <div class=\"card-body\" style=\"padding: 14px; background-color: var(--bg-dark); gap: 12px; flex-grow: 1; display: flex; flex-direction: column;\">\n            <div class=\"starter-skeleton-layout\" style=\"flex-grow: 1;\">\n              <!-- Left Column: Mixins -->\n              <div class=\"code-container\" style=\"border: none;\">\n                <pre class=\"code-content\" style=\"padding: 0; font-size: 11px; line-height: 1.4;\"><span class=\"kw\">class</span> <span class=\"cls\">RBI</span>:\n    <span class=\"kw\">def</span> <span class=\"fn\">__init__</span>(<span class=\"var\">self</span>, currency, *args, **kwargs):\n        <span class=\"cm\"># TODO</span>\n        <span class=\"kw\">pass</span>\n\n<span class=\"kw\">class</span> <span class=\"cls\">SwiftProtocol</span>:\n    <span class=\"kw\">def</span> <span class=\"fn\">__init__</span>(<span class=\"var\">self</span>, swift_code, *args, **kwargs):\n        <span class=\"cm\"># TODO</span>\n        <span class=\"kw\">pass</span>\n\n<span class=\"kw\">class</span> <span class=\"cls\">KYCProtocol</span>:\n    <span class=\"kw\">def</span> <span class=\"fn\">__init__</span>(<span class=\"var\">self</span>, kyc_level, *args, **kwargs):\n        <span class=\"cm\"># TODO</span>\n        <span class=\"kw\">pass</span></pre>\n              </div>\n\n              <!-- Right Column: Composite and Premium -->\n              <div class=\"code-container\" style=\"border: none;\">\n                <pre class=\"code-content\" style=\"padding: 0; font-size: 11px; line-height: 1.4;\"><span class=\"kw\">class</span> <span class=\"cls\">IntlSBI</span>(<span class=\"cls\">RBI</span>, <span class=\"cls\">SwiftProtocol</span>, <span class=\"cls\">KYCProtocol</span>):\n    <span class=\"kw\">def</span> <span class=\"fn\">__init__</span>(<span class=\"var\">self</span>, branch_code=<span class=\"kw\">None</span>, *args, **kwargs):\n        <span class=\"cm\"># TODO: forward correctly, no hardcoding</span>\n        <span class=\"kw\">pass</span>\n\n    <span class=\"kw\">@classmethod</span>\n    <span class=\"kw\">def</span> <span class=\"fn\">from_swift_message</span>(<span class=\"var\">cls</span>, raw: str) -&gt; <span class=\"str\">\"IntlSBI\"</span>:\n        <span class=\"cm\"># TODO</span>\n        <span class=\"kw\">pass</span>\n\n    <span class=\"kw\">@classmethod</span>\n    <span class=\"kw\">def</span> <span class=\"fn\">from_admin_registration</span>(<span class=\"var\">cls</span>, form_json: str) -&gt; <span class=\"str\">\"IntlSBI\"</span>:\n        <span class=\"cm\"># TODO</span>\n        <span class=\"kw\">pass</span>\n\n<span class=\"kw\">class</span> <span class=\"cls\">IntlSBIPremium</span>(<span class=\"cls\">IntlSBI</span>):\n    <span class=\"kw\">def</span> <span class=\"fn\">__init__</span>(<span class=\"var\">self</span>, relationship_manager=<span class=\"str\">\"unassigned\"</span>, *args, **kwargs):\n        <span class=\"cm\"># TODO</span>\n        <span class=\"kw\">pass</span></pre>\n              </div>\n\n              <!-- Bottom Note -->\n              <div class=\"star-note-card\">\n                <svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"currentColor\">\n                  <path d=\"M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z\"/>\n                </svg>\n                <p>Candidate must also demonstrate Part B (FraudRiskProfile extensibility) and Part D (edge case handling) with their own test code below.</p>\n              </div>\n\n            </div>\n          </div>\n        </div>\n\n      </div>\n\n    </div>\n\n    <!-- Row 2: Part B & Part C -->\n    <div class=\"mid-grid\">\n\n      <!-- Part B Card -->\n      <div class=\"card\">\n        <div class=\"card-header\">Part B – Extensibility Test</div>\n        <div class=\"card-body\" style=\"gap: 10px;\">\n          <p style=\"font-size: 13px; font-weight: 500; color: var(--primary-navy);\">After Part A is done, another team\n            adds:</p>\n\n          <div class=\"code-container\">\n            <pre class=\"code-content\" style=\"padding: 8px 12px; font-size: 11px; line-height: 1.4;\"><span class=\"kw\">class</span> <span class=\"cls\">FraudRiskProfile</span>:\n    <span class=\"kw\">def</span> <span class=\"fn\">__init__</span>(<span class=\"var\">self</span>, risk_score, *args, **kwargs):\n        <span class=\"var\">super</span>().<span class=\"fn\">__init__</span>(*args, **kwargs)\n        <span class=\"var\">self</span>.risk_score = risk_score</pre>\n          </div>\n\n          <div class=\"arrow-divider\">\n            <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n              stroke-linejoin=\"round\">\n              <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n              <polyline points=\"19 12 12 19 5 12\"></polyline>\n            </svg>\n          </div>\n\n          <p style=\"font-size: 13px; font-weight: 500; color: var(--primary-navy);\">Without modifying any existing\n            code:</p>\n\n          <div class=\"code-container\">\n            <pre class=\"code-content\"\n              style=\"padding: 8px 12px; font-size: 11px; line-height: 1.4;\"><span class=\"kw\">class</span> <span class=\"cls\">IntlSBI</span>(<span class=\"cls\">RBI</span>, <span class=\"cls\">SwiftProtocol</span>, <span class=\"cls\">KYCProtocol</span>, <span class=\"cls\">FraudRiskProfile</span>):\n    <span class=\"kw\">pass</span>\n\nnode = <span class=\"cls\">IntlSBI</span>(\n    currency=<span class=\"str\">\"INR\"</span>, swift_code=<span class=\"str\">\"SBININBBXXX\"</span>,\n    branch_code=<span class=\"str\">\"SBI-INT-001\"</span>, kyc_level=<span class=\"str\">\"FULL_KYC\"</span>,\n    risk_score=<span class=\"num\">42</span>,\n)\n\n<div class=\"assert-line-wrapper\"><span><span class=\"kw\">assert</span> node.risk_score == <span class=\"num\">42</span></span><span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span></div></pre>\n          </div>\n\n          <div class=\"tip-card\">\n            <svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"\n              stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <path\n                d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\">\n              </path>\n              <line x1=\"9\" y1=\"18\" x2=\"15\" y2=\"18\"></line>\n              <line x1=\"10\" y1=\"22\" x2=\"14\" y2=\"22\"></line>\n            </svg>\n            <p>If you had to change <strong>IntlSBI.__init__</strong> body to make this work, the design is\n              <strong>NOT extensible</strong>.\n            </p>\n          </div>\n        </div>\n      </div>\n      <!-- Part C Card -->\n      <div class=\"card\">\n        <div class=\"card-header gradient-pink\">Part C – Subclassing Correctness</div>\n        <div class=\"card-body\">\n          <div class=\"part-c-layout\">\n            <div style=\"display: flex; flex-direction: column; gap: 12px;\">\n              <div class=\"code-container\">\n                <pre class=\"code-content\"\n                  style=\"padding: 10px 12px; font-size: 10.5px; line-height: 1.4;\">premium = <span class=\"cls\">IntlSBIPremium</span>.from_admin_registration(json.dumps({\n    <span class=\"str\">\"currency\"</span>: <span class=\"str\">\"USD\"</span>,\n    <span class=\"str\">\"swift_code\"</span>: <span class=\"str\">\"SBIUSXXXXX\"</span>,\n    <span class=\"str\">\"branch_code\"</span>: <span class=\"str\">\"SBI-NY-001\"</span>,\n    <span class=\"str\">\"kyc_level\"</span>: <span class=\"str\">\"FULL_KYC\"</span>,\n    <span class=\"str\">\"relationship_manager\"</span>: <span class=\"str\">\"Meera Nair\"</span>,\n}))\n\n<div class=\"assert-line-wrapper\"><span><span class=\"kw\">assert</span> type(premium) <span class=\"kw\">is</span> <span class=\"cls\">IntlSBIPremium</span></span><span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span></div>\n<div class=\"assert-line-wrapper\"><span><span class=\"kw\">assert</span> premium.relationship_manager == <span class=\"str\">\"Meera Nair\"</span></span><span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span></div></pre>\n              </div>\n\n              <div class=\"checklist\" style=\"gap: 8px;\">\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>Factories must work through inheritance (use <code\n                      style=\"font-weight: 700; color: var(--primary-magenta);\">cls</code>).</span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>IntlSBIPremium should not override the factories.</span>\n                </div>\n                <div class=\"checklist-item\">\n                  <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n                      stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\"></polyline>\n                    </svg></span>\n                  <span>If relationship_manager is omitted &rarr; defaults to \"unassigned\".</span>\n                </div>\n              </div>\n            </div>\n\n            <!-- Inheritance Chain -->\n            <div class=\"vertical-chain\">\n              <span class=\"vertical-chain-title\">Inheritance Chain</span>\n              <div class=\"chain-box\">object</div>\n              <div class=\"chain-arrow\">\n                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n                  stroke-linejoin=\"round\">\n                  <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                  <polyline points=\"19 12 12 19 5 12\"></polyline>\n                </svg>\n              </div>\n              <div class=\"chain-box pink\">RBI</div>\n              <div class=\"chain-arrow\">\n                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n                  stroke-linejoin=\"round\">\n                  <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                  <polyline points=\"19 12 12 19 5 12\"></polyline>\n                </svg>\n              </div>\n              <div class=\"chain-box blue\">SwiftProtocol</div>\n              <div class=\"chain-arrow\">\n                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n                  stroke-linejoin=\"round\">\n                  <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                  <polyline points=\"19 12 12 19 5 12\"></polyline>\n                </svg>\n              </div>\n              <div class=\"chain-box purple\">KYCProtocol</div>\n              <div class=\"chain-arrow\">\n                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n                  stroke-linejoin=\"round\">\n                  <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                  <polyline points=\"19 12 12 19 5 12\"></polyline>\n                </svg>\n              </div>\n              <div class=\"chain-box navy\">IntlSBI</div>\n              <div class=\"chain-arrow\">\n                <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"\n                  stroke-linejoin=\"round\">\n                  <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                  <polyline points=\"19 12 12 19 5 12\"></polyline>\n                </svg>\n              </div>\n              <div class=\"chain-box pink\">IntlSBIPremium</div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- Row 3: Part D & Part E -->\n    <div class=\"bottom-grid\">\n\n      <!-- Part D Card -->\n      <div class=\"card\">\n        <div class=\"card-header\">Part D – Edge Cases & Validation</div>\n        <div class=\"card-body\" style=\"padding: 10px;\">\n          <table class=\"edge-cases-table\">\n            <thead>\n              <tr>\n                <th style=\"width: 32%;\">Case</th>\n                <th style=\"width: 30%;\">What To Do</th>\n                <th style=\"width: 38%;\">Expected Behavior</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr>\n                <td>\n                  <div class=\"table-case-cell\">\n                    <!-- Envelope / X icon -->\n                    <svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"var(--primary-magenta)\" stroke-width=\"2\"\n                      stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"></rect>\n                      <path d=\"M22 6l-10 7L2 6\"></path>\n                      <path d=\"M12 13v9\" stroke-dasharray=\"3,3\"></path>\n                      <line x1=\"19\" y1=\"16\" x2=\"15\" y2=\"20\" stroke-width=\"2.5\"></line>\n                      <line x1=\"15\" y1=\"16\" x2=\"19\" y2=\"20\" stroke-width=\"2.5\"></line>\n                    </svg>\n                    <div>\n                      <div class=\"case-title\">from_swift_message</div>\n                      <div style=\"font-size: 11px; margin-top: 2px; color: var(--text-dark);\">missing KYC field</div>\n                    </div>\n                  </div>\n                </td>\n                <td>Handle missing key</td>\n                <td style=\"font-weight: 600;\">Raise clear error (KeyError or ValueError), not None</td>\n              </tr>\n              <tr>\n                <td>\n                  <div class=\"table-case-cell\">\n                    <!-- Warning triangle icon -->\n                    <svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"#d97706\" stroke-width=\"2\"\n                      stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <path\n                        d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\">\n                      </path>\n                      <line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"></line>\n                      <line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"></line>\n                    </svg>\n                    <div>\n                      <div class=\"case-title\">IntlSBI() without</div>\n                      <span class=\"case-code\">kyc_level</span>\n                    </div>\n                  </div>\n                </td>\n                <td>Let Python raise</td>\n                <td>\n                  <code\n                    style=\"font-family: var(--font-code); font-size: 10px; color: #b45309; word-break: break-all;\">TypeError: KYCProtocol.__init__() missing 1 required positional argument: 'kyc_level'</code>\n                </td>\n              </tr>\n              <tr>\n                <td>\n                  <div class=\"table-case-cell\">\n                    <!-- Overlapping spheres / clash icon -->\n                    <svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"#7c3aed\" stroke-width=\"2\"\n                      stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path>\n                      <path d=\"M8 10h.01\"></path>\n                      <path d=\"M12 10h.01\"></path>\n                      <path d=\"M16 10h.01\"></path>\n                    </svg>\n                    <div>\n                      <div class=\"case-title\">Two mixins claim</div>\n                      <div style=\"font-size: 11px; margin-top: 2px; color: var(--text-dark);\">the same parameter</div>\n                    </div>\n                  </div>\n                </td>\n                <td>Explain in 2-3 lines</td>\n                <td style=\"color: var(--text-muted);\">Design smell: ambiguity. Catch via code review, duplicate\n                  parameter audit, or unit tests.</td>\n              </tr>\n              <tr>\n                <td>\n                  <div class=\"table-case-cell\">\n                    <!-- User icon -->\n                    <svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2\"\n                      stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                      <path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"></path>\n                      <circle cx=\"12\" cy=\"7\" r=\"4\"></circle>\n                    </svg>\n                    <div>\n                      <div class=\"case-title\">IntlSBIPremium via<br>factory without</div>\n                      <span class=\"case-code\">relationship_manager</span>\n                    </div>\n                  </div>\n                </td>\n                <td>Default value handling</td>\n                <td style=\"font-weight: 600;\">Defaults to \"unassigned\" (no error)</td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      </div>\n\n      <!-- Part E Card -->\n      <div class=\"card\">\n        <div class=\"card-header gradient-purple\">Part E – Bonus / Stretch Goal</div>\n        <div class=\"card-body\">\n          <div class=\"part-e-layout\">\n\n            <!-- Column E1: Print the MRO -->\n            <div style=\"display: flex; flex-direction: column; gap: 8px;\">\n              <span style=\"font-size: 13.5px; font-weight: 700; color: var(--primary-navy);\">Print the MRO</span>\n              <div class=\"code-container\">\n                <pre class=\"code-content\" style=\"padding: 10px; font-size: 10px; line-height: 1.4;\"><span class=\"fn\">print</span>(<span class=\"cls\">IntlSBI</span>.<span class=\"var\">__mro__</span>)\n\n<span class=\"cm\"># Output example:</span>\n<span class=\"cm\"># (&lt;class '__main__.IntlSBI'&gt;,</span>\n<span class=\"cm\">#  &lt;class '__main__.RBI'&gt;,</span>\n<span class=\"cm\">#  &lt;class '__main__.SwiftProtocol'&gt;,</span>\n<span class=\"cm\">#  &lt;class '__main__.KYCProtocol'&gt;,</span>\n<span class=\"cm\">#  &lt;class 'object'&gt;)</span></pre>\n              </div>\n            </div>\n\n            <!-- Column E2: Why Order Matters & What Changes If Reordered -->\n            <div style=\"display: flex; flex-direction: column; gap: 16px;\">\n              \n              <!-- Sub-section: Why Order Matters? -->\n              <div style=\"display: flex; flex-direction: column; gap: 8px;\">\n                <span style=\"font-size: 13.5px; font-weight: 700; color: var(--primary-navy); text-align: center;\">Why Order Matters?</span>\n                <p style=\"font-size: 11px; font-weight: 500; color: var(--text-muted); text-align: center; line-height: 1.35;\">\n                  The order <strong style=\"color: var(--primary-navy);\">RBI, SwiftProtocol, KYCProtocol</strong> determines the Method Resolution Order (MRO). Python calls <strong style=\"color: var(--primary-navy);\">super()</strong> according to this order.\n                </p>\n\n                <div class=\"mro-vs-box\">\n                  <div class=\"mro-chain-summary\">\n                    <code>IntlSBI(RBI, SwiftProtocol, KYCProtocol)</code>\n                    RBI &rarr; SwiftProtocol &rarr; KYCProtocol &rarr; object\n                  </div>\n\n                  <div class=\"vs-divider\">VS</div>\n\n                  <div class=\"mro-chain-summary\">\n                    <code>IntlSBI(KYCProtocol, RBI, SwiftProtocol)</code>\n                    KYCProtocol &rarr; RBI &rarr; SwiftProtocol &rarr; object\n                  </div>\n                </div>\n              </div>\n\n              <!-- Sub-section: What Changes If Reordered? -->\n              <div style=\"display: flex; flex-direction: column; gap: 10px; margin-top: 8px;\">\n                <span style=\"font-size: 13.5px; font-weight: 700; color: var(--primary-navy); text-align: center;\">What Changes If Reordered?</span>\n\n                <div class=\"checklist\" style=\"gap: 8px;\">\n                  <div class=\"checklist-item\">\n                    <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span>\n                    <span>The initialization call order changes.</span>\n                  </div>\n                  <div class=\"checklist-item\">\n                    <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span>\n                    <span>super() will follow the new MRO.</span>\n                  </div>\n                  <div class=\"checklist-item\">\n                    <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span>\n                    <span>All attributes still set (if each mixin cooperates).</span>\n                  </div>\n                  <div class=\"checklist-item\">\n                    <span class=\"check-circle green\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg></span>\n                    <span>But debugging order & side-effects may differ.</span>\n                  </div>\n                </div>\n\n                <!-- Scales of Justice Icon -->\n                <div class=\"scales-wrapper\" style=\"padding-top: 4px;\">\n                  <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"width: 32px; height: 32px; display: block; margin: 0 auto; color: var(--primary-navy);\">\n                    <line x1=\"12\" y1=\"3\" x2=\"12\" y2=\"21\"></line>\n                    <line x1=\"4\" y1=\"7\" x2=\"20\" y2=\"7\"></line>\n                    <path d=\"M4 7l2 11c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2l2-11\"></path>\n                    <path d=\"M2 7h20\"></path>\n                    <circle cx=\"6\" cy=\"18\" r=\"2\"></circle>\n                    <circle cx=\"18\" cy=\"18\" r=\"2\"></circle>\n                  </svg>\n                </div>\n              </div>\n\n            </div>\n\n            <!-- Column E3: MRO Visual Flow -->\n            <div style=\"display: flex; flex-direction: column; gap: 8px; align-items: center;\">\n              <span style=\"font-size: 13.5px; font-weight: 700; color: var(--primary-navy); text-align: center; text-transform: uppercase; letter-spacing: 0.5px;\">MRO Visual Flow<br><span style=\"font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: none;\">(Current Order)</span></span>\n              \n              <div class=\"vertical-chain\" style=\"width: 100%; gap: 6px; margin-top: 8px;\">\n                <div class=\"flow-box pink\">IntlSBI</div>\n                <div class=\"chain-arrow\">\n                  <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                    <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                    <polyline points=\"19 12 12 19 5 12\"></polyline>\n                  </svg>\n                </div>\n                <div class=\"flow-box pink\" style=\"border-width: 1.5px;\">RBI</div>\n                <div class=\"chain-arrow\">\n                  <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                    <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                    <polyline points=\"19 12 12 19 5 12\"></polyline>\n                  </svg>\n                </div>\n                <div class=\"flow-box blue\">SwiftProtocol</div>\n                <div class=\"chain-arrow\">\n                  <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                    <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                    <polyline points=\"19 12 12 19 5 12\"></polyline>\n                  </svg>\n                </div>\n                <div class=\"flow-box purple\">KYCProtocol</div>\n                <div class=\"chain-arrow\">\n                  <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                    <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line>\n                    <polyline points=\"19 12 12 19 5 12\"></polyline>\n                  </svg>\n                </div>\n                <div class=\"flow-box object\">object</div>\n              </div>\n            </div>\n\n          </div>\n        </div>\n\n    </div>\n\n    <!-- Footer Evaluators Bar -->\n    <footer class=\"evaluating-bar\">\n      <div class=\"evaluating-title\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"\n          stroke-linejoin=\"round\">\n          <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>\n          <circle cx=\"12\" cy=\"12\" r=\"6\"></circle>\n          <circle cx=\"12\" cy=\"12\" r=\"2\"></circle>\n        </svg>\n        <span>What Interviewers<br>Are Evaluating</span>\n      </div>\n      <div class=\"evaluating-checklist\">\n        <div class=\"eval-item\">\n          <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"\n              stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <polyline points=\"20 6 9 17 4 12\"></polyline>\n            </svg></span>\n          <span>Uses *args, **kwargs forwarding correctly</span>\n        </div>\n        <div class=\"eval-item\">\n          <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"\n              stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <polyline points=\"20 6 9 17 4 12\"></polyline>\n            </svg></span>\n          <span>Uses cls in factories (not hardcoded class)</span>\n        </div>\n        <div class=\"eval-item\">\n          <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"\n              stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <polyline points=\"20 6 9 17 4 12\"></polyline>\n            </svg></span>\n          <span>Part B works without editing Part A code</span>\n        </div>\n        <div class=\"eval-item\">\n          <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"\n              stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <polyline points=\"20 6 9 17 4 12\"></polyline>\n            </svg></span>\n          <span>Explains MRO and reordering clearly</span>\n        </div>\n        <div class=\"eval-item\">\n          <span class=\"check-circle pink\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"\n              stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <polyline points=\"20 6 9 17 4 12\"></polyline>\n            </svg></span>\n          <span>Identifies edge cases and explains well</span>\n        </div>\n      </div>\n    </footer>\n\n  </div>";

const responsiveStyles = `
  body {
    width: 100%;
  }

  :root {
    --accent-blue: #1d4ed8;
    --accent-purple: #6d28d9;
    --code-muted: #cbd5e1;
  }

  .assignment-badge .badge-tag {
    opacity: 1;
  }

  .bg-row-heading {
    font-size: 14.5px;
    font-weight: 700;
    margin-bottom: 2px;
    color: var(--primary-navy);
  }

  .brand-logo-img {
    display: block;
    width: auto;
    max-width: 170px;
    max-height: 56px;
    object-fit: contain;
  }

  .brand-logo-img.rth {
    width: 56px;
    height: 56px;
  }

  .brand-logo-img.skillup {
    width: 170px;
    height: auto;
  }

  .logo-block {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .technology-logo {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    color: #374151;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
  }

  .technology-logo svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  .bg-row-icon.blue,
  .subheader-box.blue-box svg,
  .chain-box.blue,
  .flow-box.blue {
    color: #1d4ed8;
  }

  .bg-row-icon.purple,
  .subheader-box.purple-box svg,
  .chain-box.purple,
  .flow-box.purple {
    color: #6d28d9;
  }

  .cm,
  .window-label {
    color: var(--code-muted);
  }

  .chain-arrow,
  .mro-flow-header span {
    color: #475569;
  }

  .check-circle.pink,
  .mro-chain-summary code,
  .tip-card p strong,
  .bg-row-content p strong,
  .title-block h1 span.magenta-text,
  .topics-bar svg,
  .topics-dot,
  .intro-box svg,
  .star-note-card svg,
  .bg-row-icon.pink,
  .flow-box.pink {
    color: var(--primary-magenta-hover);
  }

  .container,
  .card,
  .card-body,
  .header-wrapper,
  .subheader-bar,
  .main-grid,
  .what-you-need-layout,
  .what-you-need-layout > *,
  .starter-skeleton-layout,
  .starter-skeleton-layout > *,
  .part-c-layout,
  .part-c-layout > *,
  .part-e-layout,
  .part-e-layout > *,
  .evaluating-bar,
  .evaluating-checklist {
    max-width: 100%;
    min-width: 0;
  }

  img,
  svg {
    max-width: 100%;
  }

  code,
  .case-code,
  .mro-chain-summary code {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .code-container {
    max-width: 100%;
    overflow-x: hidden;
  }

  .code-content {
    min-width: 100%;
    width: 100%;
    max-width: 100%;
    white-space: pre-wrap;
    overflow-x: hidden;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .diagram-container {
    overflow-x: auto;
  }

  .diagram-container svg {
    min-width: 0;
    width: 100%;
    height: auto;
  }

  @media (max-width: 1023px) {
    html,
    body {
      overflow-x: hidden;
    }

    body {
      display: block;
      padding: 16px;
    }

    .container {
      width: 100%;
      max-width: calc(100vw - 32px);
      margin: 0 auto;
      padding: 18px;
      gap: 18px;
      border-radius: 18px;
    }

    .header-wrapper {
      grid-template-columns: 1fr;
      justify-items: center;
      gap: 16px;
      text-align: center;
    }

    .assignment-badge {
      width: min(100%, 260px);
    }

    .title-block h1 {
      font-size: clamp(24px, 6vw, 34px);
      line-height: 1.15;
    }

    .topics-bar {
      max-width: 100%;
      flex-wrap: wrap;
      justify-content: center;
      border-radius: 18px;
      white-space: normal;
    }

    .logo-block {
      justify-content: center;
    }

    .subheader-bar,
    .main-grid,
    .what-you-need-layout,
    .starter-skeleton-layout,
    .part-c-layout,
    .part-e-layout,
    .evaluating-bar {
      grid-template-columns: 1fr;
    }

    .what-you-need-layout > :last-child,
    .part-c-layout > :last-child,
    .part-e-layout > :not(:first-child) {
      border-left: 0;
      padding-left: 0;
      border-top: 1px solid var(--border-slate);
      padding-top: 16px;
    }

    .what-you-need-layout > :last-child {
      overflow-x: hidden;
    }

    .star-note-card {
      grid-column: auto;
    }

    .card-body {
      padding: 16px;
      gap: 14px;
    }

    .card-header {
      padding: 12px 16px;
      font-size: 16px !important;
      line-height: 1.25;
    }

    .code-container {
      overflow-x: hidden;
    }

    .code-content,
    pre.code-content {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      white-space: pre-wrap;
      overflow-x: hidden;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .card-body:has(.edge-cases-table) {
      overflow-x: hidden;
    }

    .edge-cases-table {
      min-width: 0;
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .edge-cases-table thead {
      display: none;
    }

    .edge-cases-table,
    .edge-cases-table tbody,
    .edge-cases-table tr,
    .edge-cases-table td {
      display: block;
      max-width: 100%;
    }

    .edge-cases-table tr {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      background: #ffffff;
    }

    .edge-cases-table tr + tr {
      margin-top: 10px;
    }

    .edge-cases-table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 12px;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .edge-cases-table td:last-child {
      border-bottom: 0;
    }

    .edge-cases-table td::before {
      display: block;
      margin-bottom: 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .edge-cases-table td:nth-child(1)::before {
      content: "Case";
    }

    .edge-cases-table td:nth-child(2)::before {
      content: "What To Do";
    }

    .edge-cases-table td:nth-child(3)::before {
      content: "Expected Behavior";
    }

    .table-case-cell {
      min-width: 0;
    }

    .table-case-cell > div {
      min-width: 0;
    }

    .evaluating-title {
      border-right: 0;
      border-bottom: 1px solid #1e293b;
    }

    .evaluating-checklist {
      justify-content: flex-start;
      align-items: stretch;
    }

    .eval-item {
      min-width: min(100%, 260px);
    }
  }

  @media (min-width: 640px) and (max-width: 1023px) {
    .subheader-bar,
    .starter-skeleton-layout {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .subheader-bar .subheader-box:last-child,
    .star-note-card {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 767px) {
    body {
      padding: 12px;
    }

    .container {
      max-width: calc(100vw - 24px);
      padding: 14px;
      gap: 14px;
      border-radius: 16px;
    }

    .assignment-badge {
      padding: 14px;
    }

    .assignment-badge .badge-title {
      font-size: 16px;
    }

    .title-block {
      gap: 10px;
    }

    .title-block h1 {
      font-size: clamp(22px, 7vw, 28px);
    }

    .brand-logo-img {
      max-width: 140px;
      max-height: 48px;
    }

    .brand-logo-img.rth {
      width: 48px;
      height: 48px;
    }

    .logo-block {
      align-items: center;
    }

    .technology-logo {
      font-size: 12px;
    }

    .technology-logo svg {
      width: 20px;
      height: 20px;
    }

    .topics-bar,
    .subheader-box,
    .intro-box,
    .tip-card,
    .star-note-card {
      padding: 10px 12px;
    }

    .subheader-box .box-text,
    .intro-box,
    .bg-row-content,
    .checklist-item,
    .tip-card p,
    .star-note-card p {
      font-size: 13px !important;
      line-height: 1.45;
    }

    .bg-row-heading,
    .part-title {
      font-size: 14px !important;
      line-height: 1.35;
    }

    .card-body {
      padding: 14px;
      gap: 12px;
      font-size: 13px;
    }

    .card-header {
      font-size: 14px !important;
      padding: 11px 14px;
    }

    .part-badge {
      width: 22px !important;
      height: 22px !important;
      font-size: 11px !important;
    }

    .code-container,
    pre.code-content {
      font-size: 10.5px !important;
    }

    .window-label {
      font-size: 10px !important;
    }

    .vertical-chain-title,
    .chain-box,
    .flow-box,
    .edge-cases-table,
    .mro-chain-summary,
    .eval-item {
      font-size: 12px !important;
    }

    .what-you-need-layout span,
    .part-e-layout span {
      font-size: 13px !important;
    }

    .part-e-layout p {
      font-size: 12px !important;
    }

    .diagram-container {
      padding: 10px;
    }

    .evaluating-title {
      font-size: 14px !important;
      padding: 14px;
    }

    .evaluating-checklist {
      padding: 14px;
      gap: 10px;
    }
  }
`;

function accessiblePrimaryColor(config: BrandConfig): string {
  return config.name === 'SkillUp IT Academy' ? '#be185d' : config.primaryColorDark;
}

function brandTheme(config: BrandConfig): CSSProperties {
  const accessiblePrimary = accessiblePrimaryColor(config);

  return {
    display: 'contents',
    '--primary-navy': config.secondaryColor,
    '--primary-magenta': accessiblePrimary,
    '--primary-magenta-hover': accessiblePrimary,
    '--bg-light-pink': config.accentBackground,
    '--border-pink': 'color-mix(in srgb, var(--primary-magenta) 26%, white)',
  } as CSSProperties;
}

function brandRootStyles(config: BrandConfig): string {
  const accessiblePrimary = accessiblePrimaryColor(config);

  return `
    :root {
      --primary-navy: ${config.secondaryColor};
      --primary-magenta: ${accessiblePrimary};
      --primary-magenta-hover: ${accessiblePrimary};
      --bg-light-pink: ${config.accentBackground};
      --border-pink: color-mix(in srgb, ${accessiblePrimary} 26%, white);
    }
  `;
}

function brandLogoMarkup(config: BrandConfig): string {
  const isSkillUp = config.name === 'SkillUp IT Academy';
  const logoSrc = isSkillUp
    ? '/brand/skillup-logo.png'
    : '/brand/realtutorialhub-logo.webp';
  const logoClass = isSkillUp ? 'skillup' : 'rth';

  return `<div class="logo-block"><img class="brand-logo-img ${logoClass}" src="${logoSrc}" alt="${config.name} logo" /><div class="technology-logo" aria-label="Python"><svg viewBox="0 0 110 110" aria-hidden="true"><path d="M55 2C25.7 2 26.6 14.5 26.6 14.5l.1 12.3H56v3.5H23.5S2 29.5 2 58.7c0 29.2 17.6 28 17.6 28h10.5V72.1s-.4-17.1 16.7-17.1h29.2s16.1.4 16.1-15.6V23.6S92 2 55 2zm-12.7 9.8c2.7 0 4.8 2.1 4.8 4.8s-2.1 4.8-4.8 4.8-4.8-2.1-4.8-4.8 2.1-4.8 4.8-4.8z" fill="var(--primary-magenta)" /><path d="M55 108c29.3 0 28.4-12.5 28.4-12.5l-.1-12.3H54v-3.5h32.5s21.5.8 21.5-28.4c0-29.2-17.6-28-17.6-28H79.9v14.6s.4 17.1-16.7 17.1H34s-16.1-.4-16.1 15.6v15.8s.1 21.6 37.1 21.6zm12.7-9.8c2.7 0 4.8 2.1 4.8 4.8s-2.1 4.8-4.8 4.8-4.8-2.1-4.8-4.8 2.1-4.8 4.8-4.8z" fill="var(--primary-navy)" /></svg><span>Python</span></div></div>`;
}

function brandedMarkup(config: BrandConfig): string {
  return originalMarkup.replace(
    /<div class="logo-block">[\s\S]*?<\/div>\n    <\/header>/,
    `${brandLogoMarkup(config)}\n    </header>`,
  );
}

/**
 * Shared, brand-tokenized rendering of banking_onboarding_system.html.
 * The original assignment layout/content is intentionally preserved; only brand
 * CSS variables are injected per BrandConfig.
 */
export default function BankingOnboardingSystemPage({ config }: BankingOnboardingSystemPageProps) {
  return (
    <main
      aria-label="Multi-Protocol International Banking Onboarding System assignment"
      style={brandTheme(config)}
    >
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Outfit:wght@300;400;500;600;700;800&display=swap');\n${originalStyles}\n${brandRootStyles(config)}\n${responsiveStyles}` }} />
      <div dangerouslySetInnerHTML={{ __html: brandedMarkup(config) }} />
    </main>
  );
}
