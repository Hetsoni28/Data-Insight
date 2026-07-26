# Frontend (Next.js) Prompt Blueprint

When generating frontend code for Data Insight, adhere to these strict rules:

## 1. Atomic Design Enforcement
- **Atoms (`components/atoms/`)**: Basic building blocks (Buttons, Inputs, Badges, Spinners). No business logic.
- **Molecules (`components/molecules/`)**: Combinations of atoms (Search Bars, Form Fields).
- **Organisms (`components/organisms/`)**: Complex functional UI (Navbars, Data Tables, Dashboards).
- **Templates (`components/templates/`)**: Page layouts (Dashboard Layout).
- **Pages (`app/`)**: Next.js routing. Passes data to templates/organisms.

## 2. Server vs Client Components
- Default to **Server Components** (`page.tsx`, `layout.tsx`) for initial data fetching and SEO.
- Use **Client Components** (`"use client"`) ONLY when necessary (interactivity, hooks, state, TanStack Query).
- Push the `"use client"` directive as far down the component tree as possible.

## 3. Styling & UI
- Use **Tailwind CSS 4** for all styling. Use utility classes. No custom CSS unless absolutely necessary.
- Use **Shadcn/UI** as the component base.
- Use `cn()` utility (clsx + tailwind-merge) for conditional class names.
- Ensure all components support both Dark and Light modes.
- Brand Colors: Primary is `#10B981`, Secondary is `#059669`.

## 4. State & Data Fetching
- Use **TanStack Query (React Query)** for all server state (fetching APIs, caching, mutations).
- Use **Zustand** for global client state (e.g., UI toggles, active workspace).
- Use **React Hook Form** + **Zod** for all form handling and validation.

## 5. Security & Auth
- Check the Supabase session before rendering protected routes.
- Pass the JWT token securely to the FastAPI backend via Axios interceptors.
