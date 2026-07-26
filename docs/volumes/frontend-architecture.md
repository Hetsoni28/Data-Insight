# Frontend Architecture Design

This document details the exact engineering architecture for the Data Insight frontend. It is built using **Next.js 15 (App Router)**, **TypeScript**, and adheres strictly to **Atomic Design Principles**.

---

## 1. The Core Philosophy: Atomic Design

In a large enterprise application, UI components quickly become messy if not structured properly. Data Insight uses Atomic Design to ensure maximum reusability and UI consistency.

```
Atoms → Molecules → Organisms → Templates → Pages
```

### The 5 Levels of UI
1. **Atoms (`components/atoms/`)**: The smallest building blocks. They contain no business logic and no margins (e.g., `Button`, `Input`, `Badge`, `Spinner`, `Avatar`).
2. **Molecules (`components/molecules/`)**: A combination of 2-3 atoms. (e.g., A `SearchBar` combining an `Input` atom, a `Button` atom, and an `Icon` atom).
3. **Organisms (`components/organisms/`)**: Distinct sections of an interface that function independently (e.g., `Sidebar`, `DataTable`, `DashboardWidget`).
4. **Templates (`components/templates/`)**: Page-level layouts that define the grid and structure, but do not fetch data (e.g., `DashboardLayout`).
5. **Pages (`app/`)**: The Next.js route components. Their ONLY job is to fetch data and pass it down into the Templates and Organisms.

---

## 2. Server Components vs. Client Components

Next.js 15 uses the App Router, which introduces React Server Components (RSCs) by default. Data Insight follows the **"Push the Client to the Leaves"** philosophy.

### ✅ Server Components (Default)
Used for routing, layouts, and initial data fetching. They ship **zero JavaScript** to the browser, making the app blazing fast.
- Page routes (`page.tsx`)
- Layouts (`layout.tsx`)
- Static text blocks

### ⚡ Client Components (`"use client"`)
Used ONLY when we need interactivity (hooks, state, event listeners). We keep these as small as possible.
- Buttons that `onClick`
- Forms (`React Hook Form`)
- Charts (`ECharts`)
- Data Tables with sorting/filtering

---

## 3. State Management Architecture

We do not use Redux. It is too heavy for modern React. Instead, state is strictly divided into two categories:

### 1. Server State (Handled by TanStack Query)
Any data that comes from the FastAPI backend (Datasets, Dashboards, User Profile) is "Server State".
- **Tool:** TanStack Query (React Query)
- **Why:** It automatically handles caching, background refetching, loading states, and error retries.
- **Example:** Fetching the list of datasets for a workspace.

### 2. Client State (Handled by Zustand)
Any data that exists only in the user's browser (Dark Mode toggle, Sidebar Open/Closed, Active Workspace selection) is "Client State".
- **Tool:** Zustand
- **Why:** It is lightweight, requires zero boilerplate, and prevents unnecessary re-renders.

---

## 4. Code Implementation Blueprints

To understand how this looks in practice, here is the blueprint for how we write frontend code.

### Blueprint A: A Page Component (Server Component)
*Located in `app/(dashboard)/datasets/page.tsx`. Its only job is layout and SEO.*

```tsx
import { DatasetListTemplate } from "@/components/templates/DatasetListTemplate";
import { DatasetUploader } from "@/components/organisms/DatasetUploader";

export const metadata = {
  title: "Datasets | Data Insight",
};

export default function DatasetsPage() {
  return (
    <DatasetListTemplate 
      headerTitle="Manage Datasets"
      primaryAction={<DatasetUploader />}
    />
  );
}
```

### Blueprint B: An Organism with Server State (Client Component)
*Located in `components/organisms/DatasetTable.tsx`. It fetches data using TanStack Query.*

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDatasets } from "@/features/datasets/api";
import { Spinner } from "@/components/atoms/Spinner";
import { Badge } from "@/components/atoms/Badge";

export function DatasetTable({ workspaceId }: { workspaceId: string }) {
  // 1. Fetch data with TanStack Query (Caching handled automatically)
  const { data: datasets, isLoading, isError } = useQuery({
    queryKey: ["datasets", workspaceId],
    queryFn: () => fetchDatasets(workspaceId),
  });

  if (isLoading) return <Spinner size="lg" />;
  if (isError) return <div>Failed to load datasets.</div>;

  return (
    <div className="border rounded-md shadow-sm bg-neutral">
      {datasets.map((dataset) => (
        <div key={dataset.id} className="p-4 flex justify-between">
          <span className="font-headline">{dataset.name}</span>
          <Badge variant={dataset.status === "READY" ? "success" : "warning"}>
            {dataset.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
```

### Blueprint C: Global Client State (Zustand)
*Located in `store/useWorkspaceStore.ts`.*

```typescript
import { create } from "zustand";

interface WorkspaceState {
  activeWorkspaceId: string | null;
  setActiveWorkspace: (id: string) => void;
}

// Lightweight global store for UI state
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
}));
```

---

## 5. Forms & Validation

All forms in Data Insight must be strictly validated on the client side before hitting the API. This prevents unnecessary backend errors and provides instant user feedback.

- **Tooling:** React Hook Form + Zod
- **Workflow:** 
  1. Define a Zod schema matching the FastAPI Pydantic schema.
  2. Bind it to React Hook Form via the `@hookform/resolvers/zod` resolver.
  3. Render the UI using Shadcn Form components.

```tsx
// Example Zod Schema matching the Backend
const datasetSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  file: z.instanceof(File, { message: "File is required" }),
});
```

---

## 6. Styling: Tailwind CSS & Shadcn/UI

- We do not write custom CSS files.
- Everything is styled using **Tailwind CSS 4** utility classes.
- Base interactive components (Buttons, Modals, Dropdowns) are generated using **Shadcn/UI**, which uses Radix UI under the hood for perfect accessibility (WCAG).
- We use the utility `cn()` (clsx + tailwind-merge) to safely conditionally apply classes without style conflicts.

## Summary
By enforcing **Atomic Design**, maximizing **React Server Components**, and strictly separating **Server State** (TanStack) from **Client State** (Zustand), the Data Insight frontend will remain highly performant and maintainable even as it grows to hundreds of components.
