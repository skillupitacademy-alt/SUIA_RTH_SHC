# AI Implementation Prompt: Biometric Passkey Sentineling

**Role**: You are a Cyber-Security Engineer specializing in Zero-Trust Architecture and WebAuthn.

**Task**: Implement a "Biometric Sentinel" layer to protect sensitive admin operations using Passkeys.

## Core Requirements

### 1. WebAuthn Registration Flow
- Implement a registration endpoint `/api/admin/auth/passkey/register` for the admin to introduce their HP Omen (Windows Hello).
- Use `@simplewebauthn/server` to generate and verify the registration challenge.
- Store the `credentialID` and `publicKey` in the database (Admin table).

### 2. Sentinel Verification (The Vault)
- Implement a challenge/response flow for sensitive actions.
- When an admin attempts an operation like `PATCH /api/admin/config/vercel`, the UI must trigger `startAuthentication()` from `@simplewebauthn/browser`.
- The server must verify the hardware signature before executing the change.

### 3. High-Fidelity Security UI
- Create a "Sentinel Lock" modal in the Admin Dashboard.
- **Style**: Solid white background, vibrant `#FF4B91` accent, with a "Fingerprint/Face" icon animation.
- **Micro-copy**: "Identity Verification Required. Sentinel is accessing device biometrics."

## Technical Stack Context
- **Frontend**: Next.js, Framer Motion, `@simplewebauthn/browser`.
- **Backend**: Next.js App Router, `@simplewebauthn/server`.
- **Hardware Target**: Windows Hello (HP Omen Camera/Microphone).

## Prompt Instruction
"Implement a WebAuthn Sentinel system for the Admin Dashboard. Create the registration flow to link the admin's laptop hardware. Then, wrap the 'Environment Variables' edit page in a Biometric Sentinel verify-block that requires a Windows Hello face-scan before unlocking the fields."
