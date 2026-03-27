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
  if (!name) return;
  let footer = document.getElementById("author");
  if (!footer) {
    footer = document.createElement("p");
    footer.id = "author";
    document.body.appendChild(footer);
  }
  footer.textContent = `Created by ${name}`;
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
  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

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
    delTd.textContent = "🗑️";
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
}

function deleteRow(index) {
  if (!confirm("Delete this entry?")) return;
  data.splice(index, 1);
  renderBody();
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
  // Clone the entire document
  const clone = document.documentElement.cloneNode(true);

  // Remove file input (security + useless offline)
  clone.querySelectorAll('input[type="file"]').forEach(el => el.remove());

  // Inline all styles
  const styleText = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join("\n");
      } catch (e) {
        // cross-origin stylesheets (Google Fonts)
        return "";
      }
    })
    .join("\n");

  const styleEl = document.createElement("style");
  styleEl.textContent = styleText;
  clone.querySelector("head").appendChild(styleEl);

  // Remove script tags (freeze the snapshot)
  clone.querySelectorAll("script").forEach(s => s.remove());

  // Final HTML
  const html =
    "<!DOCTYPE html>\n" +
    clone.outerHTML;

  downloadFile(html, "glossary_snapshot.html", "text/html");
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
