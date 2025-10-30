// PassGuardian Popup Script (Stable Release)
document.addEventListener("DOMContentLoaded", () => {
  // 🌎 ELEMENT REFERENCES
  const tabs = document.querySelectorAll("nav button");
  const sections = document.querySelectorAll("section");
  const pwInput = document.getElementById("userPassword");
  const bar = document.getElementById("bar");
  const risk = document.getElementById("risk");
  const tip = document.getElementById("tip");
  const genBtn = document.getElementById("genBtn");
  const genOut = document.getElementById("genOut");
  const len = document.getElementById("len");
  const upper = document.getElementById("upper");
  const num = document.getElementById("num");
  const sym = document.getElementById("sym");
  const historyList = document.getElementById("historyList");
  const avgStrength = document.getElementById("avgStrength");
  const breachRate = document.getElementById("breachRate");
  const autoAnalyze = document.getElementById("autoAnalyze");
  const show2fa = document.getElementById("show2fa");
  const langSel = document.getElementById("lang");

  // 🌓 THEME TOGGLE (Persistent + Auto-Rebind)
  function initThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");
    if (!themeToggle) return;

    // Load saved theme or default to dark
    chrome.storage.sync.get(["theme"], ({ theme }) => {
      const currentTheme = theme || "dark";
      document.body.dataset.theme = currentTheme;
      themeToggle.textContent = currentTheme === "dark" ? "🌙" : "☀️";
    });

    // Switch theme on click
    themeToggle.addEventListener("click", () => {
      const newTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = newTheme;
      themeToggle.textContent = newTheme === "dark" ? "🌙" : "☀️";
      chrome.storage.sync.set({ theme: newTheme });
    });
  }

  // Rebind theme toggle if header is rebuilt (after translation)
  function rebindThemeToggle() {
    setTimeout(() => {
      const themeToggle = document.getElementById("themeToggle");
      if (!themeToggle) return;
      themeToggle.onclick = () => {
        const newTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
        document.body.dataset.theme = newTheme;
        themeToggle.textContent = newTheme === "dark" ? "🌙" : "☀️";
        chrome.storage.sync.set({ theme: newTheme });
      };
    }, 200);
  }

  initThemeToggle();

  // 🌐 LANGUAGE SWITCHING
  chrome.storage.sync.get(["lang"], ({ lang }) => {
    const userLang = lang || navigator.language.slice(0, 2) || "en";
    langSel.value = userLang;
    if (typeof applyTranslations === "function") {
      applyTranslations(userLang);
    }
  });

  langSel.addEventListener("change", () => {
    const lang = langSel.value;
    chrome.storage.sync.set({ lang });
    if (typeof applyTranslations === "function") {
      applyTranslations(lang);
      if (typeof rebindThemeToggle === "function") rebindThemeToggle();
    }
  });

  // 🧭 TAB SWITCHING
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));
      document.getElementById(btn.dataset.tab).classList.add("active");
      btn.classList.add("active");
    });
  });

  // 🔍 PASSWORD ANALYZER
  async function analyze(pw) {
    if (!pw) {
      bar.style.width = "0%";
      risk.textContent = "Waiting...";
      tip.textContent = "Type a password to start.";
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });

      const data = await res.json();
      const s = Math.min(data.score + 1, 5);
      const colors = ["#ef4444", "#f97316", "#facc15", "#4ade80", "#22c55e"];
      bar.style.transition = "width 0.4s ease, background 0.3s ease";
      bar.style.width = `${(s / 5) * 100}%`;
      bar.style.background = colors[s - 1];
      risk.style.transition = "color 0.3s ease";

      const breached = data.hibp && data.hibp.includes("Found");
      if (breached) {
        risk.textContent = "🚨 Found in breach!";
        risk.style.color = "#ef4444";
      } else if (s <= 2) {
        risk.textContent = "⚠️ Weak password";
        risk.style.color = "#f97316";
      } else {
        risk.textContent = "✅ Secure password";
        risk.style.color = "#22c55e";
      }

      tip.textContent =
        s <= 2
          ? "Add more variety and length."
          : s === 3
          ? "Good, add one symbol for perfection."
          : "Excellent!";
      if (show2fa.checked && s >= 4) tip.textContent += " 💡 Enable 2FA!";
      saveHistory(pw, s, breached);
      refreshStats();
    } catch (err) {
      console.warn("Offline mode:", err);
      const localScore = Math.min(Math.ceil(pw.length / 4), 5);
      bar.style.width = `${localScore * 20}%`;
      bar.style.background = "#64748b";
      risk.textContent = "Offline mode active";
      risk.style.color = "#94a3b8";
      tip.textContent = "Local analysis only.";
    }
  }

  pwInput.addEventListener("input", () => analyze(pwInput.value));

  // 🔑 PASSWORD GENERATOR
  genBtn.addEventListener("click", () => {
    const length = Math.min(Math.max(parseInt(len.value) || 12, 8), 32);
    let chars = "abcdefghijklmnopqrstuvwxyz";
    if (upper.checked) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (num.checked) chars += "0123456789";
    if (sym.checked) chars += "!@#$%^&*()_+[]{}<>?";

    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    const pw = Array.from(arr, (n) => chars[n % chars.length]).join("");
    genOut.textContent = pw;

    navigator.clipboard.writeText(pw);
    tip.textContent = "✅ Copied! Will clear in 20s.";
    genOut.style.border = "1px solid #22c55e";
    genOut.style.transition = "border 0.3s ease";
    navigator.vibrate?.(30);

    setTimeout(() => {
      navigator.clipboard.writeText("");
      genOut.style.border = "1px solid transparent";
    }, 20000);
  });

  // 🧾 HISTORY MANAGEMENT
  function saveHistory(pw, score, breached) {
    chrome.storage.local.get({ logs: [] }, (res) => {
      const logs = res.logs || [];
      logs.push({
        time: new Date().toLocaleTimeString(),
        pw: "*".repeat(Math.min(6, pw.length)),
        score,
        breached,
      });
      const trimmed = logs.slice(-10);
      chrome.storage.local.set({ logs: trimmed });
      renderHistory(trimmed);
    });
  }

  function renderHistory(logs) {
    if (!logs || !logs.length) {
      historyList.textContent = "No history yet.";
      return;
    }
    historyList.innerHTML = logs
      .map(
        (l) => `
      <div class="history-item">
        <strong>${l.time}</strong><br>
        Score: ${l.score}/5 | ${l.breached ? "⚠️ Breached" : "✅ Safe"}
      </div>
    `
      )
      .join("");
  }

  chrome.storage.local.get({ logs: [] }, (res) => renderHistory(res.logs));

  // 📊 DASHBOARD STATS
  function refreshStats() {
    chrome.storage.local.get({ logs: [] }, ({ logs }) => {
      if (!logs.length) {
        avgStrength.textContent = "—";
        breachRate.textContent = "—";
        return;
      }
      const avg = (
        logs.reduce((a, b) => a + b.score, 0) / logs.length
      ).toFixed(1);
      const breaches = logs.filter((l) => l.breached).length;
      avgStrength.textContent = `${avg}/5`;
      breachRate.textContent = `${(
        (breaches / logs.length) *
        100
      ).toFixed(0)}%`;
    });
  }
  refreshStats();

  // 🔊 TEXT-TO-SPEECH FEEDBACK
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(text);
    const lang =
      langSel.value === "zh"
        ? "zh-CN"
        : langSel.value === "ms"
        ? "ms-MY"
        : "en-US";
    msg.lang = lang;
    msg.rate = 1.05;
    window.speechSynthesis.speak(msg);
  }

  // Speak important events when leaving input
  pwInput.addEventListener("blur", () => {
    const msg = risk.textContent.includes("🚨")
      ? "Warning! Password found in breach."
      : risk.textContent.includes("⚠️")
      ? "Your password is weak, consider strengthening it."
      : "Your password is secure.";
    speak(msg);
  });
});
