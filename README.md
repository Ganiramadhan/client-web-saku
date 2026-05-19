# Saku Finance Admin

Admin dashboard for the Saku Finance platform, built with React, TypeScript, and Vite. This frontend is designed to manage users, wallets, transactions, budgets, subscriptions, categories, split bills, AI tools, and application settings for the Saku Finance ecosystem.

---

## Overview

The admin app provides a modern interface for operations teams and product admins to:
- Manage user accounts and access
- Review transaction history and wallet balances
- Configure categories, budgets, and subscription plans
- Monitor AI processing and receipt OCR workflows
- Support split bill and finance management features

Built with:
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- TanStack Query
- Recharts

---

## Core Features

- Full admin dashboard for the Saku Finance backend
- User and wallet management pages
- Transaction and category administration
- Budget oversight and subscription controls
- AI/OCR processing monitors and logs
- Responsive layout for desktop admin usage

---

## Project Structure

- `src/main.tsx` — app bootstrap and entry point
- `src/App.tsx` — root application shell
- `src/layouts/AppLayout.tsx` — main admin layout wrapper
- `src/routes/index.tsx` — route configuration
- `src/features/` — feature modules and pages
- `src/components/` — reusable UI components and feedback elements
- `src/components/ui/` — shared design system primitives
- `src/lib/` — shared utilities, API client, query client, toast, and confirmation helpers
- `src/stores/` — state management stores
- `src/types/` — shared TypeScript types
- `src/i18n/` — localization setup and dictionaries

---

## Requirements

- Node.js 20+ or compatible runtime
- `pnpm` package manager installed

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open the local development server URL shown in the terminal.

---

## Build

```bash
pnpm build
```

---

## Preview Production Build

```bash
pnpm preview
```

---

## Scripts

- `pnpm dev` — start development server
- `pnpm build` — compile and bundle production assets
- `pnpm preview` — preview the production build locally
- `pnpm lint` — run ESLint across the source code

---

## Notes

- `eslint.config.js` contains linting rules
- `vite.config.ts` contains Vite build and dev server configuration
- TypeScript config is split across `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json`

---

## License

This project is currently private.
