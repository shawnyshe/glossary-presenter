# Glossary Presenter (CSV → Editable, Sortable Table)

A lightweight, **no-backend** web app that turns a CSV glossary into a **spreadsheet-like table** you can **search, filter, sort, edit, reorder, insert rows**, and **export**.

Built to run anywhere static files work (e.g., **GitHub Pages**).

***

## ✨ Key Features

### ✅ Import

*   Drag-and-drop or file picker CSV upload
*   Automatically detects columns from the CSV header row

### ✅ Table UX (Spreadsheet-like)

*   **Search** across all columns or within a selected column
*   **Filter** by column
*   **Result counter** (e.g., “Showing 12 of 6823 entries”)
*   **Sticky header** with internal scrolling
*   **10-row viewport** (table scrolls inside a rounded container)
*   **Column resizing** via full-height column borders (no header conflict)

### ✅ Editing

*   Inline editing for any cell (click to edit, Enter/blur saves, Esc cancels)
*   Inline editing for **subtitle** and **author** (no separate settings panel)

### ✅ Sorting (Type-Aware)

*   Text sorting (A–Z / Z–A)
*   **Numeric sorting** (e.g., IDs)
*   **Date sorting** for `DD/MM/YYYY`
*   English detection for text columns uses a practical heuristic (first letter)

### ✅ Insert & Reorder (Excel-style)

*   **Insert row between two entries** by hovering near the left handle border
*   Insert works while **sorted or filtered**
*   **Drag-and-drop row reorder** using the left handle

### ✅ Export

*   Export filtered view as:
    *   **CSV** (UTF‑8 BOM for Excel compatibility)
    *   **JSON**
    *   **HTML presenter view** (shareable table)

### ✅ Delete UX

*   Clear hover affordance + tooltip (“DELETE”)

***

## 🚀 Demo / Deployment (GitHub Pages)

1.  Push this repo to GitHub.
2.  Go to **Settings → Pages**.
3.  Under **Build and deployment**, choose:
    *   Source: `Deploy from a branch`
    *   Branch: `main` (or `master`) and `/root`
4.  Save → GitHub gives you a public URL.

***

## 🧾 CSV Format

*   First row must be the header row (column names).
*   Values are read as strings.
*   Recommended columns include things like: `ID`, `ENUS`, `CN`, `DATE`, `NOTES`, etc.
*   Dates should be in `DD/MM/YYYY` to enable date sorting.

Example:

```csv
ID,ENUS,CN,DATE,NOTES
001,Parks & Schedule,樂園時間表,24/03/2026,Example note
002,Ticketing,門票,25/03/2026,Another note
```

***

## 🛠 How to Run Locally

Option A: open directly

*   Double click `index.html`  
    *(Some browsers restrict file APIs; a local server is better.)*

Option B: run a simple local server

*   VS Code: install “Live Server” → right click `index.html` → “Open with Live Server”
*   Or any static server you like.

***

## 🧠 Design Notes (Important)

### Internal row identity vs user ID

To keep drag/insert/edit stable under sorting and filtering:

*   `_key` is an **internal unique key** (hidden; never shown)
*   `ID` is a **user-editable field** (defaults to `"000"` for new rows)

This prevents the classic “editing the wrong row” bug when the table is reordered.

***

## 📁 Project Structure

```text
/
├─ index.html
├─ style.css
├─ script.js
└─ (optional) sample.csv
```

***

## ✅ Roadmap / Nice-to-haves

*   Undo for delete/insert
*   Multi-row selection
*   Persist column widths and metadata (localStorage)
*   Better CSV parsing (quoted commas / RFC 4180)

***

## 🙌 Credits / Notes

Built as a fast, portable glossary presenter/editor that stays entirely client-side (no backend, no database).

***

If you want, paste your repo name + your GitHub Pages link and I can tailor the README header and add **screenshots + a short “How to use” walkthrough** section.
