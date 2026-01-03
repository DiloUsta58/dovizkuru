/* =====================================
   SPRACHE – INITIAL (GANZ OBEN)
===================================== */

// Sprache initial korrekt bestimmen
let LANG = localStorage.getItem("lang");

if (!LANG) {
  LANG = (navigator.language || "").startsWith("tr") ? "tr" : "de";
  localStorage.setItem("lang", LANG);
}

// Locale NACH LANG setzen
const LOCALE = LANG === "tr" ? "tr-TR" : "de-DE";



/* =========================================================
   i18n – Deutsch / Türkisch (ZENTRAL)
========================================================= */

const i18n = {
  de: {
    /* ===== Allgemein ===== */
    title: "Wechselkurs Monatsübersicht",
    loading: "Laden …",
    nodata: "Keine Daten gefunden",
    invalidRange: "Ungültiger Zeitraum!",
    loadError: "Fehler beim Laden!",
    sum: "Summe",

    /* ===== Buttons / Controls ===== */
    show: "Anzeigen",
    today: "Heute",
    month: "Monat",
    year: "12 Monate",
    darkmode: "Dark Mode",
    pdf: "PDF",
    print: "Drucken",

    /* ===== Tabelle ===== */
    month_col: "Monat",

    /* ===== Toggle / Titel ===== */
    toggle: (f, t) => `${f} → ${t}`,
    ratesTitle: (f, t, a, b) =>
      `Wechselkurse ${f} → ${t} (${a} – ${b})`,

    /* ===== Footer / Status ===== */
    updated: d => `Aktualisiert: ${d}`,
    footer_author: "© Dilaver Bölükbaşı",
    footer_lastupdate: "Zuletzt aktualisiert",

    /* ===== Chart / PDF ===== */
    chart: c => `Monatsverlauf (${c})`,
    pdfTitle: (a, b) => `${a} – ${b}`
  },

  tr: {
    /* ===== Genel ===== */
    title: "Aylık Döviz Kuru Özeti",
    loading: "Yükleniyor …",
    nodata: "Veri bulunamadı",
    invalidRange: "Geçersiz tarih aralığı!",
    loadError: "Yükleme hatası!",
    sum: "Toplam",

    /* ===== Butonlar / Kontroller ===== */
    show: "Göster",
    today: "Bugün",
    month: "Ay",
    year: "12 Ay",
    darkmode: "Karanlık Mod",
    pdf: "PDF",
    print: "Yazdır",

    /* ===== Tablo ===== */
    month_col: "Ay",

    /* ===== Toggle / Başlık ===== */
    toggle: (f, t) => `${f} → ${t}`,
    ratesTitle: (f, t, a, b) =>
      `${f} → ${t} Döviz Kurları (${a} – ${b})`,

    /* ===== Altbilgi / Durum ===== */
    updated: d => `Güncellendi: ${d}`,
    footer_author: "© Dilaver Bölükbaşı",
    footer_lastupdate: "Son güncelleme",

    /* ===== Grafik / PDF ===== */
    chart: c => `Aylık Değişim (${c})`,
    pdfTitle: (a, b) => `${a} – ${b}`
  }
};


const T = i18n[LANG];

/* =========================================================
   Hilfsfunktionen (Formatierung)
========================================================= */

const nf = new Intl.NumberFormat(
  LANG === "tr" ? "tr-TR" : "de-DE",
  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
);

const df = new Intl.DateTimeFormat(
  LANG === "tr" ? "tr-TR" : "de-DE"
);

function fmtDate(d) {
  return df.format(d);
}

/* =========================================================
   HTML Texte anwenden
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (T[key]) el.textContent = T[key];
  });
});

/* =========================================================
   Beispiel Nutzung in JS
========================================================= */

function setLoading(active) {
  const loader = document.getElementById("loader");
  loader.textContent = T.loading;
  loader.classList.toggle("hidden", !active);
}

/* Titel */
function updateTitle(from, to, fromDate, toDate) {
  document.getElementById("yearTitle").textContent =
    T.ratesTitle(from, to, fromDate, toDate);
}

/* Fehler */
function showError(type) {
const map = {
  invalid: T.invalidRange,
  nodata: T.nodata,
  error: T.loadError
};

  document.getElementById("tableBody").innerHTML =
    `<tr><td colspan="3" class="empty">${map[type]}</td></tr>`;
}

/* =========================================================
   Splash Fade-Out
========================================================= */

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  if (!splash) return;

  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(() => splash.remove(), 600);
  }, 800);
});


/* =========================================================
   Konfiguration & Konstanten
========================================================= */

const API_BASE = "https://api.frankfurter.app";

const MONTHS = {
  de: [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ],
  tr: [
    "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
    "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"
  ]
};


const STORAGE_FROM   = "date_from";
const STORAGE_TO     = "date_to";
const STORAGE_THEME  = "theme";
const STORAGE_AMOUNT = "amount";

/* =========================================================
   DOM
========================================================= */

const loader    = document.getElementById("loader");
const tableBody = document.getElementById("tableBody");
const yearTitle = document.getElementById("yearTitle");

const amountInput   = document.getElementById("amount");
const dateFromInput = document.getElementById("dateFrom");
const dateToInput   = document.getElementById("dateTo");

const toggleBtn   = document.getElementById("toggleBtn");
const showBtn     = document.getElementById("showBtn");
const pdfBtn      = document.getElementById("pdfBtn");
const darkModeBtn = document.getElementById("darkModeBtn");

const presetToday = document.getElementById("presetToday");
const presetMonth = document.getElementById("presetMonth");
const presetYear  = document.getElementById("presetYear");

const colFrom = document.getElementById("colFrom");
const colTo   = document.getElementById("colTo");

const chartCanvas = document.getElementById("chart");


/* =========================================================
   Status
========================================================= */

let direction = "EUR_TRY";
const rateCache = {};
let chartInstance = null;

/* 👉 Gemeinsamer Debounce-Timer */
let autoReloadTimer = null;

/* =========================================================
   Initialisierung
========================================================= */

(function init() {
  const today = new Date();
  today.setHours(0,0,0,0);

  dateFromInput.value =
    localStorage.getItem(STORAGE_FROM) || today.toISOString().slice(0,10);

  dateToInput.value =
    localStorage.getItem(STORAGE_TO) || today.toISOString().slice(0,10);

  amountInput.value =
    localStorage.getItem(STORAGE_AMOUNT) || "1";

  if (localStorage.getItem(STORAGE_THEME) === "dark") {
    document.body.dataset.theme = "dark";
  }

  updateToggleUI();
})();

/* =========================================================
   Auto-Reload (Debounce)
========================================================= */

function triggerAutoReload(delay = 400) {
  clearTimeout(autoReloadTimer);
  autoReloadTimer = setTimeout(loadData, delay);
}

/* =========================================================
   LocalStorage + Auto-Reload Listener
========================================================= */

amountInput.addEventListener("input", () => {
  localStorage.setItem(STORAGE_AMOUNT, amountInput.value);
  triggerAutoReload();
});

dateFromInput.addEventListener("change", () => {
  localStorage.setItem(STORAGE_FROM, dateFromInput.value);
  triggerAutoReload();
});

dateToInput.addEventListener("change", () => {
  localStorage.setItem(STORAGE_TO, dateToInput.value);
  triggerAutoReload();
});

/* =========================================================
   UI-Helfer
========================================================= */

function setLoading(active) {
  loader.classList.toggle("hidden", !active);
}

/* FORMATIERUNG I18N-SAUBER*/
function formatNumber(v) {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(v);
}


function formatDateDE(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function updateToggleUI() {
  const from = direction === "EUR_TRY" ? "EUR" : "TRY";
  const to   = direction === "EUR_TRY" ? "TRY" : "EUR";

  toggleBtn.textContent = `${from} → ${to}`;
  colFrom.textContent = from;
  colTo.textContent = to;
}

/* =========================================================
   Datumslogik
========================================================= */

function doesMonthOverlapRange(year, month, from, to) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0);
  return end >= from && start <= to;
}

function getYearsInRange(from, to) {
  const years = [];
  for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
    years.push(y);
  }
  return years;
}

/* =========================================================
   API
========================================================= */

async function fetchYearRates(year, from, to) {
  const key = `${year}_${from}_${to}`;
  if (rateCache[key]) return rateCache[key];

  const res = await fetch(
    `${API_BASE}/${year}-01-01..${year}-12-31?from=${from}&to=${to}`
  );

  const data = await res.json();
  const result = {};

  Object.keys(data.rates).sort().forEach(d => {
    const m = new Date(d).getMonth() + 1;
    result[m] = data.rates[d][to];
  });

  rateCache[key] = result;
  return result;
}

/* =========================================================
   Diagramm
========================================================= */

function renderChart(labels, values, currency) {
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: T.chart(currency),
        data: values,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: { callback: v => formatNumber(v) }
        }
      }
    }
  });
}

/* =========================================================
   Hauptlogik
========================================================= */

async function loadData() {
  tableBody.innerHTML = "";
  setLoading(true);

  const amount   = parseFloat(amountInput.value) || 1;
  const fromDate = new Date(dateFromInput.value);
  const toDate   = new Date(dateToInput.value);

  if (fromDate > toDate) {
    tableBody.innerHTML =
          `<tr><td colspan="3" class="empty">${T.invalidRange}</td></tr>`;

    setLoading(false);
    return;
  }

  const from = direction === "EUR_TRY" ? "EUR" : "TRY";
  const to   = direction === "EUR_TRY" ? "TRY" : "EUR";

  yearTitle.textContent = T.ratesTitle(from, to, formatDateDE(fromDate), formatDateDE(toDate));


  const labels = [];
  const values = [];
  let total = 0;

  try {
    for (const year of getYearsInRange(fromDate, toDate)) {
      const rates = await fetchYearRates(year, from, to);

      for (let m = 1; m <= 12; m++) {
        if (doesMonthOverlapRange(year, m, fromDate, toDate) && rates[m]) {
          const value = rates[m] * amount;
          const label = `${MONTHS[LANG][m - 1]} ${year}`;


          tableBody.innerHTML += `
            <tr>
              <td>${label}</td>
              <td>${formatNumber(amount)} ${from}</td>
              <td>${formatNumber(value)} ${to}</td>
            </tr>
          `;

          labels.push(label);
          values.push(value);
          total += value;
        }
      }
    }

    if (!values.length) {
        tableBody.innerHTML =
          `<tr><td colspan="3" class="empty">${T.nodata}</td></tr>`;

    } else {
      tableBody.innerHTML += `
        <tr>
          <td>${T.sum}</td>
          <td></td>
          <td>${formatNumber(total)} ${to}</td>
        </tr>
      `;
      renderChart(labels, values, to);
    }
  } catch {
      tableBody.innerHTML =
        `<tr><td colspan="3" class="empty">${T.loadError}</td></tr>`;
  }

  setLoading(false);
}

/* =========================================================
   Events
========================================================= */

toggleBtn.onclick = () => {
  direction = direction === "EUR_TRY" ? "TRY_EUR" : "EUR_TRY";
  updateToggleUI();
  loadData();
};

showBtn.onclick = loadData;

darkModeBtn.onclick = () => {
  const dark = document.body.dataset.theme === "dark";
  document.body.dataset.theme = dark ? "" : "dark";
  localStorage.setItem(STORAGE_THEME, dark ? "light" : "dark");
};

presetToday.onclick = () => {
  const d = new Date(); d.setHours(0,0,0,0);
  dateFromInput.valueAsDate = d;
  dateToInput.valueAsDate   = d;
  triggerAutoReload(0);
};

presetMonth.onclick = () => {
  const d = new Date();
  dateFromInput.valueAsDate = new Date(d.getFullYear(), d.getMonth(), 1);
  dateToInput.valueAsDate   = d;
  triggerAutoReload(0);
};

presetYear.onclick = () => {
  const d = new Date();
  dateToInput.valueAsDate = d;
  dateFromInput.valueAsDate =
    new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());
  triggerAutoReload(0);
};

pdfBtn.onclick = () => {
  const fromDate = new Date(dateFromInput.value);
  const toDate   = new Date(dateToInput.value);

  // Datum DD.MM.YYYY
  function formatDateDE(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  }

  // Dateiname MM-YY_MM-YY
  function formatMonthYear(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-2);
    return `${m}-${y}`;
  }

  /* PDF-Dateiname beim Speichern*/
const fileName =
  `${T.pdfTitle(formatMonthYear(fromDate), formatMonthYear(toDate))}.pdf`;

  const doc = new jspdf.jsPDF();

  // ✅ PDF-Überschrift: NUR Datum von – bis
  doc.text(
    `${formatDateDE(fromDate)} – ${formatDateDE(toDate)}`,
    14,
    15
  );

  doc.autoTable({
    startY: 25,
    html: "table",
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [37, 99, 235]
    }
  });

  doc.save(fileName);
};

/* Drucken */ 
const printBtn = document.getElementById("printBtn");

printBtn.onclick = () => {
  window.print();
};

/* ===============================
   I18N – HTML AUTOMATISCH
================================ */

document.querySelectorAll("[data-i18n]").forEach(el => {
  const key = el.dataset.i18n;
  if (T[key]) el.textContent = T[key];
});


/* ===============================
   SPLASH – ZEITGESTEUERT
================================ */
// Splash Timing (ms)
const SPLASH_SHOW_DELAY = 200;   // warten bis anzeigen
const SPLASH_VISIBLE_TIME = 1500; // sichtbar bleiben
const SPLASH_FADE_TIME = 600;    // Fade-Dauer (muss zu CSS passen)

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  if (!splash) return;

  // anzeigen
  setTimeout(() => {
    splash.classList.add("show");

    // sichtbar bleiben
    setTimeout(() => {
      splash.classList.add("fade-out");

      // nach Fade entfernen
      setTimeout(() => {
        splash.remove();
      }, SPLASH_FADE_TIME);

    }, SPLASH_VISIBLE_TIME);

  }, SPLASH_SHOW_DELAY);
});

/* Footer */
/* =========================
   LAST UPDATE
========================= */

const el = document.getElementById("lastUpdate");
if (el) {
  const lastModified = document.lastModified;

  const formatted = new Date(lastModified).toLocaleString(
    LOCALE,
    { dateStyle: "short", timeStyle: "short" }
  );

  el.textContent = T.updated(formatted);
}

/* ===============================
   MANUELLER SPRACH-TOGGLE
================================ */

const langBtn = document.getElementById("langToggle");

if (langBtn) {
  // Initialen Button-Text setzen
  langBtn.textContent = LANG === "tr" ? "DE" : "TR";

  langBtn.addEventListener("click", () => {
    const newLang = LANG === "tr" ? "de" : "tr";
    localStorage.setItem("lang", newLang);

    // Seite neu laden mit neuer Sprache
    location.reload();
  });
}


