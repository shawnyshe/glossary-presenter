const glossaryEl = document.getElementById("glossary");

let columns = [];
let data = [];
let activeEdit = null;
let draggedIndex = null;
let placeholderRow = null;
let sortState = {
  column: null,
  direction: 1 // 1 = A→Z, -1 = Z→A
};

/* -----------------------------
   Existing utility functions
----------------------------- */
function setTitle(text) {
  if (!text) return; //
  document.getElementById("appTitle").textContent = text;
}

function setSubtitle(text) {
  document.getElementById("appSubtitle").textContent =
    text || "Import & Share Your Own Terminology";
}

function setAuthor(name) {
  const authorEl = document.getElementById("appAuthor");
  if (!authorEl) return;

  if (!name) {
    authorEl.textContent = "";
    return;
  }

  authorEl.textContent = `Created by ${name}`;
}

function updateResultCount(visibleCount) {
  const el = document.getElementById("entryCount");
  if (!el) return;

  const total = data.length;

  // No rows at all
  if (total === 0) {
    el.textContent = "";
    return;
  }

  // No filter applied
  const isFiltering =
    document.getElementById("searchInput")?.value ||
    document.getElementById("columnFilter")?.value !== "__all";

  if (!isFiltering) {
    el.textContent =
      total === 1 ? "1 entry" : `${total} entries`;
    return;
  }

  // Filtering active
  if (visibleCount === 0) {
    el.textContent = "No matching results";
    return;
  }

  el.textContent =
    `Showing ${visibleCount} of ${total} entries`;
}


/* -----------------------------
   File handling
----------------------------- */

function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) handleFile(file);
}

function handleFile(file) {
  if (!file.name.endsWith(".csv")) {
    alert("Please upload a CSV file.");
    return;
  }

  document.querySelector(".upload p").textContent =
    `✅ Loaded: ${file.name}`;

  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", () => {
  const uploadEl = document.querySelector(".upload");
  const fileInput = uploadEl.querySelector("input");

  uploadEl.addEventListener("click", () => fileInput.click());

  uploadEl.addEventListener("dragover", e => {
    e.preventDefault();
    uploadEl.classList.add("dragover");
  });

  uploadEl.addEventListener("dragleave", () => {
    uploadEl.classList.remove("dragover");
  });

  uploadEl.addEventListener("drop", e => {
    e.preventDefault();
    uploadEl.classList.remove("dragover");
    handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener("change", () => {
    handleFile(fileInput.files[0]);
  });
});

/* -----------------------------
   CSV parsing (dynamic columns)
----------------------------- */

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    alert("CSV has no data.");
    return;
  }

  columns = lines[0].split(",").map(h => h.trim());
  data = [];

  lines.slice(1).forEach(line => {
    if (!line.trim()) return;

    const values = line.split(",");
    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i]?.trim() || "";
    });

    // ✅ ADD THIS LINE (CRITICAL)
    row._key = generateRowKey();

    data.push(row);
  });

  renderTable();
}


/* -----------------------------
   Table rendering
----------------------------- */
function renderTable() {
  glossaryEl.innerHTML = `
    <div class="glossary-controls">
        <input
            type="text"
            id="searchInput"
            placeholder="Search glossary..."
        >

        <select id="columnFilter">
            <option value="__all">All columns</option>
        </select>

        <button id="addRowBtn">+ Add Entry</button>

        <button onclick="exportCSV()">Export CSV</button>
        <button onclick="exportJSON()">Export JSON</button>
        <button onclick="exportHTML()">Export HTML</button>
    </div>

    <div class="table-wrapper">
      <table id="glossaryTable">
        <thead><tr id="tableHeader"></tr></thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
  `;

  // Populate column filter dropdown
  const columnSelect = document.getElementById("columnFilter");
  columns.forEach(col => {
    const opt = document.createElement("option");
    opt.value = col;
    opt.textContent = col;
    columnSelect.appendChild(opt);
  });

  // Wire events
  document.getElementById("addRowBtn").onclick = addRow;
  document.getElementById("searchInput").oninput = renderBody;
  document.getElementById("columnFilter").onchange = renderBody;

  renderHeader();
  renderBody();
  attachColumnResizers();
}

function renderHeader() {
  const header = document.getElementById("tableHeader");
  header.innerHTML = "";

  // Drag handle header
  const dragTh = document.createElement("th");
  dragTh.textContent = "☰";
  header.appendChild(dragTh);

  // Sortable data columns (NO resizers here)
  columns.forEach(col => {
    const th = document.createElement("th");
    th.style.cursor = "pointer";
    th.title = "Click to sort (A–Z)";

    let label = col;

    if (sortState.column === col) {
      label += sortState.direction === 1 ? " ▲" : " ▼";
    }

    th.textContent = label;
    th.onclick = () => sortByColumn(col);

    header.appendChild(th);
  });

  // Delete header
  const delTh = document.createElement("th");
  delTh.textContent = "❌";
  header.appendChild(delTh);
}


function attachColumnResizers() {
  const wrapper = document.querySelector(".table-wrapper");
  const table = document.getElementById("glossaryTable");
  const headerCells = table.querySelectorAll("thead th");

  // Clear existing resizers
  wrapper.querySelectorAll(".column-resizer").forEach(el => el.remove());

  headerCells.forEach((th, index) => {
    // Skip last column (delete column)
    if (index === headerCells.length - 1) return;

    const resizer = document.createElement("div");
    resizer.className = "column-resizer";
    wrapper.appendChild(resizer);

    function positionResizer() {
      const thRect = th.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      
      resizer.style.left =
        thRect.right
        - wrapperRect.left
        + wrapper.scrollLeft
        - 3
        + "px";
    }

    positionResizer();

    resizer.addEventListener("mousedown", e => {
      e.preventDefault();

      const startX = e.pageX;
      const startWidth = th.offsetWidth;

      function onMouseMove(ev) {
        const newWidth = Math.max(
          60,
          startWidth + (ev.pageX - startX)
        );
        th.style.width = newWidth + "px";
        positionResizer();
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    window.addEventListener("resize", positionResizer);
    wrapper.addEventListener("scroll", positionResizer);
  });
}

let activeInsertHint = null;

document.addEventListener("click", e => {
  if (!activeInsertHint) return;

  const index = Number(activeInsertHint.dataset.insertIndex);
  insertRowAtVisibleIndex(index);
  removeInsertHint();
});

function showInsertHint(targetTd, edge, insertIndex) {
  removeInsertHint();

  const hint = document.createElement("div");
  hint.className = "insert-hint";
  hint.dataset.insertIndex = insertIndex;

  hint.style.top = edge === "top" ? "0px" : "100%";
  hint.style.left = "0";
  hint.style.right = "0";

  targetTd.appendChild(hint);
  activeInsertHint = hint;
}

function removeInsertHint() {
  if (activeInsertHint) {
    activeInsertHint.remove();
    activeInsertHint = null;
  }
}

function deleteRowByKey(key) {
  const index = data.findIndex(r => r._key === key);
  if (index < 0) return;

  data.splice(index, 1);
  renderBody();
}

function startEditByKey(cell, key, col) {
  // ✅ Prevent starting a second edit
  if (activeEdit) return;

  const row = data.find(r => r._key === key);
  if (!row) return;

  activeEdit = { row, col, cell };

  const originalValue = row[col];
  const input = document.createElement("input");

  input.type = "text";
  input.value = originalValue;
  input.style.width = "100%";

  cell.textContent = "";
  cell.appendChild(input);
  input.focus();
  input.select();

  function commit(save) {
    if (save) {
      row[col] = input.value;
    }
    activeEdit = null;
    renderBody(); // ✅ SAFE now
  }

  input.addEventListener("blur", () => commit(true));

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      commit(true);
    }
    if (e.key === "Escape") {
      commit(false);
    }
  });
}

function renderBody() {
  let visibleCount = 0;
  const body = document.getElementById("tableBody");
  body.innerHTML = "";

  const query =
    document.getElementById("searchInput")?.value.toLowerCase() || "";

  const columnFilter =
    document.getElementById("columnFilter")?.value || "__all";

  data.forEach((row, rowIndex) => {
    // ----- FILTER CHECK -----
    let match = false;

    if (!query) {
      match = true;
    } else if (columnFilter === "__all") {
      match = columns.some(col =>
        String(row[col]).toLowerCase().includes(query)
      );
    } else {
      match = String(row[columnFilter])
        .toLowerCase()
        .includes(query);
    }

    if (!match && !row._justInserted) return;
    visibleCount++;

    const tr = document.createElement("tr");
    tr.classList.add("data-row");
    tr.dataset.rowId = row._key;

    if (row._justInserted) {
      tr.classList.add("new-row");
      delete row._justInserted; // ✅ IMPORTANT
    }

    /* DRAG HANDLE */
    const dragTd = document.createElement("td");
    dragTd.className = "drag-handle";
    dragTd.textContent = "≡";
    dragTd.draggable = true;
    /* drag logic (unchanged) */
    dragTd.addEventListener("dragstart", e => {
      if (query) {
        alert("Clear search before reordering rows.");
        e.preventDefault();
        return;
      }
      const body = tr.parentElement;
      const visibleRows = Array.from(body.querySelectorAll("tr.data-row"));
      draggedIndex = visibleRows.indexOf(tr);
      tr.classList.add("dragging");
      placeholderRow = document.createElement("tr");
      placeholderRow.className = "drop-placeholder";
      placeholderRow.style.height = `${tr.offsetHeight}px`;
      e.dataTransfer.setData("text/plain", "");
    });

    dragTd.addEventListener("dragend", () => {
      tr.classList.remove("dragging");
      placeholderRow?.remove();
      placeholderRow = null;
      draggedIndex = null;
    });

    dragTd.addEventListener("mousemove", e => {
      if (draggedIndex !== null) return; // optional polish
      const rect = dragTd.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const threshold = 6;

      const body = tr.parentElement;
      const visibleRows = Array.from(body.querySelectorAll("tr.data-row"));
      const visibleIndex = visibleRows.indexOf(tr);
      if (visibleIndex === -1) return;

      if (offsetY < threshold) {
        showInsertHint(dragTd, "top", visibleIndex);
      } else if (offsetY > rect.height - threshold) {
        showInsertHint(dragTd, "bottom", visibleIndex + 1);
      } else {
        removeInsertHint();
      }
    });

    dragTd.addEventListener("mouseleave", removeInsertHint);

    tr.appendChild(dragTd);

    /* DATA CELLS */
    columns.forEach(col => {
      const td = document.createElement("td");
      td.textContent = row[col];
      td.onclick = () => startEditByKey(td, row._key, col);
      tr.appendChild(td);
    });

    /* DELETE CELL */
    const delTd = document.createElement("td");
    delTd.className = "delete-cell";
    delTd.textContent = "✖";
    delTd.onclick = () => deleteRowByKey(row._key);
    tr.appendChild(delTd);

    /* DROP LOGIC */
    tr.addEventListener("dragover", e => {
      e.preventDefault();
      /*if (!placeholderRow || draggedIndex === rowIndex) return;*/
      const visibleRows = Array.from(
        body.querySelectorAll("tr.data-row")
      );
      const overVisibleIndex = visibleRows.indexOf(tr);
      if (!placeholderRow || draggedIndex === overVisibleIndex) return;

      const rect = tr.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      body.insertBefore(
        placeholderRow,
        before ? tr : tr.nextSibling
      );

      autoScroll(e.clientY);
    });

    tr.addEventListener("drop", e => {
      e.preventDefault();

      const visibleRows = Array.from(
        body.querySelectorAll("tr.data-row")
      );

      const toVisibleIndex = visibleRows.indexOf(placeholderRow.nextSibling);

      moveRowByVisibleIndex(draggedIndex, toVisibleIndex);
    });

    body.appendChild(tr);
  });

  // ✅ one update, after rendering
  updateResultCount(visibleCount);
}

function autoScroll(mouseY) {
  const scrollMargin = 80;
  const scrollSpeed = 12;

  if (mouseY < scrollMargin) {
    window.scrollBy(0, -scrollSpeed);
  } else if (window.innerHeight - mouseY < scrollMargin) {
    window.scrollBy(0, scrollSpeed);
  }
}

function startsWithEnglishLetter(value) {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  const firstChar = trimmed[0];
  return /^[A-Za-z]$/.test(firstChar);
}

function isEnglishColumn(col) {
  return data.every(row => {
    const value = row[col];
    if (!value || !String(value).trim()) return true;
    return startsWithEnglishLetter(String(value));
  });
}

function parseDMY(value) {
  if (typeof value !== "string") return null;

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  return new Date(year, month - 1, day).getTime();
}

function sortByColumn(col) {
  if (document.getElementById("searchInput")?.value) {
    alert("Clear search before sorting.");
    return;
  }

  // Determine column type FIRST (before sorting)
  const sample = data.find(row => row[col])?.[col];

  const isDateColumn =
    typeof sample === "string" && parseDMY(sample) !== null;

  const isNumericColumn =
    sample !== undefined &&
    sample !== "" &&
    !isNaN(Number(sample));

  const isTextColumn = !isDateColumn && !isNumericColumn;

  // English check applies ONLY to text columns
  if (isTextColumn && !isEnglishColumn(col)) {
    alert(`Column "${col}" is not English-only.`);
    return;
  }

  // Toggle sort direction
  if (sortState.column === col) {
    sortState.direction *= -1;
  } else {
    sortState.column = col;
    sortState.direction = 1;
  }

  // ✅ SAFE: no alerts inside comparator
  data.sort((a, b) => {
    const av = a[col];
    const bv = b[col];

    // 1️⃣ Date sort
    if (isDateColumn) {
      return (parseDMY(av) - parseDMY(bv)) * sortState.direction;
    }

    // 2️⃣ Numeric sort
    if (isNumericColumn) {
      return (Number(av) - Number(bv)) * sortState.direction;
    }

    // 3️⃣ Text sort
    return String(av ?? "")
      .localeCompare(String(bv ?? ""), "en", { sensitivity: "base" })
      * sortState.direction;
  });

  renderBody();
  renderHeader();
  attachColumnResizers();
}

/* -----------------------------
   Editing
----------------------------- 
   Add / Delete rows
----------------------------- */

function generateRowKey() {
  return crypto.randomUUID();
}

function addRow() {
  const newRow = {};
  columns.forEach(col => (newRow[col] = ""));

  newRow._key = generateRowKey();
  newRow.ID = "000";
  newRow._justInserted = true;

  data.push(newRow);   // ✅ APPEND

  if (sortState.column) {
    sortByColumn(sortState.column);
  } else {
    renderBody();
  }

  // ✅ Optional: scroll new row into view
  setTimeout(() => {
    const rows = document.querySelectorAll("#glossaryTable tbody tr");
    rows[rows.length - 1]?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 0);
}


function insertRowAtVisibleIndex(visibleIndex) {
  
  const rows = document.querySelectorAll("#glossaryTable tbody tr.data-row");
  let dataIndex = data.length;

  if (visibleIndex < rows.length) {
    const targetKey = rows[visibleIndex].dataset.rowId;
    dataIndex = data.findIndex(r => r._key === targetKey);
  }

  if (dataIndex < 0) dataIndex = data.length;

  const newRow = {};
  columns.forEach(col => (newRow[col] = ""));
  newRow._key = generateRowKey();
  newRow.ID = "000";
  newRow._justInserted = true;

  data.splice(dataIndex, 0, newRow);

  renderBody();
  renderHeader();
  attachColumnResizers();

  // scroll to and highlight new row
  setTimeout(() => {
    const el = document.querySelector("tr.new-row");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 0);
}

function moveRowByVisibleIndex(fromVisible, toVisible) {
  if (fromVisible === toVisible) return;

  const rows = document.querySelectorAll("tr.data-row");
  const fromKey = rows[fromVisible]?.dataset.rowId;
  const toKey = rows[toVisible]?.dataset.rowId;

  const fromIndex = data.findIndex(r => r._key === fromKey);
  const toIndex = toKey
    ? data.findIndex(r => r._key === toKey)
    : data.length;

  if (fromIndex < 0 || toIndex < 0) return;

  const [row] = data.splice(fromIndex, 1);
  data.splice(toIndex, 0, row);

  renderBody();
}


/*function deleteRow(index) {
  if (!confirm("Delete this entry?")) return;
  data.splice(index, 1);
  renderBody();
  attachColumnResizers();
}*/

function getFilteredData() {
  const query =
    document.getElementById("searchInput")?.value
      .toLowerCase() || "";

  const columnFilter =
    document.getElementById("columnFilter")?.value || "__all";

  return data.filter(row => {
    if (!query) return true;

    if (columnFilter === "__all") {
      return columns.some(col =>
        String(row[col]).toLowerCase().includes(query)
      );
    }

    return String(row[columnFilter])
      .toLowerCase()
      .includes(query);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".inline-editable").forEach(el => {
    let originalText = "";

    el.addEventListener("focus", () => {
      originalText = el.textContent;
    });

    el.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        el.blur(); // save
      }

      if (e.key === "Escape") {
        el.textContent = originalText;
        el.blur(); // cancel
      }
    });

    el.addEventListener("blur", () => {
      el.textContent = el.textContent.trim();
      // optional: persist here
    });
  });
});

function exportCSV() {
  const rows = getFilteredData();
  if (!rows.length) {
    alert("No data to export.");
    return;
  }

  let csv = "";

  // Header
  csv += columns.join(",") + "\r\n";

  // Rows
  rows.forEach(row => {
    const line = columns.map(col =>
      `"${String(row[col] ?? "").replace(/"/g, '""')}"`
    );
    csv += line.join(",") + "\r\n";
  });

  // ✅ UTF-8 BOM for Excel (Chinese-safe)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "glossary.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const rows = getFilteredData();
  if (!rows.length) return alert("No data to export.");

  const json = JSON.stringify(rows, null, 2);
  downloadFile(json, "glossary.json", "application/json");
}

function getAppStyles() {
  let css = "";

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        css += rule.cssText + "\n";
      }
    } catch (e) {
      // Ignore cross-origin styles (Google Fonts)
    }
  }

  return css;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
