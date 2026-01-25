# Global UX: Data & Time Filtering

## Purpose
Define a consistent, predictable experience for users when filtering data by date or time ranges across the Quiz Platform.

## Supported Ranges
- **7 Days**: Default window for performance trends and activity summaries.
- **30 Days**: Extended window for deeper historical analysis.
- **Custom Date Range**: Calendar-based selection allowing users to define precise start and end boundaries (Future-proofing requirement).

## Behavioral Rules (Technical)
- **Authoritative Filtering**: The selected range MUST be passed to the backend as the primary query filter.
- **No Silent Fallbacks**: If data for a selected range is unavailable, the UI must show a "No data for this range" state rather than silently reverting to a default range.
- **State Synchronization**: The active time filter must be reflected in the URL or an authoritative state store to ensure persistence across tab refreshes if needed.

## UX Rules (Interface)
- **Visible Selection**: The UI must clearly indicate which time range is currently active (e.g., highlighted toggle button).
- **Control Integrity**: 
  - Standard 7D/30D controls must NOT be removed even when calendar-based filtering is introduced.
  - Calendar-based selection serves as an enhancement, providing precision without sacrificing the convenience of quick-toggles.
- **Explicit Removal**: Any removal or degradation of time-filtering controls requires explicit approval from the USER.

## Implementation Details
- Date calculations should be performed using the user's local timezone unless otherwise specified.
- Recent Activity should transition labels based on proximity:
  - `Today`
  - `Yesterday`
  - `X days ago`
  - `DD/MM/YYYY` (for dates older than 7 days)
