# 🔐 PassGuardian: Intelligent Password Security & Breach Analyzer  
**Developer:** Agnes Chong  
**Version:** 2025 Edition
**Tech Stack:** Python · Streamlit · Chrome Extension · SQLite · AI Policy Advisor  

---

## 🌈 Overview  
**PassGuardian** is an intelligent password auditing suite that helps users evaluate, enhance, and generate secure passwords through real-time entropy analysis, heuristic scoring, and breach detection powered by the **Have I Been Pwned (HIBP)** API.  

The system includes:
- 🧠 **AI-driven Policy Advisor** for NIST 800-63B compliance guidance  
- 💾 **Multi-user logging database (SQLite)** for audit tracking  
- 🧩 **Chrome Extension** for real-time password analysis on any webpage  
- 📊 **Streamlit Dashboard** for visual analytics, password strength visualization, and security reports  

---

## ⚙️ Core Features

### 🧮 1. Real-Time Password Analysis
- Calculates **entropy** (information-theory measure of unpredictability)  
- Uses **zxcvbn** for advanced heuristic scoring  
- Detects **breached passwords** via **HIBP API** using K-Anonymity (SHA-1 hashing)  
- Estimates **crack time** using entropy-based time models  

### 🤖 2. AI Policy Advisor (NIST 800-63B)
- Provides smart suggestions for improving weak passwords  
- Uses rule-based analysis + optional **OpenAI GPT integration**  
- Ensures compliance with modern password security standards  

### 📧 3. Breach Alert System
- Sends email alerts when passwords appear in known breaches  
- Uses Gmail SMTP with secure SSL authentication  

### 💾 4. Logging & Reporting
- Stores password analysis results in a **SQLite database**  
- Includes **timestamped logs per user**  
- Exports reports in **CSV format** for auditing  

### 🔑 5. Password Generator
- Generates **cryptographically strong passwords**  
- Fully customizable length and character types  

### 🧩 6. Chrome Extension Integration
- Instant feedback on password fields across websites  
- Offline-friendly analysis with optional HIBP connectivity  
- Clean, responsive UI with **live translation and theme toggle**  

---

## 🧠 Algorithms & Techniques

| Feature | Algorithm / Concept |
|----------|--------------------|
| Entropy | Shannon Information Theory |
| Strength Scoring | zxcvbn Heuristic Model |
| Breach Detection | K-Anonymity + SHA-1 Partial Hash |
| Crack Time Estimation | Entropy-based brute-force modeling |
| Password Generation | Secure Random Sampling |
| AI Policy | NIST 800-63B Guidelines + GPT (optional) |

---

## 🧰 Tech Stack

| Layer | Tools / Libraries |
|-------|--------------------|
| **Frontend (Extension)** | HTML, CSS, JavaScript |
| **Backend (Analyzer)** | Python, Streamlit |
| **Database** | SQLite3 |
| **API** | Have I Been Pwned (HIBP), OpenAI (optional) |
| **Libraries** | zxcvbn, hashlib, requests, pandas, matplotlib |

---

## 🚀 How to Run

### 🧩 Chrome Extension
1. Open `chrome://extensions`
2. Enable **Developer Mode** (top-right)
3. Click **Load Unpacked**
4. Select the `passguardian-extension` folder
5. The PassGuardian icon 🔐 will appear in your toolbar

### 🧠 Streamlit Analyzer
```bash
pip install -r requirements.txt
streamlit run passguardian.py
