# FND09 Gate 1 transition service sensitivity manifest

Baseline 41a8c4f3. Sol checkpoint permits isolated backend tests, but Gate 1 approval permission remains a decision. Actual generic transition service validates state machine and has special authorization only for IMPLEMENTING. Add isolated real-service control with fixture workflow/repositories: AWAITING_GATE_1 -> GUI_APPROVED without approval evidence must not persist; retain failure. No HTTP/JWT/physical DB/server, no production change. Same Python dotenv/network guard and pre-created local loop setup as FND08. Sol review required.
