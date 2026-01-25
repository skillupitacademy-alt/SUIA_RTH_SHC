# Page Contract: Admin Signup (Restricted)
**Route**: N/A (Public Signup Disabled)

## 1. Policy
*   There is no public `/signup` page for the Admin App.
*   Navigate to `/login` if user attempts to access `/signup`.

## 2. Invitation Flow (Future Scope)
*   Routes: `/invite/accept?token=...`
*   Logic:
    *   Validate Invite Token.
    *   Allow setting Password.
    *   Transition to Active Admin.

*For current scope, this document serves as a placeholder to explicitly DENY public signup implementation.*
