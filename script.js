const glossaryEl = document.getElementById("glossary");

let columns = [];
let data = [];

/* -----------------------------
   Existing utility functions
----------------------------- */
function setTitle(text) {
  if (!text) return; //
  document.getElementById("appTitle").textContent = text;
}

function setSubtitle(text) {
  document.getElementById("appSubtitle").textContent =
    text || "Import, View & Share Your Terminology";
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

function updateEntryCount(visibleOnly = false) {
  const el = document.getElementById("entryCount");
  if (!el) return;

  const count = visibleOnly
    ? getFilteredData().length
    : data.length;

  if (!count) {
    el.textContent = "";
    return;
  }

  el.textContent =
    count === 1
      ? "1 entry"
      : `${count} entries in total`;
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

document.querySelector(".upload").addEventListener("click", () => {
  document.querySelector(".upload input[type='file']").click();
});

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

/* -----------------------------
   CSV parsing (dynamic columns)
----------------------------- */

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return alert("CSV has no data.");

  columns = lines[0].split(",").map(h => h.trim());
  data = [];

  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const values = line.split(",");
    const row = {};

    columns.forEach((col, i) => {
      row[col] = values[i]?.trim() || "";
    });

    data.push(row);
  });

  renderTable();
  updateEntryCount();
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
}

function renderHeader() {
  const header = document.getElementById("tableHeader");
  header.innerHTML = "";

  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;

    const resizer = document.createElement("div");
    resizer.className = "resizer";
    th.appendChild(resizer);

    setupColumnResize(th, resizer);

    header.appendChild(th);
  });

  const delTh = document.createElement("th");
  delTh.textContent = "❌";
  header.appendChild(delTh);
}

function setupColumnResize(th, resizer) {
  let startX, startWidth;

  resizer.addEventListener("mousedown", e => {
    startX = e.pageX;
    startWidth = th.offsetWidth;

    document.addEventListener("mousemove", resizeColumn);
    document.addEventListener("mouseup", stopResize);
  });

  function resizeColumn(e) {
    const newWidth = startWidth + (e.pageX - startX);
    th.style.width = newWidth + "px";
  }

  function stopResize() {
    document.removeEventListener("mousemove", resizeColumn);
    document.removeEventListener("mouseup", stopResize);
  }
}

function renderBody() {
  const body = document.getElementById("tableBody");
  body.innerHTML = "";

  const query = document
    .getElementById("searchInput")?.value
    ?.toLowerCase() || "";

  const columnFilter =
    document.getElementById("columnFilter")?.value || "__all";

  data.forEach((row, rowIndex) => {
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

    if (!match) return;

    const tr = document.createElement("tr");

    columns.forEach(col => {
      const td = document.createElement("td");
      td.textContent = row[col];
      td.classList.add("editable");
      td.onclick = () => startEdit(td, rowIndex, col);
      tr.appendChild(td);
    });

    const delTd = document.createElement("td");
    delTd.textContent = "?️";
    delTd.className = "delete-cell";
    delTd.onclick = () => deleteRow(rowIndex);
    tr.appendChild(delTd);

    body.appendChild(tr);
  });
}

/* -----------------------------
   Editing
----------------------------- */

function startEdit(cell, rowIndex, column) {
  const oldValue = cell.textContent;
  const input = document.createElement("input");
  input.value = oldValue;
  input.style.width = "100%";

  input.addEventListener("blur", () => {
    data[rowIndex][column] = input.value;
    renderBody();
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      cell.textContent = oldValue;
      renderBody();
    }
  });

  cell.textContent = "";
  cell.appendChild(input);
  input.focus();
}

/* -----------------------------
   Add / Delete rows
----------------------------- */

function addRow() {
  const newRow = {};
  columns.forEach(col => (newRow[col] = ""));
  data.push(newRow);
  renderBody();
  updateEntryCount();
}

function deleteRow(index) {
  if (!confirm("Delete this entry?")) return;
  data.splice(index, 1);
  renderBody();
  updateEntryCount();
}

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

function exportCSV() {
  const rows = getFilteredData();
  if (!rows.length) return alert("No data to export.");

  let csv = "";

  // Header
  csv += columns.join(",") + "\n";

  // Rows
  rows.forEach(row => {
    const line = columns.map(col =>
      `"${String(row[col]).replace(/"/g, '""')}"`
    );
    csv += line.join(",") + "\n";
  });

  downloadFile(csv, "glossary.csv", "text/csv");
}

function exportJSON() {
  const rows = getFilteredData();
  if (!rows.length) return alert("No data to export.");

  const json = JSON.stringify(rows, null, 2);
  downloadFile(json, "glossary.json", "application/json");
}

function exportHTML() {
  const rows = getFilteredData();
  if (!rows.length) {
    alert("No data to export.");
    return;
  }

  // Header metadata
  const title = document.getElementById("appTitle")?.textContent || "";
  const subtitle = document.getElementById("appSubtitle")?.textContent || "";
  const author = document.getElementById("appAuthor")?.textContent || "";
  const count = `${rows.length} entries`;

  // Build column options
  const columnOptions =
    `<option value="__all">All columns</option>` +
    columns.map(c => `<option value="${c}">${c}</option>`).join("");

  // Build table header
  const tableHead =
    `<tr>` + columns.map(c => `<th>${c}</th>`).join("") + `</tr>`;

  // Build table body
  const tableBody = rows
    .map(row =>
      `<tr>` +
        columns.map(c => `<td>${row[c] ?? ""}</td>`).join("") +
      `</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>

<style>
body {
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #e5e7eb;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

input, select {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #020617;
  color: #e5e7eb;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border-bottom: 1px solid #1e293b;
  padding: 6px 8px;
}

th {
  background: #020617;
  position: sticky;
  top: 0;
}
</style>
</head>

<body>

<header>
  <h1>${title}</h1>
  <p>${subtitle}</p>
  <p>${author}</p>
  <p>${count}</p>
</header>

<div class="controls">
  <input type="text" id="searchInput" placeholder="Search...">
  <select id="columnFilter">
    ${columnOptions}
  </select>
</div>

<table id="glossaryTable">
  <thead>${tableHead}</thead>
  <tbody>${tableBody}</tbody>
</table>

<script>
const searchInput = document.getElementById("searchInput");
const columnFilter = document.getElementById("columnFilter");
const rows = Array.from(document.querySelectorAll("#glossaryTable tbody tr"));

function applyFilter() {
  const q = searchInput.value.toLowerCase();
  const col = columnFilter.value;

  rows.forEach(tr => {
    const cells = Array.from(tr.children);
    let text = col === "__all"
      ? cells.map(td => td.textContent).join(" ")
      : cells[${columns.map(JSON.stringify).indexOf(col)}]?.textContent || "";

    tr.style.display = text.toLowerCase().includes(q) ? "" : "none";
  });
}

searchInput.addEventListener("input", applyFilter);
columnFilter.addEventListener("change", applyFilter);
</script>

</body>
</html>
`;

  downloadFile(html, "glossary_viewer.html", "text/html");
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
