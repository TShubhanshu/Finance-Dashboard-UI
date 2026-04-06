# finio. — Finance Dashboard

> Frontend Developer Internship Assignment  
> Built with **React 18 · Chart.js · localStorage · Vite**

---

## Project Overview

Finio is a fully interactive single-page finance dashboard built with React 18. It lets users track income, expenses, and spending patterns through a clean dark-themed UI. The project ships as a zero-dependency frontend — no backend required — making it instantly runnable in any modern browser.

**Design:** Dark lime-green aesthetic (`#C8F135` on `#0B0C0E`) chosen to stand out from conventional blue-on-white fintech dashboards. Syne for headings, DM Sans for body, DM Mono for numbers.

---

## Features Implemented

| Feature | Implementation |
|---|---|
| ✅ Dashboard Overview | 4 summary cards (Balance, Income, Expenses, Savings Rate) with trend arrows |
| ✅ Balance Trend Chart | Line chart with 1M / 3M / 6M toggle via Chart.js |
| ✅ Spending Breakdown | Animated donut chart — top 6 expense categories with custom legend |
| ✅ Transaction List | Full table with description, category badge, date, and signed amount |
| ✅ Filtering | Filter buttons for All / Income / Expense and each major category |
| ✅ Sorting & Search | Sort by Date or Amount (asc/desc); global search across description and category |
| ✅ Role-Based UI | Admin: full CRUD + export. Viewer: read-only, all mutation controls hidden |
| ✅ Add Transaction | Inline collapsible form panel on Transactions tab — reuses for editing |
| ✅ Insights Section | 4 insight cards + monthly bars + grouped bar chart + day-of-week heatmap |
| ✅ State Management | `useState` at root App, props passed down, `localStorage` via `useEffect` |
| ✅ Responsive Design | CSS grid `auto-fit/minmax`, fluid chart wrappers, mobile-friendly |
| ✅ Export | Admin-only CSV and JSON Blob download |
| ✅ Savings Ring | Animated SVG ring showing progress toward $5,000 goal |
| ✅ Toast Notifications | Non-blocking feedback for every add/edit/delete/export action |

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 | Hooks-based, component-driven. No class components. |
| Build Tool | Vite | Fast HMR, ESM-native, minimal config |
| Charts | Chart.js 4.4 | Declarative config API; lighter than D3 for standard charts |
| Fonts | Google Fonts | Syne + DM Sans + DM Mono |
| Persistence | localStorage | No backend needed. Data survives refresh. |
| Styling | Inline JS styles | Centralized style object, zero className collisions |
| State | useState + props | Flat tree makes Context/Redux unnecessary at this scale |

---

## Setup & Installation

### Prerequisites
- Node.js v18+ from [nodejs.org](https://nodejs.org)
- npm v9+ (bundled with Node)

### Step-by-Step (Vite)

```bash
# 1. Create project
npm create vite@latest finio-dashboard -- --template react
cd finio-dashboard
npm install

# 2. Add Chart.js
npm install chart.js

# 3. Replace src/ contents
# - Delete everything in src/
# - Copy FinanceDashboard.jsx → src/App.jsx
```

Replace `src/main.jsx` with:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

Add to `<head>` in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

```bash
# 4. Run
npm run dev
# Open http://localhost:5173
```

### Zero-Setup Alternative
Open `index.html` directly in Chrome or Firefox — React and Chart.js load from CDN, no Node.js needed.

---

## Project Structure

```
finio-dashboard/
├── index.html            ← Google Fonts link here
├── src/
│   ├── main.jsx          ← ReactDOM.createRoot entry
│   └── App.jsx           ← Entire application
├── package.json
└── vite.config.js
```

### Component Map

| Component | Responsibility |
|---|---|
| `App` | Root. Owns all state: transactions, page, role, toast |
| `Dashboard` | Summary cards, charts, recent transactions, savings ring |
| `Transactions` | Table with filters/search/sort + inline AddForm panel |
| `Insights` | Insight cards, monthly bars, bar chart, heatmap |
| `AddForm` | Controlled form for add and edit. Pre-fills from `editTx` prop |
| `ChartCanvas` | Reusable Chart.js wrapper with mount/destroy lifecycle |
| `Ring` | Animated SVG progress ring for savings goal |

---

## Technical Decisions & Trade-offs

**State Management — useState + Props over Context/Redux**  
The component tree is only two levels deep. Lifting state to root App and passing as props is cleaner than adding Context boilerplate. Architecture supports upgrading to Context with minimal refactoring.

**Inline Styles over Tailwind / CSS Modules**  
No PostCSS pipeline needed. All visual decisions are co-located with components. Dark theme is a single set of JS variables rather than `dark:` variants scattered across JSX.

**Chart.js over D3**  
Declarative config API produces cleaner code for standard charts. `ChartCanvas` wraps each chart and calls `chart.destroy()` on unmount, preventing the "canvas already in use" React error.

**Inline Add Form over Modal**  
Avoids z-index issues. Keeps the transaction list visible as context while filling the form. Same `AddForm` component handles add and edit via the `editTx` prop.

---

## Role-Based UI

| UI Element | Admin | Viewer |
|---|---|---|
| + Add Transaction button | ✅ Visible | ❌ Hidden |
| Edit / Delete row actions | ✅ Visible | ❌ Hidden |
| CSV & JSON export | ✅ Visible | ❌ Hidden |
| All transaction data | ✅ Full access | ✅ Full access |
| Dashboard & Insights | ✅ Full access | ✅ Full access |
| Role badge colour | Amber | Blue |

Switch roles via the dropdown in the sidebar.

---

## Edge Cases Handled

- **Empty filter state** — Shows an illustrated empty state instead of a blank table
- **Savings ring cap** — SVG ring caps at 100% even if balance exceeds goal
- **Delete confirmation** — Browser `confirm()` prevents accidental deletion
- **Form validation** — All fields required; toast warning shown if incomplete
- **Chart cleanup** — `chart.destroy()` on unmount prevents memory leaks
- **Viewer guard** — Add button is fully hidden (not disabled) in Viewer mode
- **Number formatting** — All values use `Intl.toLocaleString` with 2 decimal places

---

## Optional Enhancements Included

- ✅ localStorage persistence
- ✅ CSV export
- ✅ JSON export  
- ✅ Toast notifications
- ✅ Animated SVG savings ring
- ✅ Day-of-week spending heatmap
- ✅ Balance trend period toggle (1M / 3M / 6M)

---

*finio. — Finance Dashboard — Frontend Developer Internship Submission*
