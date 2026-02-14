- Always use `pnpm add -w` to add root dependencies.
- Use `pnpm add <pkg> --filter <app>` for app-specific deps.

---

## 3. Operations Manual
*Sources: ENVIRONMENT_CONFIG.md, VERCEL_DEPLOYMENT.md, TROUBLESHOOTING.md*

### 3.1 Environment Configuration

#### Automatic Detection (Vercel)
The app **automatically detects** environments:
- **Vercel Preview**: Auto-links via `*.vercel.app` subdomains.
- **Production**: Uses `NEXT_PUBLIC_API_URL` (Production API).

#### Environment Variables (.env)
| File | Scope | Status |
| :--- | :--- | :--- |
| `.env` | Shared / Build-time | Committed |
| `.env.local` | Local Secrets | **Gitignored** |
| `Vercel Dashboard` | Production Secrets | **Highest Priority** |

### 3.2 Configuration File Inventory

#### Root Configuration
| File | Purpose | Key Settings |
| :--- | :--- | :--- |
| **`package.json`** | Project Manifest | Node v20.x, pnpm v9.15.4 |
| **`pnpm-workspace.yaml`** | Workspace Def | Apps (`apps/*`) & Packages (`packages/*`) |
| **`turbo.json`** | Build Pipeline | Global cache strategy & execution order |
| **`.npmrc`** | Package Manager | `hoist=true` (Critical for Next.js monorepo) |

#### Shared Configuration
| Path | Purpose |
| :--- | :--- |
| **`packages/config/`** | Shared ESLint & Tailwind configs. |
| **`packages/types/`** | Shared Zod schemas (`index.ts`) & TypeScript definitions. |
| **`packages/ui/`** | (Reserved) Shared React components (Currently empty, see App-specific components). |

### 3.3 Deployment Guide



#### Architecture
The platform is deployed as **3 separate Vercel projects**:
1. **Web App**: `NEXT_PUBLIC_WEB_APP_URL`
2. **API Server**: `NEXT_PUBLIC_API_URL`
3. **Admin App**: `NEXT_PUBLIC_ADMIN_URL`

#### Deployment Checklist
1. **Project Name**: Matches folder (e.g., `quiz-platform-api-server`).
2. **Root Directory**: `apps/api-server` (CRITICAL).
3. **Framework**: Next.js.
4. **Build Command**: `pnpm build`.
5. **Install Command**: `pnpm install` (or `pnpm install --no-frozen-lockfile` if resolving types).
6. **Env Vars**: Set `DATABASE_URL`, `JWT_SECRET`, etc.

### 3.3 Troubleshooting

#### "ERR_CONNECTION_REFUSED" on Local
- **Cause**: API server not running.
- **Fix**: Run `pnpm dev` in root to start ALL apps (Ports 3000, 3001, 3002).

#### CORS Errors
- **Cause**: Request from unauthorized origin.
- **Fix**: Check CORS configuration. All origins in `ALLOWED_ORIGINS` are whitelisted.

