# Kathir Traders — Agent Instructions

## Project Overview
Business management application for **Kathir Traders**, a retail business dealing in **plumbing and electrical accessories**. Built with Angular (standalone components architecture).

## Tech Stack
- **Framework**: Angular 17+ (standalone components, no NgModules by default)
- **UI Library**: Angular Material (`@angular/material`)
- **State Management**: NgRx (`@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`)
- **HTTP**: Angular `HttpClient` with interceptors for auth tokens
- **Forms**: Reactive Forms (`FormBuilder`, `FormGroup`, `FormControl`)
- **Routing**: Angular Router with lazy-loaded feature routes
- **Testing**: Jest (unit) + Cypress (e2e)
- **Language**: TypeScript (strict mode enabled)

## Commands
```bash
npm start           # dev server → http://localhost:4200
npm run build       # production build → dist/
npm test            # Jest unit tests (watch mode)
npm run test:ci     # Jest tests (single run, CI)
npm run e2e         # Cypress end-to-end tests
npm run lint        # ESLint
```

## Project Structure
```
src/
  app/
    core/           # Singleton services, guards, interceptors, layout shell
    shared/         # Reusable components, pipes, directives (no business logic)
    features/
      inventory/    # Stock items, categories (plumbing / electrical)
      sales/        # Billing, invoices, POS
      purchases/    # Supplier orders, goods received notes
      customers/    # Customer profiles, credit management
      suppliers/    # Supplier directory, price lists
      reports/      # Sales reports, stock reports, GST reports
    store/          # NgRx root store; feature stores live inside each feature folder
  assets/
  environments/     # environment.ts / environment.prod.ts
```

## Architecture Conventions
- **Standalone components only** — never use `NgModule` for new features.
- **Lazy-loaded routes**: each feature has its own `<feature>.routes.ts`.
- **Smart/dumb pattern**: containers (`.container.ts`) hold store/service calls; presentational components are pure `@Input`/`@Output`.
- **Store per feature**: `store/` subfolder inside each feature (`actions.ts`, `reducer.ts`, `effects.ts`, `selectors.ts`).
- **Services**: one service per domain concept; inject via `inject()` function (not constructor injection).
- **Barrel exports**: each feature exports its public API through an `index.ts`.

## Domain Model — Key Entities
| Entity | Notes |
|---|---|
| `Product` | SKU, name, category (`plumbing`\|`electrical`), unit, HSN code, GST rate |
| `StockEntry` | Product + warehouse location + quantity on hand |
| `Customer` | Name, GSTIN, address, credit limit, balance |
| `Supplier` | Name, GSTIN, contact, payment terms |
| `PurchaseOrder` | Supplier, lines (Product × qty × rate), status |
| `SalesInvoice` | Customer, lines, tax breakdown (CGST/SGST/IGST), payment status |
| `Payment` | Linked to invoice/purchase, mode (cash/UPI/cheque/credit) |

## GST / India-Specific Rules
- All monetary values stored as integers in **paise** (₹1 = 100 paise); format with `CurrencyPipe('en-IN', 'INR')`.
- Tax split: intra-state → CGST + SGST (each = rate/2); inter-state → IGST.
- Invoice numbers follow the format `KT-YYYY-NNNNNN` (e.g., `KT-2026-000001`).
- HSN codes are mandatory on each line item for GST filing.

## Coding Conventions
- File naming: `kebab-case.component.ts`, `kebab-case.service.ts`, etc.
- No `any` — use explicit types or `unknown` with type guards.
- Signals preferred for local component state; NgRx for cross-feature state.
- All API calls go through a service; components never call `HttpClient` directly.
- Use `AsyncPipe` in templates instead of `.subscribe()` in components.
- Error handling: global `ErrorInterceptor` in `core/` surfaces errors via a `NotificationService`.

## Common Pitfalls
- Angular Material requires `provideAnimations()` (or `provideAnimationsAsync()`) in `app.config.ts`.
- NgRx entity adapter keys must match the `id` field of each entity.
- Avoid `RouterModule.forChild()` — use `provideRouter()` or route array exports instead.
- Cypress config lives at `cypress.config.ts`; environment vars go in `cypress.env.json` (git-ignored).
