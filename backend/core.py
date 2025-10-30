import math, hashlib, requests, string
from zxcvbn import zxcvbn

def calculate_entropy(password):
    charset = 0
    if any(c.islower() for c in password): charset += 26
    if any(c.isupper() for c in password): charset += 26
    if any(c.isdigit() for c in password): charset += 10
    if any(c in string.punctuation for c in password): charset += len(string.punctuation)
    return round(math.log2(charset ** len(password)) if charset else 0, 2)

def check_hibp(p):
    if not p:
        return "Empty password"
    sha1 = hashlib.sha1(p.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    try:
        res = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}", timeout=8)
        for h, count in (line.split(":") for line in res.text.splitlines()):
            if h == suffix:
                return f"Found in {count} breaches!"
        return "Not found"
    except Exception as e:
        print("⚠️ HIBP API error:", e)
        return "Error checking breaches"

def nist_policy_score(password, breached):
    score = 0
    # length and complexity
    if len(password) >= 8: score += 20
    if any(c.isupper() for c in password): score += 10
    if any(c.islower() for c in password): score += 10
    if any(c.isdigit() for c in password): score += 10
    if any(c in string.punctuation for c in password): score += 10

    # check breach status (case-insensitive + error-safe)
    if "not found" in breached.lower() or "error" in breached.lower():
        score += 30

    # penalize common passwords
    common = ["password", "123456", "qwerty", "letmein", "abc123"]
    if not any(w in password.lower() for w in common):
        score += 10

    return min(score, 100)

def analyze_password(password):
    if not password:
        return {"entropy": 0, "score": 0, "hibp": "Empty password", "nist": 0}

    entropy = calculate_entropy(password)

    try:
        zx = zxcvbn(password)
        zx_score = zx.get("score", 0)
    except Exception as e:
        print("⚠️ ZXCVBN error:", e)
        zx_score = 0

    hibp = check_hibp(password)
    nist = nist_policy_score(password, hibp)

    # 🔍 Debug log (optional)
    print(f"DEBUG → pw: {password}, zxcvbn: {zx_score}, nist: {nist}, hibp: {hibp}")

    return {
        "entropy": entropy,
        "score": zx_score,
        "hibp": hibp,
        "nist": nist
    }
