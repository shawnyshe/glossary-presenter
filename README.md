# Glossary Presenter (CSV → Editable, Sortable Table)

A lightweight website that turns a CSV glossary into a **spreadsheet-like table** you can **search, filter, sort, edit, reorder, insert rows**, and **export**.

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
*   **Column resizing** via full-height column borders

### ✅ Editing

*   Inline editing for any cell (click to edit, Enter/blur saves, Esc cancels)
*   Inline editing for **subtitle** and **author** (no separate settings panel)

### ✅ Sorting

*   Text sorting (A–Z / Z–A)
*   **Numeric sorting** (e.g., IDs)
*   English detection for text columns uses a practical heuristic (first letter)

### ✅ Insert & Reorder

*   **Insert row between two entries** by hovering near the left handle border
*   **Drag-and-drop row reorder** using the left handle

### ✅ Export

*   Export filtered view as:
    *   **CSV** (UTF‑8 BOM for Excel compatibility)
    *   **JSON**


***

## 🧾 CSV Format

*   First row must be the header row (column names).
*   Values are read as strings.
*   Recommended columns include things like: `ID`, `ENUS`, `CN`, `DATE`, `NOTES`, etc.

Example:

```csv
ID,ENUS,CN,DATE,NOTES
001,Parks & Schedule,樂園時間表,24/03/2026,Example note
002,Ticketing,門票,25/03/2026,Another note
```

***

## 🧠 Design Notes

### Internal row identity vs user ID

To keep drag/insert/edit stable under sorting and filtering:

*   `_key` is an **internal unique key** (hidden; never shown)
*   `ID` is a **user-editable field** (defaults to `"000"` for new rows)

This prevents the classic “editing the wrong row” bug when the table is reordered.

