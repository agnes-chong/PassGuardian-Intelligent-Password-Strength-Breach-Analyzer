document.addEventListener("input", async (e) => {
  if (e.target.type === "password") {
    const pw = e.target.value.trim();

    // Remove tooltip if field cleared
    if (pw.length < 1) {
      const existingTip = document.querySelector("#pg-tip");
      if (existingTip) existingTip.remove();
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw })
      });
      const data = await res.json();

      let tip = document.querySelector("#pg-tip");
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "pg-tip";
        document.body.appendChild(tip);
      }

      // Strength descriptions
      const desc = [
        "❌ Very Weak – change immediately!",
        "⚠️ Weak – add more variety.",
        "🟡 Fair – improve length or symbols.",
        "🟢 Strong – good protection.",
        "✅ Very Strong – excellent!"
      ];
      const colors = ["#ff4b4b", "#ff914b", "#ffd84b", "#6eeeb3", "#00ffb2"];
      const s = Math.min(data.score, 4);
      let text = desc[s];
      let color = colors[s];
      let breachAlert = false;

      // 🧠 Smarter breach logic
      if (data.hibp.includes("Found")) {
        if (data.score >= 3 || data.entropy > 60) {
          text = "🟠 Strong but found in data breach — change it anyway!";
          color = "#ffb84d"; // orange
          breachAlert = true;
        } else {
          text = "❌ Very Weak – change immediately!";
          color = "#ff4b4b"; // red
        }
      }

      let breachMsg = "";
      if (data.hibp.includes("Found")) {
        breachMsg = `<div style="margin-top:5px;color:#ff4b4b;">⚠️ This password was found in a data breach!</div>`;
      }

      const barWidth = ((s + 1) / 5) * 100;
      const barHTML = `
        <div style="margin-top:8px;width:100%;height:6px;background:#222;border-radius:3px;overflow:hidden;">
          <div id="pg-bar" style="width:${barWidth}%;height:100%;background:${color};
          transition:width .5s ease,background .5s ease;"></div>
        </div>
      `;

      // 🔘 Button logic (Smart)
      const isWeak = data.score < 3;
      let btnText = "";
      let generateBtn = "";

      if (isWeak) {
        btnText = "💪 Suggest a stronger password";
      } else if (breachAlert) {
        btnText = "🔁 Change your password now";
      }

      if (isWeak || breachAlert) {
        generateBtn = `
          <button id="pg-generate" style="
            margin-top:10px;background:${breachAlert ? '#ffb84d' : '#00ffb2'};
            color:#000;font-size:12px;padding:5px 10px;border:none;
            border-radius:6px;cursor:pointer;font-weight:600;
            transition:all 0.3s ease;opacity:0;transform:translateY(5px);
          ">
            ${btnText}
          </button>
        `;
      }

      const tipline = `<div id="pg-tipline" style="margin-top:6px;font-size:11px;color:#ccc;"></div>`;

      // Tooltip HTML
      tip.innerHTML = `
        <b style="color:${color}">${text}</b>
        ${breachMsg}
        ${barHTML}
        ${generateBtn}
        ${tipline}
      `;

      // 🧭 Auto-position tooltip (prevents overlap)
      const rect = e.target.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const appearAbove = spaceBelow < 180;
      const topPos = appearAbove ? rect.top - 180 : rect.bottom + 10;

      tip.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${topPos}px;
        background: #0b0f19;
        color: white;
        font-size: 13px;
        padding: 12px 14px;
        border-radius: 10px;
        font-family: 'Segoe UI', sans-serif;
        box-shadow: 0 0 15px ${color};
        z-index: 999999;
        width: 280px;
        animation: fadeIn .3s ease;
        transition: all 0.3s ease;
      `;

      // 🧷 Arrow pointer
      tip.style.setProperty("--arrow-color", color);
      tip.insertAdjacentHTML("beforeend", `
        <div style="
          position:absolute;
          left:20px;
          ${appearAbove ? "bottom:-10px;" : "top:-10px;"}
          width:0;
          height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-${appearAbove ? "top" : "bottom"}:8px solid ${color};
        "></div>
      `);

      // 🔄 Animate button
      const btn = tip.querySelector("#pg-generate");
      if (btn) setTimeout(() => {
        btn.style.opacity = "1";
        btn.style.transform = "translateY(0)";
      }, 200);

      // 💾 Save masked logs
      const log = {
        password: pw.replace(/./g, "*"),
        score: data.score,
        hibp: data.hibp
      };
      chrome.storage.local.get({ logs: [] }, (res) => {
        const logs = res.logs.slice(-4);
        logs.push(log);
        chrome.storage.local.set({ logs });
      });

      // 💡 Rotate helpful tips
      const tips = [
        "✅ Use at least 12 characters.",
        "🔒 Enable Two-Factor Authentication.",
        "🧩 Don’t reuse passwords across websites.",
        "🎯 Mix uppercase, lowercase, numbers, and symbols.",
        "🚫 Avoid using personal info or dates."
      ];
      const tipElem = tip.querySelector("#pg-tipline");
      let idx = 0;
      setInterval(() => {
        if (tipElem) tipElem.textContent = tips[idx++ % tips.length];
      }, 4000);

    } catch (err) {
      console.log("Error:", err);
    }
  }
});

// 🎁 Handle Generate/Change Password button
document.body.addEventListener("click", async (e) => {
  if (e.target.id === "pg-generate") {
    try {
      const res = await fetch("http://127.0.0.1:5000/generate");
      const data = await res.json();
      await navigator.clipboard.writeText(data.password);

      if (e.target.textContent.includes("Change")) {
        alert("🔁 Reminder: Even strong passwords must be changed if they’ve been leaked!\n\nStrong new password copied:\n" + data.password);
      } else {
        alert(`✅ Strong password copied!\n${data.password}`);
      }
    } catch (err) {
      console.log("Error generating password:", err);
    }
  }
});
