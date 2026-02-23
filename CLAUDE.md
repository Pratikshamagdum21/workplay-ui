# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WorkPay** is a desktop payroll management application for a textile/garment factory. It is built as an Angular SPA wrapped in Electron, enabling cross-platform desktop distribution. The app manages employees, tracks daily fabric production work, and computes salary payouts with advance deductions, leave deductions, and bonus eligibility.

## Backend API

The companion Spring Boot API (`workpay-api`) must run on **port 8080** (change `server.port=8080` in `workpay-api/src/main/resources/application.properties` — it defaults to 4200 which conflicts with Angular).

- Dev: Angular dev server proxies `/api/*` → `http://localhost:8080` via `proxy.conf.json` (path prefix is stripped)
- Prod (Electron): `environment.prod.ts` sets `apiUrl` to `http://localhost:8080` directly

**API endpoints used:**
| Service | Endpoint | Method |
|---|---|---|
| Employee list | `/emp/getAllEmployees` | GET |
| Employee by ID | `/emp/{id}` | PUT |
| Add employee | `/emp/saveEmp` | POST (query params, not JSON body — no `@RequestBody` in backend) |
| Update employee fields | `/emp/updateEmp/{id}` | PATCH (JSON body) |
| Delete employee | `/emp/deleteEmp?id={id}` | DELETE |
| Pay advance | `/emp/advancePaid?id={id}&advancePaid={n}` | PATCH |
| Save expenditure | `/expenditure/save` | POST (JSON body) |
| List expenditures | `/expenditure/getAllExpenditure` | GET |

**Note on ID generation**: The backend has no `@GeneratedValue` on `Employee.id`, so the frontend generates a timestamp-based integer id in `EmployeeService.addEmployee()`.

**CORS for Electron production**: When packaged as an Electron app (loads from `file://`), the API needs CORS configured to allow requests from `file://` origin or all origins, or use `webSecurity: false` in Electron's `BrowserWindow` options.

## Commands

```bash
# Install dependencies
npm install

# Develop in browser (Angular dev server at localhost:4200)
npm start

# Develop as Electron app (starts Angular + Electron together)
npm run electron:dev

# Run unit tests
npm test

# Run a single test file
npx ng test --include='**/employee.service.spec.ts'

# Build Angular for production
npm run build

# Build and package Electron app for Windows
npm run electron:build:win

# Build and package for other platforms
npm run electron:build:mac
npm run electron:build:linux
```

## Architecture

### Electron + Angular Integration
- `electron.js` is the Electron main process entry point. In development it loads `http://localhost:4200`; in production it loads `dist/work-pay/browser/index.html`.
- `preload.js` runs with `contextIsolation: true` and `nodeIntegration: false` for security.
- `electron-builder` packages the app; build output goes to `release/`.

### Angular Application Structure
- **`src/app/app.routes.ts`** — defines top-level routes: `home`, `dashboard`, `employee`, `salary`, `custom-rate`, `daily-work-management`.
- **`src/app/shared-imports.ts`** — exports a `SHARED_IMPORTS` array of all commonly used Angular and PrimeNG modules. All feature components spread this into their `imports` array rather than importing modules individually.
- **`src/app/landing-page/`** — contains all feature modules as standalone components, organized by domain:
  - `employee-details/` — employee CRUD, add/view employee dialogs
  - `salary-details/` — salary listing, pay salary dialog, add expense dialog, PDF report export
  - `daily-work-mangement/` — daily work entry tracking (note: directory name has a typo, `mangement`)
  - `custom-rate/` — custom rate configuration (stub, not yet implemented)
- **`src/shared/side-menu/`** — shared navigation sidebar component
- **`src/services/`** — Angular injectable services (one per domain)

### State Management
All state is held in-memory using RxJS `BehaviorSubject` inside services. There is no backend or persistence layer yet — services initialize with hardcoded dummy data on construction. The untracked `src/app/api.js` is an axios client stub (not yet wired to any real backend).

### Services
| Service | Responsibility |
|---|---|
| `EmployeeService` | Employee CRUD; master data for fabric types and bonus options |
| `SalaryService` | Weekly (meter-based) and monthly salary calculation; advance tracking; salary history |
| `WorkManagementService` | Daily work entry CRUD; master data for work types (Stitching, Cutting, etc.) and shifts |

### Key Business Concepts
- **Salary types**: *Weekly* (piece-rate, calculated as `total meters × rate per meter`) or *Monthly* (fixed amount).
- **Advances**: Employees can take salary advances; remaining advance balance is tracked and deducted from payouts.
- **Leave deductions**: Applied per day for monthly employees; per entry for weekly employees.
- **Bonus eligibility**: A boolean flag per employee controlling bonus addition in salary calculations.
- **Fabric meters**: The core productivity unit tracked in daily work entries.
- **PDF export**: `jspdf` + `jspdf-autotable` are used in `SalaryDetails` to generate downloadable salary reports.

## Key Patterns
- **Standalone components**: All components use Angular's standalone API (`imports: [...]` in `@Component`).
- **`SHARED_IMPORTS`**: Import from `src/app/shared-imports.ts` and spread into the component's `imports` array.
- **PrimeNG**: UI library used throughout. Styles come from `@primeuix/themes` and `primeflex`.
