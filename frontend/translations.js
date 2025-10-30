// PassGuardian — Full Translation Layer
const pgTranslations = {
  en: {
    title: "PassGuardian",
    analyze: "🔍 Analyze",
    history: "🧾 History",
    settings: "⚙️ Settings",
    stats: "📊 Dashboard",
    testpw: "Test a password",
    genpw: "Generate strong password",
    uppercase: "Uppercase",
    numbers: "Numbers",
    symbols: "Symbols",
    waiting: "Waiting...",
    type: "Enter your password...",
    noHistory: "No history yet.",
    avgStrength: "Avg. Strength",
    breachRate: "Breach Rate",
    footer: "© 2025 PassGuardian — Protect Smarter"
  },
  ms: {
    title: "PassGuardian",
    analyze: "🔍 Analisis",
    history: "🧾 Sejarah",
    settings: "⚙️ Tetapan",
    stats: "📊 Papan Pemuka",
    testpw: "Uji kata laluan",
    genpw: "Jana kata laluan kukuh",
    uppercase: "Huruf Besar",
    numbers: "Nombor",
    symbols: "Simbol",
    waiting: "Menunggu...",
    type: "Masukkan kata laluan anda...",
    noHistory: "Tiada sejarah lagi.",
    avgStrength: "Purata Kekuatan",
    breachRate: "Kadar Kebocoran",
    footer: "© 2025 PassGuardian — Lindungi Dengan Bijak"
  },
  zh: {
    title: "PassGuardian",
    analyze: "🔍 分析",
    history: "🧾 历史记录",
    settings: "⚙️ 设置",
    stats: "📊 仪表板",
    testpw: "测试密码",
    genpw: "生成强密码",
    uppercase: "大写字母",
    numbers: "数字",
    symbols: "符号",
    waiting: "等待中...",
    type: "输入您的密码...",
    noHistory: "暂无记录。",
    avgStrength: "平均强度",
    breachRate: "泄露率",
    footer: "© 2025 PassGuardian — 智能守护您的安全"
  }
};

// 🔄 Translation function
function applyTranslations(lang) {
  const t = pgTranslations[lang] || pgTranslations.en;

  document.querySelector("header").innerHTML =
    `🔒 ${t.title} <button id="themeToggle" class="toggle-theme">${
      document.body.dataset.theme === "dark" ? "🌙" : "☀️"
    }</button>`;

  const navBtns = document.querySelectorAll("nav button");
  if (navBtns.length >= 4) {
    navBtns[0].textContent = t.analyze;
    navBtns[1].textContent = t.history;
    navBtns[2].textContent = t.settings;
    navBtns[3].textContent = t.stats;
  }

  document.querySelector("#analyze h4:first-child").textContent = t.testpw;
  document.querySelector("#analyze h4:nth-of-type(2)").textContent = t.genpw;

  document.getElementById("userPassword").placeholder = t.type;
  document.getElementById("risk").textContent = t.waiting;

  const labels = document.querySelectorAll("#analyze label");
  if (labels[0]) labels[0].innerHTML = `<input id="upper" type="checkbox" checked /> ${t.uppercase}`;
  if (labels[1]) labels[1].innerHTML = `<input id="num" type="checkbox" checked /> ${t.numbers}`;
  if (labels[2]) labels[2].innerHTML = `<input id="sym" type="checkbox" checked /> ${t.symbols}`;

  document.querySelector("footer").textContent = t.footer;
  document.querySelector("#stats .metric:nth-of-type(1) strong").textContent = `${t.avgStrength}:`;
  document.querySelector("#stats .metric:nth-of-type(2) strong").textContent = `${t.breachRate}:`;
}
