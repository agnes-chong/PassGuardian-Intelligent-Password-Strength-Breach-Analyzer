from flask import Flask, request, jsonify
from core import analyze_password
from flask_cors import CORS
import string, random

app = Flask(__name__)
CORS(app)  # allow requests from the extension

# =====================================================
# 1️⃣ Analyze Password Endpoint
# =====================================================
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    password = data.get("password", "").strip()

    if not password:
        return jsonify({
            "entropy": 0,
            "score": 0,
            "hibp": "Not checked (empty input)",
            "nist": 0
        })

    result = analyze_password(password)
    return jsonify(result)

# =====================================================
# 2️⃣ Generate Strong Password
# =====================================================
@app.route("/generate", methods=["GET"])
def generate_password():
    chars = string.ascii_letters + string.digits + string.punctuation
    password = "".join(random.choice(chars) for _ in range(14))
    return jsonify({"password": password})

# =====================================================
# 3️⃣ Optional – Static Tips Endpoint
# =====================================================
@app.route("/tips", methods=["GET"])
def get_tips():
    tips = [
        "✅ Use at least 12 characters.",
        "🔒 Enable Two-Factor Authentication.",
        "🧩 Don’t reuse passwords across websites.",
        "🎯 Mix uppercase, lowercase, numbers, and symbols.",
        "🚫 Avoid using personal info or dates."
    ]
    return jsonify({"tips": tips})

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "PassGuardian API running"}), 200

# =====================================================
# Run the app
# =====================================================
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
