# MayaSoft ERP — Agent Guide

## Stack
- Create React App (react-scripts 5), React 19, Tailwind CSS 3, Recharts, date-fns, lucide-react, uuid
- `react-router-dom` is in `package.json` but **unused** — navigation is state-based (`currentPage` in `App.js`)

## Commands
```
npm start       # dev server on :3000
npm test        # interactive test runner (react-scripts test, Jest)
npm run build   # production build to build/
```
No custom lint/typecheck scripts. CRA's built-in ESLint (`react-app`) runs in the dev server console only.

## Auth
- **Default login**: `admin` / `admin123` — hardcoded in `AuthContext.js:76-87`
- Role-based access with templates: Admin, Accountant, Salesperson, Purchase Manager, Inventory Manager, Viewer
- Admin role always has access to all modules and cannot be deleted/deactivated

## Data storage (3 modes, auto-detected)
1. **Supabase** (current default) — hardcoded URL/anon key in `src/supabase/config.js`. Table: `erp_data` (key-value). Schema in `supabase-schema.sql` — run in Supabase SQL Editor to create table.
2. **Firebase Firestore** — configured via `REACT_APP_FIREBASE_*` env vars. Collection-based storage.
3. **localStorage** — fallback when neither cloud backend is available. Keys: `erp_app_data`, `erp_auth_data`.

`isSupabaseConfigured()` in `supabase/dbService.js` always returns `true`. Firebase checks `db !== null`. If Supabase fails, falls back to localStorage for reads.

## Architecture
- **State management**: React Context (`AuthContext`, `AppContext`) + `useReducer` — no Redux/Zustand
- **Entrypoint**: `src/index.js` → `src/App.js` (renders AuthProvider > AppProvider > AppContent)
- **Page routing**: `App.js:36-64` maps string keys → components. Sidebar calls `onNavigate(key)`. No URL-based routing.
- **Component dirs**: `components/{auth,dashboard,sales,purchase,inventory,accounts,reports,masters,settings,layout,common}/`
- **Utils**: `helpers.js` (formatting), `validation.js` (GSTIN, phone, stock checks), `initialData.js` (seed data with Indian sample companies/items)
- **Financial year**: `2025-04-01` to `2026-03-31` (hardcoded in `initialData.js`)
- **Currency**: INR (Indian Rupee), locale `en-IN`
- **Date format**: display `dd/MM/yyyy`, storage `yyyy-MM-dd`, helper `formatDate()` / `formatDateForInput()`

## Generated document numbers
Auto-numbered with padded 4-digit counters per document type:
- `INV-0001` (Sales Invoice), `SR-0001` (Sales Return), `DC-0001` (Delivery Challan), `SO-0001` (Sales Order)
- `PB-0001` (Purchase Bill), `PR-0001` (Purchase Return), `PO-0001` (Purchase Order)
- `RCT-0001` (Receipt), `PAY-0001` (Payment), `JV-0001` (Journal), `EXP-0001` (Expense), `CTR-0001` (Contra), `SJ-0001` (Stock Journal)

## Testing
- Jest + @testing-library/react, configured via CRA defaults
- Test file: `src/App.test.js` renders `<App />` and checks for a text match ("learn react")
- `src/setupTests.js` imports `@testing-library/jest-dom`
- No snapshot or integration tests. Tests that render `<App />` will trigger auth checks and supabase calls.

## Key quirks
- `isSupabaseConfigured()` returns `true` unconditionally — Supabase client is always instantiated. If Supabase is unreachable, reads silently fall back to `localStorage`.
- `App.js` has a global keyboard listener (F2 is no-op, Escape is no-op — handled by modals).
- Alerts inventory items when `currentStock <= reorderLevel` (component `LowStock.js`).
- Delivery Challans can be converted to Sales Invoices (`CONVERT_CHALLAN_TO_INVOICE` reducer action).
- GST is calculated as CGST+SGST (intra-state) or IGST (inter-state) via `calculateInvoiceSummary()` in `helpers.js`.
