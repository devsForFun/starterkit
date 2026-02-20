# Frontend Template — Next.js 15 + Tailwind CSS v4 + Supabase

A modern, opinionated SaaS starter kit built with Next.js 15, Tailwind CSS v4, Shadcn UI, Supabase, and Upstash Redis.

## Features

- ⚡️ **Next.js 16** with Turbopack — blazing fast builds and HMR
- 💨 **Tailwind CSS v4** — utility-first CSS framework
- 🔥 **Shadcn UI v3** — beautifully designed, accessible components
- 🔐 **Supabase** — authentication (email + Google OAuth) and PostgreSQL database
- 🛡️ **Rate Limiting** — two options: Upstash Redis (cloud) or Supabase-native (no extra service)
- 📧 **Resend** — transactional email (e.g. password resets, notifications)
- 📝 **FreeWrite CMS** — headless CMS integration for changelogs and content pages
- 🌓 **Dark Mode** — light/dark theme support via `next-themes`
- 📋 **TypeScript** — end-to-end type safety
- 🧩 **React Hook Form + Zod** — flexible forms with schema validation
- 🔒 **Auth Feature Flags** — granular control over which auth flows are enabled
- 🚫 **Anti-Brute Force** — database-backed rate limiting on auth actions

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org/en/download) | 20+ | LTS recommended |
| [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) | 10+ | Comes with Node.js |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Required by Supabase CLI |
| [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) | Latest | For local Supabase stack |

> [!TIP]
> See the [Installation Guides](#installation-guides) section for quick setup links.

---

## Getting Started

### 1. Clone or use this template

**Option A — Clone the repo:**

```bash
git clone https://github.com/devsForFun/starterkit.git
cd starterkit
```

**Option B — Use as a GitHub template:**

1. Visit [github.com/devsForFun/starterkit](https://github.com/devsForFun/starterkit)
2. Click **Use this template** → **Create a new repository**
3. Clone your newly created repository

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Start the local Supabase stack

```bash
npx supabase start
```

After the containers start, you will receive local credentials like:

```
        API URL: http://127.0.0.1:54321
    GraphQL URL: http://127.0.0.1:54321/graphql/v1
 S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
         DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
     Studio URL: http://127.0.0.1:54323
   Inbucket URL: http://127.0.0.1:54324
     JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
publishable key: sb_publisha...
     secret key: sb_secre...
```

> [!IMPORTANT]
> Copy these credentials — you'll need the **API URL**, **anon key** for your `.env.local`. A file called `supabase-local-credentials.txt` is already in `.gitignore` so you can safely save them there.

---

### 4. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

```bash
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (from `npx supabase start` output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Upstash Redis (for cloud-based rate limiting — optional if using Supabase rate limiting)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Resend (transactional email)
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# FreeWrite CMS (for changelog / content pages)
FREEWRITE_API_KEY=your-freewrite-api-key

# Google OAuth (for local development — see docs/SETUP_GOOGLE_AUTH.md)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-client-secret

# Auth Feature Flags (1 = enabled, 0 = disabled)
NEXT_PUBLIC_AUTH_ENABLED=1
NEXT_PUBLIC_LOGIN_EMAIL_AUTH_ENABLED=1
NEXT_PUBLIC_REGISTER_EMAIL_AUTH_ENABLED=1
NEXT_PUBLIC_FORGOT_PASSWORD_ENABLED=1
NEXT_PUBLIC_RESET_PASSWORD_ENABLED=1
AUTH_ALLOW_GOOGLE_SIGNUP=1
```

---

### 5. Apply database migrations

```bash
npx supabase db reset
```

This applies all migrations in `supabase/migrations/` to your local database.

---

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The dev server uses **Turbopack** for fast refresh. The Supabase Studio is at [http://localhost:54323](http://localhost:54323) and Inbucket (local email inbox) is at [http://localhost:54324](http://localhost:54324).

---

## Project Structure

```
/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes (login, register, forgot/reset password)
│   ├── (authenticated)/        # Protected routes (dashboard, etc.)
│   │   └── dashboard/
│   ├── (public)/               # Public routes (homepage, changelog)
│   │   └── changelog/
│   ├── actions/                # Next.js Server Actions
│   ├── api/                    # API routes (OAuth callback, cron, etc.)
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── assets/                     # Static assets (images, logos)
├── components/                 # React components
│   ├── ui/                     # Shadcn UI components
│   ├── freewritecms-block-renderer.tsx  # CMS block renderer
│   ├── mode-toggle.tsx         # Dark/light mode toggle
│   └── theme-provider.tsx      # Theme context provider
├── docs/                       # Setup guides
│   ├── SETUP_GOOGLE_AUTH.md
│   ├── ENABLE_GOOGLE_AUTH_SUPPORT_IN_LOCAL_DATABASE.md
│   ├── SETUP_RATELIMITING_WITH_SUPABASE.md
│   └── SETUP_FREEWRITE_CMS.md
├── hooks/                      # Custom React hooks
├── lib/                        # Utility libraries
│   ├── freewritecms.ts         # FreeWrite CMS client
│   ├── ratelimit-supabase.ts   # Supabase-native rate limiting
│   └── utils.ts                # General utilities (cn, etc.)
├── supabase/                   # Supabase config and migrations
│   └── config.toml
├── utils/                      # Helper functions
│   └── supabase/               # Supabase client utilities (server, client, middleware)
├── middleware.ts               # Next.js middleware (auth session refresh)
├── next.config.ts              # Next.js configuration
├── components.json             # Shadcn UI configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Available Scripts

Run these with `npm run <script>`:

| Script | Description |
|--------|-------------|
| `dev` | Start the development server (Turbopack) |
| `build` | Build for production (Turbopack) |
| `start` | Start the production server |
| `lint` | Run ESLint |
| `format` | Format all files with Prettier |
| `clean:dotfiles` | Remove macOS `._*` dotfiles |
| `clean:node_modules` | Remove `node_modules` |
| `clean:cache` | Clear the `.next` build cache |

---

## Optional Integrations

### Google OAuth

See [`docs/SETUP_GOOGLE_AUTH.md`](./docs/SETUP_GOOGLE_AUTH.md) for step-by-step instructions on configuring Google OAuth credentials and enabling it in the local Supabase config.

### Rate Limiting

Two built-in options:

| Option | When to use |
|--------|-------------|
| **Upstash Redis** | Cloud / edge-friendly; requires an Upstash account |
| **Supabase-native** | No extra service; uses your existing Supabase database |

See [`docs/SETUP_RATELIMITING_WITH_SUPABASE.md`](./docs/SETUP_RATELIMITING_WITH_SUPABASE.md) for the database-backed setup.

### FreeWrite CMS

Used for changelogs and content-driven pages. See [`docs/SETUP_FREEWRITE_CMS.md`](./docs/SETUP_FREEWRITE_CMS.md) for setup.

---

## Auth Feature Flags

All authentication flows can be toggled independently via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_AUTH_ENABLED` | `1` | Master switch — disabling locks all auth pages |
| `NEXT_PUBLIC_LOGIN_EMAIL_AUTH_ENABLED` | `1` | Email + password login form |
| `NEXT_PUBLIC_REGISTER_EMAIL_AUTH_ENABLED` | `1` | Email + password registration form |
| `NEXT_PUBLIC_FORGOT_PASSWORD_ENABLED` | `1` | Forgot password page |
| `NEXT_PUBLIC_RESET_PASSWORD_ENABLED` | `1` | Reset password page |
| `AUTH_ALLOW_GOOGLE_SIGNUP` | `1` | Allow new user signup via Google OAuth |

---

## Deployment

The app can be deployed to any platform supporting Next.js (Vercel, Fly.io, Railway, etc.).

```bash
# Build for production
npm run build

# Start the production server
npm start
```

For linking to a production Supabase project:

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push local migrations to production
npx supabase db push
```

---

## Installation Guides

### Node.js 20+

→ [nodejs.org/en/download](https://nodejs.org/en/download)

### Docker Desktop

→ [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

### Supabase CLI

```bash
# macOS & Linux (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm (no global install required — use npx supabase <command>)
npx supabase --version
```

→ Full guide: [supabase.com/docs/guides/local-development/cli/getting-started](https://supabase.com/docs/guides/local-development/cli/getting-started)

---

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE.md) file for details.
