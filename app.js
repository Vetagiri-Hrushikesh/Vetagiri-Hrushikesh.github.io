/* -------------------------------------------------------------
   Tax Planner Pro — MVP
   FULL LOGIC FILE — With comments
   -------------------------------------------------------------
   Features included:
   - Base projection calculation
   - Type A scenarios (same year)
   - Type B scenarios (copy from previous year)
   - Multi-scenario comparison
   - Year-to-year comparison
   - CSV export
   - LocalStorage persistence
-------------------------------------------------------------- */


/* ============================================================
   STORAGE STRUCTURE
   ------------------------------------------------------------
   localStorage.taxData = {
     2025: {
       base: { salary, interest, business, invest, homeLoan, stdDed, tax },
       scenarios: [
         { id, name, type, salary, interest, business, invest, homeLoan, stdDed, tax }
       ]
     },
     2026: {...}
   }
============================================================== */

let data = JSON.parse(localStorage.getItem("taxData") || "{}");
let currentYear = 2025;

/* Save to localStorage */
function saveData() {
  localStorage.setItem("taxData", JSON.stringify(data));
}

/* Initialize empty year structure if missing */
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
   YEAR CHANGE
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
   CALCULATE TAX (Dummy simple formula)
============================================================== */
function computeTax(salary, interest, business, invest, homeLoan, stdDed) {

  let gross = salary + interest + business;
  let deductions = invest + homeLoan + stdDed;
  let taxable = Math.max(0, gross - deductions);

  // simple 20% tax
  let tax = taxable * 0.20;

  return { gross, deductions, taxable, tax };
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
    `
      Gross Income: ₹${result.gross.toLocaleString()}<br>
      Taxable: ₹${result.taxable.toLocaleString()}<br>
      Tax: <b>₹${result.tax.toLocaleString()}</b>
    `;

  return result;
}

function saveBaseProjection() {

  let base = calculateBase();
  data[currentYear].base = {
    salary: Number(salary.value),
    interest: Number(interest.value),
    business: Number(business.value),
    invest: Number(invest.value),
    homeLoan: Number(homeLoan.value),
    stdDed: Number(stdDed.value),
    tax: base.tax
  };

  saveData();
  refreshProjectionsList();
  alert("Base projection saved.");
}


/* ============================================================
   PROJECTION LIST UI
============================================================== */
function refreshProjectionsList() {
  let area = document.getElementById("projectionsArea");
  area.innerHTML = "";

  let base = data[currentYear].base;

  if (!base) {
    area.innerHTML = "<div class='small-note'>No base projection saved.</div>";
    return;
  }

  area.innerHTML = `
    <div class="note-block">
      Gross: ₹${(base.salary + base.interest + base.business).toLocaleString()}<br>
      Tax: <b>₹${base.tax.toLocaleString()}</b>
    </div>
  `;
}

refreshProjectionsList();


/* ============================================================
   OPEN SCENARIO EDITOR
============================================================== */
function openCreateScenario() {

  document.getElementById("scenarioEditor").style.display = "block";
  document.getElementById("scenarioEditorTitle").innerText = "Create Scenario";

  // Clear fields
  s_salary.value = "";
  s_interest.value = "";
  s_business.value = "";
  s_invest.value = "";
  s_homeLoan.value = "";
  s_stdDed.value = 125000;
  scenarioName.value = "";
  scenarioType.value = "A";

  document.getElementById("scenarioCalcResult").innerHTML = "";
}

function cancelScenarioEditor() {
  document.getElementById("scenarioEditor").style.display = "none";
}


/* ============================================================
   SCENARIO EXAMPLES
============================================================== */
function prefillExample(type) {
  let base = data[currentYear].base;

  if (!base) {
    alert("Save a base projection first.");
    return;
  }

  if (type === "salaryIncrease") {
    s_salary.value = base.salary * 1.2;
    s_interest.value = base.interest;
    s_business.value = base.business;
    s_invest.value = base.invest;
    s_homeLoan.value = base.homeLoan;
    s_stdDed.value = base.stdDed;
    scenarioName.value = "Salary +20%";

  } else if (type === "investMore") {
    s_salary.value = base.salary;
    s_interest.value = base.interest;
    s_business.value = base.business;
    s_invest.value = base.invest + 50000;
    s_homeLoan.value = base.homeLoan;
    s_stdDed.value = base.stdDed;
    scenarioName.value = "Invest +50k";

  } else if (type === "homeLoan") {
    s_salary.value = base.salary;
    s_interest.value = base.interest;
    s_business.value = base.business;
    s_invest.value = base.invest;
    s_homeLoan.value = 200000;
    s_stdDed.value = base.stdDed;
    scenarioName.value = "Add Home Loan";
  }
}


/* ============================================================
   SAVE SCENARIO
============================================================== */
function saveScenario() {

  let base = data[currentYear].base;

  if (!base) {
    alert("Save a base projection first.");
    return;
  }

  let type = scenarioType.value;

  // If Type B → Copy previous year's BASE
  if (type === "B") {
    if (!data[currentYear - 1] || !data[currentYear - 1].base) {
      alert("Type B requires previous year's base data.");
      return;
    }
  }

  let obj = {
    id: Date.now(),
    name: scenarioName.value || "Scenario " + Date.now(),
    type,
    salary: Number(s_salary.value),
    interest: Number(s_interest.value),
    business: Number(s_business.value),
    invest: Number(s_invest.value),
    homeLoan: Number(s_homeLoan.value),
    stdDed: Number(s_stdDed.value || 125000)
  };

  let result = computeTax(
    obj.salary, obj.interest, obj.business,
    obj.invest, obj.homeLoan, obj.stdDed
  );

  obj.tax = result.tax;

  data[currentYear].scenarios.push(obj);
  saveData();

  refreshScenarioList();

  document.getElementById("scenarioCalcResult").innerHTML =
    `Scenario Tax: <b>₹${obj.tax.toLocaleString()}</b>`;

  alert("Scenario saved!");
}

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
   MULTI-SCENARIO COMPARISON
============================================================== */
function compareSelected() {
  let boxes = document.querySelectorAll("#scenarioList input[type=checkbox]:checked");

  if (boxes.length < 2) {
    alert("Select at least 2 scenarios.");
    return;
  }

  document.getElementById("multiCompare").style.display = "block";

  let area = document.getElementById("compareArea");
  area.innerHTML = "";

  boxes.forEach(box => {
    let sc = data[currentYear].scenarios.find(x => x.id == box.value);

    area.innerHTML += `
      <div class="section">
        <b>${sc.name} (${sc.type})</b><br>
        Salary: ₹${sc.salary}<br>
        Tax: <b>₹${sc.tax.toLocaleString()}</b>
      </div>
    `;
  });
}

function closeCompare() {
  document.getElementById("multiCompare").style.display = "none";
}


/* ============================================================
   DELETE SELECTED
============================================================== */
function deleteSelected() {
  let boxes = document.querySelectorAll("#scenarioList input[type=checkbox]:checked");

  boxes.forEach(box => {
    data[currentYear].scenarios =
      data[currentYear].scenarios.filter(x => x.id != box.value);
  });

  saveData();
  refreshScenarioList();
}


/* ============================================================
   YEAR-TO-YEAR COMPARISON
============================================================== */
function openYearComparison() {

  let b1 = data[2025].base;
  let b2 = data[2026].base;

  if (!b1 || !b2) {
    alert("Save base for both years first.");
    return;
  }

  document.getElementById("yearCompare").style.display = "block";

  let area = document.getElementById("yearCompareArea");

  area.innerHTML = `
    <div class="section">
      <h3>2025</h3>
      Tax: ₹${b1.tax.toLocaleString()}
    </div>
    <div class="section">
      <h3>2026</h3>
      Tax: ₹${b2.tax.toLocaleString()}
    </div>
  `;
}

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
    "Field,Value\n" +
    `Salary,${base.salary}\n` +
    `Interest,${base.interest}\n` +
    `Business,${base.business}\n` +
    `Invest,${base.invest}\n` +
    `Home Loan,${base.homeLoan}\n` +
    `Std Ded,${base.stdDed}\n` +
    `Tax,${base.tax}\n`;

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = `Projection_${currentYear}.csv`;
  a.click();
}
