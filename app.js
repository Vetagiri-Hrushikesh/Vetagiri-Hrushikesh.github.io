/* ============================================================
   FIXED VERSION — Tax Planner Pro MVP
   All scenario logic corrected.
============================================================== */

let data = JSON.parse(localStorage.getItem("taxData") || "{}");
let currentYear = 2025;
const DEFAULT_STD_DED = 125000;

function saveData() {
  localStorage.setItem("taxData", JSON.stringify(data));
}

function ensureYear(year) {
  if (!data[year]) {
    data[year] = {
      base: null,
      scenarios: []
    };
  }
}

ensureYear(2025);
ensureYear(2026);


/* ============================================================
   YEAR SWITCHING
============================================================== */
function changeYear() {
  currentYear = parseInt(document.getElementById("yearSelect").value);
  document.getElementById("currentYearLabel").innerText = currentYear;
  document.getElementById("yearBadge").innerText = currentYear;
  document.getElementById("yearBadge2").innerText = currentYear;

  refreshScenarioList();
  refreshProjectionsList();
}



/* ============================================================
   TAX CALCULATION ENGINE
============================================================== */
function computeTax(salary, interest, business, invest, homeLoan, stdDed) {

  salary = Number(salary || 0);
  interest = Number(interest || 0);
  business = Number(business || 0);
  invest = Number(invest || 0);
  homeLoan = Number(homeLoan || 0);
  stdDed = Number(stdDed || 0);

  let gross = salary + interest + business;
  let deductions = invest + homeLoan + stdDed;
  let taxable = Math.max(0, gross - deductions);
  let tax = taxable * 0.20;

  return { gross, deductions, taxable, tax };
}

function normalizeEntry(entry = {}) {
  const normalized = { ...entry };

  normalized.salary = Number(normalized.salary || 0);
  normalized.interest = Number(normalized.interest || 0);
  normalized.business = Number(normalized.business || 0);
  normalized.invest = Number(normalized.invest || 0);
  normalized.homeLoan = Number(normalized.homeLoan || 0);

  if (normalized.stdDed === undefined || normalized.stdDed === null) {
    normalized.stdDed = DEFAULT_STD_DED;
  } else {
    normalized.stdDed = Number(normalized.stdDed || 0);
  }

  const metrics = computeTax(
    normalized.salary,
    normalized.interest,
    normalized.business,
    normalized.invest,
    normalized.homeLoan,
    normalized.stdDed
  );

  if (isNaN(normalized.taxable)) {
    normalized.taxable = metrics.taxable;
  }

  if (isNaN(normalized.tax)) {
    normalized.tax = metrics.tax;
  }

  return normalized;
}

function normalizeDataStructure() {
  Object.keys(data).forEach(year => ensureYear(year));

  Object.keys(data).forEach(year => {
    const yearBlock = data[year];
    if (yearBlock.base) {
      yearBlock.base = normalizeEntry(yearBlock.base);
    }
    yearBlock.scenarios = (yearBlock.scenarios || []).map(normalizeEntry);
  });

  saveData();
}

normalizeDataStructure();

function formatCurrency(value) {
  const num = Number(value);
  if (isNaN(num)) {
    return "—";
  }
  return `₹${num.toLocaleString()}`;
}

function setFieldValue(inputEl, value) {
  if (!inputEl) return;

  if (value === "" || value === null || value === undefined) {
    inputEl.value = "";
  } else {
    const num = Number(value);
    inputEl.value = isNaN(num) ? "" : num;
  }

  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  inputEl.dispatchEvent(new Event("change", { bubbles: true }));
}



/* ============================================================
   BASE PROJECTION
============================================================== */
function calculateBase() {

  let salary = Number(document.getElementById("salary").value);
  let interest = Number(document.getElementById("interest").value);
  let business = Number(document.getElementById("business").value);
  let invest = Number(document.getElementById("invest").value);
  let homeLoan = Number(document.getElementById("homeLoan").value);
  let stdDed = Number(document.getElementById("stdDed").value);

  let result = computeTax(salary, interest, business, invest, homeLoan, stdDed);

  document.getElementById("baseTaxResult").innerHTML =
    `Gross: ₹${result.gross.toLocaleString()}<br>
     Taxable: ₹${result.taxable.toLocaleString()}<br>
     Tax: <b>₹${result.tax.toLocaleString()}</b>`;

  return result;
}

function saveBaseProjection() {

  let r = calculateBase();

  ensureYear(currentYear);

  data[currentYear].base = normalizeEntry({
    salary: Number(salary.value),
    interest: Number(interest.value),
    business: Number(business.value),
    invest: Number(invest.value),
    homeLoan: Number(homeLoan.value),
    stdDed: Number(stdDed.value),
    taxable: r.taxable,
    tax: r.tax
  });

  saveData();
  refreshProjectionsList();
  alert("Base projection saved.");
}



/* ============================================================
   REFRESH BASE LIST
============================================================== */
function refreshProjectionsList() {
  let area = document.getElementById("projectionsArea");
  area.innerHTML = "";

  let base = data[currentYear].base;

  if (!base) {
    area.innerHTML = "<div class='small-note'>No base projection saved.</div>";
    return;
  }

  let gross = base.salary + base.interest + base.business;

  area.innerHTML =
    `<div class="note-block">
       Gross: ₹${gross.toLocaleString()}<br>
       Tax: <b>₹${base.tax.toLocaleString()}</b>
     </div>`;
}

refreshProjectionsList();



/* ============================================================
   OPEN CREATE-SCENARIO PANEL
============================================================== */
function openCreateScenario() {

    document.getElementById("scenarioEditor").style.display = "block";
    document.getElementById("scenarioEditorTitle").innerText = "Create Scenario";
  
    // Reset fields
    scenarioName.value = "";
    scenarioType.value = "A";
  
    let base = data[currentYear].base;
  
    // TYPE A default = current year base
    if (base) {
      setFieldValue(s_salary, base.salary);
      setFieldValue(s_interest, base.interest);
      setFieldValue(s_business, base.business);
      setFieldValue(s_invest, base.invest);
      setFieldValue(s_homeLoan, base.homeLoan);
      setFieldValue(s_stdDed, base.stdDed);
    } else {
      // If base not available, use blank form
      setFieldValue(s_salary, "");
      setFieldValue(s_interest, "");
      setFieldValue(s_business, "");
      setFieldValue(s_invest, "");
      setFieldValue(s_homeLoan, "");
      setFieldValue(s_stdDed, DEFAULT_STD_DED);
    }
  
    document.getElementById("scenarioCalcResult").innerHTML = "";
}
  
  function handleScenarioTypeChange() {
    let type = scenarioType.value;
  
    // TYPE A → use current year base
    if (type === "A") {
      let base = data[currentYear].base;
      if (!base) {
        alert("Save current year's base projection first.");
        return;
      }
      setFieldValue(s_salary, base.salary);
      setFieldValue(s_interest, base.interest);
      setFieldValue(s_business, base.business);
      setFieldValue(s_invest, base.invest);
      setFieldValue(s_homeLoan, base.homeLoan);
      setFieldValue(s_stdDed, base.stdDed);
    }
  
    // TYPE B → copy previous year base
    if (type === "B") {
      fillTypeB();
    }
  }
  

function cancelScenarioEditor() {
  document.getElementById("scenarioEditor").style.display = "none";
}



/* ============================================================
   PREFILL EXAMPLES — FIXED
============================================================== */
function prefillExample(example) {
  let base = data[currentYear].base;

  if (!base) {
    alert("Save base projection first!");
    return;
  }

  if (example === "salaryIncrease") {
    setFieldValue(s_salary, base.salary * 1.2);
    setFieldValue(s_interest, base.interest);
    setFieldValue(s_business, base.business);
    setFieldValue(s_invest, base.invest);
    setFieldValue(s_homeLoan, base.homeLoan);
    setFieldValue(s_stdDed, base.stdDed);
    scenarioName.value = "Salary +20%";
  }

  if (example === "investMore") {
    setFieldValue(s_salary, base.salary);
    setFieldValue(s_interest, base.interest);
    setFieldValue(s_business, base.business);
    setFieldValue(s_invest, base.invest + 50000);
    setFieldValue(s_homeLoan, base.homeLoan);
    setFieldValue(s_stdDed, base.stdDed);
    scenarioName.value = "Invest +50k";
  }

  if (example === "homeLoan") {
    setFieldValue(s_salary, base.salary);
    setFieldValue(s_interest, base.interest);
    setFieldValue(s_business, base.business);
    setFieldValue(s_invest, base.invest);
    setFieldValue(s_homeLoan, 200000);
    setFieldValue(s_stdDed, base.stdDed);
    scenarioName.value = "Add Home Loan";
  }
}



/* ============================================================
   TYPE B COPY LOGIC — FIXED
============================================================== */
function fillTypeB() {

    let prevYear = currentYear - 1;
  
    if (!data[prevYear] || !data[prevYear].base) {
      alert("Type B requires previous year's base projection.");
      scenarioType.value = "A";
      return false;
    }
  
    let base = data[prevYear].base;
  
    setFieldValue(s_salary, base.salary);
    setFieldValue(s_interest, base.interest);
    setFieldValue(s_business, base.business);
    setFieldValue(s_invest, base.invest);
    setFieldValue(s_homeLoan, base.homeLoan);
    setFieldValue(s_stdDed, base.stdDed);
  
    return true;
  }
  



/* ============================================================
   SAVE SCENARIO — FIXED
============================================================== */
function saveScenario() {

  let type = scenarioType.value;

  // TYPE B must never allow empty fields
  if (type === "B") {
    if (!fillTypeB()) return;
  }

  // Read scenario fields
  let obj = {
    id: Date.now(),
    name: scenarioName.value || ("Scenario " + Date.now()),
    type,
    salary: Number(s_salary.value || 0),
    interest: Number(s_interest.value || 0),
    business: Number(s_business.value || 0),
    invest: Number(s_invest.value || 0),
    homeLoan: Number(s_homeLoan.value || 0),
    stdDed: Number(s_stdDed.value || DEFAULT_STD_DED)
  };

  obj = normalizeEntry(obj);

  // Save scenario
  data[currentYear].scenarios.push(obj);
  saveData();

  document.getElementById("scenarioCalcResult").innerHTML =
    `Scenario Tax: <b>₹${obj.tax.toLocaleString()}</b>`;

  refreshScenarioList();
  alert("Scenario saved!");
}



/* ============================================================
   SCENARIO LIST RENDER
============================================================== */
function refreshScenarioList() {

  let list = document.getElementById("scenarioList");
  list.innerHTML = "";

  let scenarios = data[currentYear].scenarios;

  if (!scenarios.length) {
    list.innerHTML = "<div class='small-note'>No scenarios yet.</div>";
    return;
  }

  scenarios.forEach(sc => {

    let div = document.createElement("div");
    div.className = "scenario-item";

    div.innerHTML = `
      <div>
        <input type="checkbox" value="${sc.id}" />
        <b>${sc.name}</b><br>
        <span class='small-note'>Tax: ₹${sc.tax.toLocaleString()}</span>
      </div>
      <div>${sc.type}</div>
    `;

    list.appendChild(div);
  });
}

refreshScenarioList();



/* ============================================================
   MULTI-SCENARIO COMPARISON — FIXED
============================================================== */
/* ============================================================
   COMPARE SELECTED SCENARIOS — FULL TABLE (FIXED)
============================================================== */

function compareSelected() {

    const checks = [...document.querySelectorAll('#scenarioList input[type=checkbox]:checked')];
  
    if (checks.length === 0) {
      alert("Select at least 1 scenario to compare.");
      return;
    }
  
    // Gather selected scenarios
    const ids = checks.map(c => Number(c.value));
    const scenarios = data[currentYear].scenarios.filter(s => ids.includes(s.id));
  
    const base = data[currentYear].base
      ? { name: "Base Projection", ...normalizeEntry(data[currentYear].base) }
      : null;
  
    renderComparison(base, scenarios.map(normalizeEntry));
  }
  
  function renderComparison(base, scenarios) {

    const area = document.getElementById("compareArea");
    area.innerHTML = "";
  
    const cols = [];
    const hasBaseColumn = Boolean(base);
  
    if (base) cols.push(base);
    scenarios.forEach(s => cols.push(s));
  
    if (!cols.length) {
      area.innerHTML = "<div class='small-note'>No scenarios could be rendered.</div>";
      return;
    }
  
    let html = `
      <table class="compare-table">
        <tr>
          <th>Field</th>
          ${cols.map(c => `<th>${c.name || "Scenario"}</th>`).join("")}
        </tr>
    `;
  
    function cellClass(idx) {
      if (!hasBaseColumn) return "";
      return idx === 0 ? "base-col" : "";
    }
  
    function row(label, key) {
      return `
        <tr>
          <td>${label}</td>
          ${cols
            .map((c, idx) => `<td class="${cellClass(idx)}">${formatCurrency(c[key])}</td>`)
            .join("")}
        </tr>
      `;
    }
  
    html += row("Salary", "salary");
    html += row("Interest Income", "interest");
    html += row("Business Income", "business");
    html += row("Investments", "invest");
    html += row("Home Loan Interest", "homeLoan");
    html += row("Standard Deduction", "stdDed");
    html += row("Taxable Income", "taxable");
    html += row("Estimated Tax", "tax");
  
    html += "</table>";
  
    area.innerHTML = html;
    document.getElementById("multiCompare").style.display = "block";
  }
  

function closeCompare() {
  document.getElementById("multiCompare").style.display = "none";
}



/* ============================================================
   DELETE SELECTED SCENARIOS
============================================================== */
function deleteSelected() {

  let selected = [...document.querySelectorAll("#scenarioList input:checked")];

  data[currentYear].scenarios = data[currentYear].scenarios.filter(
    sc => !selected.some(s => s.value == sc.id)
  );

  saveData();
  refreshScenarioList();
}



/* ============================================================
   BASE YEAR COMPARISON
============================================================== */
function openYearComparison() {

  let y1 = data[2025].base ? normalizeEntry({ name: "2025 Base", ...data[2025].base }) : null;
  let y2 = data[2026].base ? normalizeEntry({ name: "2026 Base", ...data[2026].base }) : null;

  if (!y1 || !y2) {
    alert("Both 2025 and 2026 base projections required.");
    return;
  }

  document.getElementById("yearCompare").style.display = "block";

  const rows = [
    { label: "Salary", key: "salary" },
    { label: "Interest Income", key: "interest" },
    { label: "Business Income", key: "business" },
    { label: "Investments", key: "invest" },
    { label: "Home Loan Interest", key: "homeLoan" },
    { label: "Standard Deduction", key: "stdDed" },
    { label: "Taxable Income", key: "taxable" },
    { label: "Estimated Tax", key: "tax" }
  ];

  let tableHtml = `
    <table class="compare-table year-compare-table">
      <tr>
        <th>Field</th>
        <th>2025 Base</th>
        <th>2026 Base</th>
      </tr>
  `;

  rows.forEach(row => {
    tableHtml += `
      <tr>
        <td>${row.label}</td>
        <td>${formatCurrency(y1[row.key])}</td>
        <td>${formatCurrency(y2[row.key])}</td>
      </tr>
    `;
  });

  tableHtml += "</table>";

  document.getElementById("yearCompareArea").innerHTML = tableHtml;
}
function resetPrintState() {
  document.body.removeAttribute("data-print");
}

function printSection(sectionId) {
  const target = document.getElementById(sectionId);

  if (!target) {
    alert("Section not found.");
    return;
  }

  const visible = target.offsetParent !== null && getComputedStyle(target).display !== "none";
  if (!visible) {
    alert("Open this section before printing.");
    return;
  }

  document.body.setAttribute("data-print", sectionId);
  window.print();

  setTimeout(resetPrintState, 500);
}

window.addEventListener("afterprint", resetPrintState);

function closeYearCompare() {
  document.getElementById("yearCompare").style.display = "none";
}



/* ============================================================
   EXPORT CSV
============================================================== */
function exportCSV() {

  let base = data[currentYear].base;

  if (!base) {
    alert("Save base projection first.");
    return;
  }

  let csv =
    `Field,Value\n` +
    `Salary,${base.salary}\n` +
    `Interest,${base.interest}\n` +
    `Business,${base.business}\n` +
    `Invest,${base.invest}\n` +
    `HomeLoan,${base.homeLoan}\n` +
    `StdDed,${base.stdDed}\n` +
    `Tax,${base.tax}\n`;

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");

  a.href = url;
  a.download = `Projection_${currentYear}.csv`;
  a.click();
}
