/* ===============================
   THEME – VOR INITIALISIERUNG
================================ */

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.dataset.theme = "dark";
}

const STORAGE_FROM_CURRENCY = "from_currency";
const STORAGE_TO_CURRENCY   = "to_currency";


/* ===============================
   WÄHRUNGEN – ZENTRAL
================================ */

// Alle erlaubten Währungen
const CURRENCIES = ["EUR", "TRY", "USD"];

// Aktuelle Auswahl
let fromCurrency = "EUR";
let toCurrency   = "TRY";


/* ===============================
   DOM – WÄHRUNGEN
================================ */

const fromSelect = document.getElementById("fromSelect");
const toSelect   = document.getElementById("toSelect");

/* ===============================
   DROPDOWNS INITIALISIEREN
================================ */

function initCurrencySelects() {
  fromSelect.innerHTML = "";
  toSelect.innerHTML   = "";

  CURRENCIES.forEach(cur => {
    const optFrom = new Option(cur, cur);
    const optTo   = new Option(cur, cur);

    fromSelect.add(optFrom);
    toSelect.add(optTo);
  });

  // Startwerte
  fromSelect.value = fromCurrency;
  toSelect.value   = toCurrency;
}

/* ===============================
   DROPDOWN EVENTS
================================ */

fromSelect.addEventListener("change", () => {
    fromCurrency = fromSelect.value;
    localStorage.setItem(STORAGE_FROM_CURRENCY, fromCurrency);
    loadData();

    toSelect.addEventListener("change", () => {
    toCurrency = toSelect.value;
    localStorage.setItem(STORAGE_TO_CURRENCY, toCurrency);
    loadData();
  });
  // gleiche Währung verhindern
  if (fromCurrency === toCurrency) {
    toCurrency = CURRENCIES.find(c => c !== fromCurrency);
    toSelect.value = toCurrency;
  }

  updateToggleUI();
  loadData();
});

toSelect.addEventListener("change", () => {
  toCurrency = toSelect.value;

  // gleiche Währung verhindern
  if (toCurrency === fromCurrency) {
    fromCurrency = CURRENCIES.find(c => c !== toCurrency);
    fromSelect.value = fromCurrency;
  }

  updateToggleUI();
  loadData();
});


/* ===============================
   PDF – UNICODE FONT
================================ */
const { jsPDF } = window.jspdf;

let pdfFontReady = false;
let pdfFontData = null;

// Font laden
fetch("assets/fonts/DejaVuSans.ttf")
  .then(res => res.arrayBuffer())
  .then(buf => {
    const binary = Array.from(new Uint8Array(buf))
      .map(b => String.fromCharCode(b))
      .join("");

    pdfFontData = btoa(binary);
    pdfFontReady = true;
  })
  .catch(err => console.error("Font-Ladefehler:", err));


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
    pdfTitle: (a, b) => `${a} – ${b}`,
   /* ===== update info ===== */
    updateAvailable: "Neue Version verfügbar. Jetzt aktualisieren?",

    appUpToDate: "App ist aktuell",
    updateFooter: "Neue Version verfügbar – klicken zum Aktualisieren",

  },

  tr: {
    /* ===== Genel ===== */
    title: "Aylık Döviz Kuru Özeti",
    loading: "Yükleniyor …",
    nodata: "Veri bulunamadı (Geçersiz tarih aralığı)!",
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
    pdfTitle: (a, b) => `${a} – ${b}`,
    /* ===== update info ===== */
    updateAvailable: "Yeni sürüm mevcut. Şimdi güncellensin mi?",

    appUpToDate: "Uygulama güncel",
    updateFooter: "Yeni sürüm mevcut – güncellemek için tıklayın",

  }
};


let T = i18n[LANG];

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

/* ===============================
   SPLASH – NUR BEIM ERSTEN LADEN
================================ */

// Splash nur einmal pro Session anzeigen
const SHOW_SPLASH = !sessionStorage.getItem("splashShown");

// Splash Timing (ms)
const SPLASH_SHOW_DELAY = 200;
const SPLASH_VISIBLE_TIME = 1500;
const SPLASH_FADE_TIME = 600;

if (SHOW_SPLASH) {
  window.addEventListener("load", () => {
    const splash = document.getElementById("splash");
    if (!splash) return;

    // merken: Splash wurde gezeigt
    sessionStorage.setItem("splashShown", "1");

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
} else {
  // Splash sofort entfernen, falls vorhanden
  const splash = document.getElementById("splash");
  splash && splash.remove();
}


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

const showBtn     = document.getElementById("showBtn");
const pdfBtn      = document.getElementById("pdfBtn");
const darkModeBtn = document.getElementById("darkModeBtn");

const presetToday = document.getElementById("presetToday");
const presetMonth = document.getElementById("presetMonth");
const presetYear  = document.getElementById("presetYear");

const colFrom = document.getElementById("colFrom");
const colTo   = document.getElementById("colTo");

const chartCanvas = document.getElementById("chart");

/* ===============================
   SWAP BUTTON
================================ */

const swapBtn = document.getElementById("swapBtn");


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

  /* ===============================
    WÄHRUNG AUS STORAGE
  ================================ */

  fromCurrency =
    localStorage.getItem(STORAGE_FROM_CURRENCY) || fromCurrency;

  toCurrency =
    localStorage.getItem(STORAGE_TO_CURRENCY) || toCurrency;


  if (localStorage.getItem(STORAGE_THEME) === "dark") {
    document.body.dataset.theme = "dark";
  }

  initCurrencySelects();   // Dropdowns füllen
  updateToggleUI();        // Spalten aktualisieren
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

/* ===============================
   DATE TO – ABSICHERN
================================ */

dateToInput.addEventListener("change", () => {
  const selectedDate = new Date(dateToInput.value);

  // Zukunft verhindern
  const safeDate = clampToToday(selectedDate);

  // Input-Feld korrigieren
  dateToInput.valueAsDate = safeDate;

  // Persistenz
  localStorage.setItem(
    STORAGE_TO,
    safeDate.toISOString().slice(0, 10)
  );

  // Neu laden (debounced)
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

/* ===============================
  TOGGLE UI AKTUALISIEREN
================================ */

function updateToggleUI() {
  colFrom.textContent = fromCurrency;
  colTo.textContent   = toCurrency;
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

/* ===============================
   API – DYNAMISCH
================================ */

async function fetchYearRates(year, from, to) {
  const key = `${year}_${from}_${to}`;
  if (rateCache[key]) return rateCache[key];

  const res = await fetch(
    `${API_BASE}/${year}-01-01..${year}-12-31?from=${from}&to=${to}`
  );

  const data = await res.json();
  const result = {};

  Object.keys(data.rates).forEach(d => {
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

/* ===============================
   HAUPTLOGIK
================================ */

async function loadData() {
  tableBody.innerHTML = "";
  setLoading(true);

  const amount   = parseFloat(amountInput.value) || 1;
    let fromDate = new Date(dateFromInput.value);
    let toDate   = new Date(dateToInput.value);

    // Zukunft verhindern
    toDate = clampToToday(toDate);

    // Input-Feld ebenfalls korrigieren
    dateToInput.valueAsDate = toDate;


  if (fromDate > toDate) {
    showError("invalid");
    setLoading(false);
    return;
  }

  // Titel
  yearTitle.textContent = T.ratesTitle(
    fromCurrency,
    toCurrency,
    formatDateDE(fromDate),
    formatDateDE(toDate)
  );

  const labels = [];
  const values = [];
  let total = 0;

  try {
    for (const year of getYearsInRange(fromDate, toDate)) {
      const rates = await fetchYearRates(year, fromCurrency, toCurrency);

      for (let m = 1; m <= 12; m++) {
        if (doesMonthOverlapRange(year, m, fromDate, toDate) && rates[m]) {
          const value = rates[m] * amount;
          const label = `${MONTHS[LANG][m - 1]} ${year}`;

          tableBody.innerHTML += `
            <tr>
              <td>${label}</td>
              <td>${formatNumber(amount)} ${fromCurrency}</td>
              <td>${formatNumber(value)} ${toCurrency}</td>
            </tr>
          `;

          labels.push(label);
          values.push(value);
          total += value;
        }
      }
    }

    if (!values.length) {
      showError("nodata");
    } else {
      tableBody.innerHTML += `
        <tr>
          <td>${T.sum}</td>
          <td></td>
          <td>${formatNumber(total)} ${toCurrency}</td>
        </tr>
      `;
      renderChart(labels, values, toCurrency);
    }
  } catch {
    showError("error");
  }

  setLoading(false);
}


/* =========================================================
   Events
========================================================= */

/* ===============================
   WÄHRUNGEN TAUSCHEN
================================ */

swapBtn.addEventListener("click", () => {
  // Werte tauschen
  [fromCurrency, toCurrency] = [toCurrency, fromCurrency];

  // Dropdowns synchronisieren
  fromSelect.value = fromCurrency;
  toSelect.value   = toCurrency;

  // UI & Daten neu laden
  updateToggleUI();
  loadData();
});

/* ===============================
   WÄHRUNGS-TOGGLE
================================ */

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
  // 🔒 Sicherheitschecks
  if (!pdfFontReady || !pdfFontData) {
    alert("PDF-Font noch nicht geladen");
    return;
  }

  const fromDate = new Date(dateFromInput.value);
  const toDate   = new Date(dateToInput.value);

  if (isNaN(fromDate) || isNaN(toDate)) {
    alert(T.invalidRange);
    return;
  }

  // =========================
  // Datum DD.MM.YYYY (lokal)
  // =========================
  function formatDate(date) {
    return date.toLocaleDateString(LOCALE, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  // =========================
  // Dateiname MM-YY_MM-YY
  // =========================
  function formatMonthYear(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-2);
    return `${m}-${y}`;
  }

  // =========================
  // PDF-Dateiname
  // =========================
  const fileName =
    `${formatMonthYear(fromDate)}_${formatMonthYear(toDate)}.pdf`;

  // =========================
  // PDF erzeugen
  // =========================
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // ✅ FONT HIER registrieren (UMD-KORREKT)
  doc.addFileToVFS("DejaVuSans.ttf", pdfFontData);
  doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
  doc.setFont("DejaVu", "normal");

  // =========================
  // Titel (NUR Datum von – bis)
  // =========================
  doc.setFontSize(14);
  doc.text(
    `${formatDate(fromDate)} – ${formatDate(toDate)}`,
    14,
    18
  );

  // =========================
  // Tabelle
  // =========================
  doc.autoTable({
    startY: 28,
    html: "table",
    styles: {
      font: "DejaVu",
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [37, 99, 235]
    },
    theme: "grid"
  });

  // =========================
  // Speichern
  // =========================
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
   DATUM AUF HEUTE BEGRENZEN
================================ */

function clampToToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today ? today : date;
}


/* =========================
   LAST UPDATE (FIXED FORMAT)
========================= */

window.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("lastUpdate");
  if (!el || !T) return;

  const lastModified = new Date(document.lastModified);

  const dd = String(lastModified.getDate()).padStart(2, "0");
  const mm = String(lastModified.getMonth() + 1).padStart(2, "0");
  const yyyy = lastModified.getFullYear();

  const hh = String(lastModified.getHours()).padStart(2, "0");
  const min = String(lastModified.getMinutes()).padStart(2, "0");

  const formatted = `${dd}.${mm}.${yyyy} ${hh}:${min}`;

  el.textContent = T.updated(formatted);
});



/* ===============================
   SERVICE WORKER – UPDATE STATUS
================================ */

const updateEl = document.getElementById("updateStatus");

if (updateEl) {
  // Standard: aktuell
  updateEl.textContent = T.appUpToDate;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data === "update" && updateEl) {
      updateEl.textContent = T.updateFooter;
      updateEl.classList.add("update-available");

      updateEl.onclick = () => {
        window.location.reload();
      };
    }
  });
}


/* ===============================
   SPRACH-TOGGLE – OHNE RELOAD
================================ */

const langBtn = document.getElementById("langToggle");

if (langBtn) {

  // Button-Text initial
  langBtn.textContent = LANG === "tr"
    ? "Sprache -DE- wählen"
    : "Dil -TR- Seç";

  langBtn.addEventListener("click", () => {

    // Sprache umschalten
    LANG = LANG === "tr" ? "de" : "tr";
    localStorage.setItem("lang", LANG);

    // i18n neu setzen
    T = i18n[LANG];

    // Button-Text aktualisieren
    langBtn.textContent = LANG === "tr"
      ? "Sprache -DE- wählen"
      : "Dil -TR- Seç";

    // Texte live aktualisieren
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (T[key]) el.textContent = T[key];
    });

    // Titel neu setzen
    yearTitle.textContent = T.ratesTitle(
      fromCurrency,
      toCurrency,
      formatDateDE(new Date(dateFromInput.value)),
      formatDateDE(new Date(dateToInput.value))
    );

    // Chart-Beschriftung aktualisieren
    if (chartInstance) {
      chartInstance.data.datasets[0].label = T.chart(toCurrency);
      chartInstance.update();
    }
  });
}


