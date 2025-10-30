"""
========================================================
🌈 PassGuardian – Intelligent Password Security Suite
--------------------------------------------------------
Author : Agnes Chong
Date   : 2025
========================================================
"""

import os, hashlib, requests, math, string, random, sqlite3, smtplib
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt
from zxcvbn import zxcvbn
from email.message import EmailMessage

# =====================================================
# 1️⃣ SQLite Setup (Multi-User Logging)
# =====================================================
def init_db():
    conn = sqlite3.connect("passguardian.db")
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    password_tested TEXT,
                    entropy REAL,
                    score INTEGER,
                    breached TEXT,
                    crack_time TEXT,
                    nist_score INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )""")
    conn.commit(); conn.close()

def log_to_db(username, password, entropy, score, breached, crack_time, nist_score):
    conn = sqlite3.connect("passguardian.db")
    c = conn.cursor()
    c.execute("""INSERT INTO logs
                 (username, password_tested, entropy, score, breached, crack_time, nist_score)
                 VALUES (?,?,?,?,?,?,?)""",
              (username, password, entropy, score, breached, crack_time, nist_score))
    conn.commit(); conn.close()

init_db()

# =====================================================
# 2️⃣ Core Security Functions
# =====================================================
def calculate_entropy(p):
    charset = 0
    if any(c.islower() for c in p): charset += 26
    if any(c.isupper() for c in p): charset += 26
    if any(c.isdigit() for c in p): charset += 10
    if any(c in string.punctuation for c in p): charset += len(string.punctuation)
    return round(math.log2(charset ** len(p)) if charset else 0, 2)

def strength_score(p):
    r = zxcvbn(p)
    return r["score"], r["feedback"]["suggestions"], r["guesses_log10"]

def check_hibp(p):
    sha1 = hashlib.sha1(p.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    try:
        res = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}", timeout=8)
        for h, count in (line.split(":") for line in res.text.splitlines()):
            if h == suffix:
                return f"⚠️ Found in {count} breaches!"
        return "✅ Not found in breaches."
    except:
        return "⚠️ Offline mode (cannot check now)."

def estimate_crack_time(entropy_bits):
    seconds = 2 ** entropy_bits / 1e9
    years = seconds / (60 * 60 * 24 * 365)
    if years < 1:  return f"{round(years*12,2)} months"
    if years < 100: return f"{round(years,2)} years"
    return f"{round(years/1000,2)} millennia"

def generate_password(length=14):
    chars = string.ascii_letters + string.digits + string.punctuation
    return "".join(random.choice(chars) for _ in range(length))

# =====================================================
# 3️⃣ NIST Policy Score
# =====================================================
def nist_policy_score(password, breached):
    score = 0
    if len(password) >= 8: score += 20
    if any(c.isupper() for c in password): score += 10
    if any(c.islower() for c in password): score += 10
    if any(c.isdigit() for c in password): score += 10
    if any(c in string.punctuation for c in password): score += 10
    if "not found" in breached.lower(): score += 30
    common = ["password","123456","qwerty","letmein"]
    if not any(w in password.lower() for w in common): score += 10
    return min(score,100)

# =====================================================
# 4️⃣ AI Policy Advisor (Rule + Optional OpenAI)
# =====================================================
def ai_policy_advisor(password):
    base = []
    if len(password)<10: base.append("Increase password length (min 10–12 chars).")
    if not any(c.isupper() for c in password): base.append("Add uppercase letters.")
    if not any(c.isdigit() for c in password): base.append("Include numbers.")
    if not any(c in string.punctuation for c in password): base.append("Add special symbols (!@#$%).")
    if password.lower() in ["password","123456","qwerty"]: base.append("Avoid common breached passwords.")

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role":"system","content":"You are a cybersecurity policy expert."},
                    {"role":"user","content":f"Advise improvements for '{password}' per NIST 800-63B."}
                ],
                max_tokens=120
            )
            base.append("🤖 AI Insight: " + resp.choices[0].message.content.strip())
        except Exception as e:
            base.append(f"(AI unavailable – {e})")
    else:
        base.append("💡 Set OPENAI_API_KEY to enable AI insights.")
    if not base:
        base.append("✅ This password meets best practices.")
    return base

# =====================================================
# 5️⃣ Email Breach Alert
# =====================================================
def send_breach_alert(user_email, password_tested, breaches):
    msg = EmailMessage()
    msg["Subject"] = "⚠️ PassGuardian Breach Alert"
    msg["From"] = os.getenv("EMAIL_USER")
    msg["To"] = user_email
    msg.set_content(
        f"Hello,\n\nYour password '{password_tested}' appeared in {breaches}.\n"
        "Change it immediately.\n\n– PassGuardian Security System"
    )
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com",465) as smtp:
            smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            smtp.send_message(msg)
        return True
    except Exception as e:
        print("Email error:",e); return False

# =====================================================
# 6️⃣ Streamlit UI
# =====================================================
st.set_page_config(page_title="PassGuardian v4.0", page_icon="🔐", layout="wide")
st.markdown("<h1 style='text-align:center;color:#00FFB2;'>🔐 PassGuardian v4.0</h1>", unsafe_allow_html=True)
st.caption("AI-Enhanced Password Auditing & Policy Advisor (2025 Edition)")
st.markdown("---")

username = st.text_input("👤 Enter username to start:")
if not username: st.stop()

tabs = st.tabs(["🔎 Analyze","⚙️ Generate","📂 Batch Audit","🤖 Policy Advisor","📜 Logs"])

# --- Analyze ---
with tabs[0]:
    pw = st.text_input("Enter password to analyze:", type="password")
    if st.button("Analyze Password"):
        if not pw.strip(): st.warning("Enter a password first.")
        else:
            ent = calculate_entropy(pw)
            score, fb, _ = strength_score(pw)
            hibp = check_hibp(pw)
            crack = estimate_crack_time(ent)
            nist = nist_policy_score(pw, hibp)
            log_to_db(username,pw,ent,score,hibp,crack,nist)

            st.metric("Entropy", f"{ent} bits")
            st.metric("Strength Score", f"{score}/4")
            st.metric("Crack Time Estimate", crack)
            st.metric("NIST Compliance", f"{nist}/100")
            st.write(f"**Breach Check:** {hibp}")

            if "Found" in hibp:
                user_email = st.text_input("Email for breach alert (optional):")
                if user_email and st.button("Send Alert"):
                    ok = send_breach_alert(user_email,pw,hibp)
                    st.success("📧 Alert sent!") if ok else st.error("Send failed.")

            if fb: st.info("💬 " + " ".join(fb))
            else: st.success("✅ Strong and unique password.")

            colors=["#FF4B4B","#FF914B","#FFD84B","#6EEB83","#00FFB2"]
            labels=["Very Weak","Weak","Fair","Strong","Very Strong"]
            fig,ax=plt.subplots(figsize=(5,1))
            ax.barh([""],[score+1],color=colors[score])
            ax.set_xlim(0,5); ax.set_title(f"Level: {labels[score]}")
            st.pyplot(fig)

# --- Generate ---
with tabs[1]:
    st.subheader("🔑 Generate Password")
    length=st.slider("Length",8,32,14)
    if st.button("Generate New"):
        st.success(f"`{generate_password(length)}`")

# --- Batch Audit ---
with tabs[2]:
    up=st.file_uploader("Upload CSV with 'password' column:",type="csv")
    if up:
        df=pd.read_csv(up)
        results=[]
        for p in df["password"]:
            ent=calculate_entropy(p)
            score,_,_=strength_score(p)
            hibp=check_hibp(p)
            crack=estimate_crack_time(ent)
            nist=nist_policy_score(p,hibp)
            results.append({"password":p,"entropy":ent,"score":score,
                            "breached":hibp,"crack_time":crack,"NIST":nist})
        out=pd.DataFrame(results)
        st.dataframe(out)
        st.download_button("⬇️ Download Report",
                           out.to_csv(index=False).encode("utf-8"),
                           "PassGuardian_Report.csv","text/csv")

# --- AI Advisor ---
with tabs[3]:
    p=st.text_input("Password for policy advice:",type="password")
    if st.button("Get Advice"):
        for s in ai_policy_advisor(p): st.write("•",s)

# --- Logs ---
with tabs[4]:
    conn=sqlite3.connect("passguardian.db")
    df=pd.read_sql_query(f"SELECT password_tested,entropy,score,breached,crack_time,nist_score,timestamp FROM logs WHERE username='{username}'",conn)
    conn.close()
    st.dataframe(df if not df.empty else pd.DataFrame(columns=["No logs found yet."]))

st.markdown("---")
st.caption("Built with ❤️ in Streamlit | 2025 Cybersecurity Project")
