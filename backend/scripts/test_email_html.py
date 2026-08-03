import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.services.email import _otp_template

if __name__ == "__main__":
    html = _otp_template("Welcome, Het! 👋", "Enter your code to verify your account.", "849201", "5 minutes")
    out_file = os.path.join(os.path.dirname(__file__), "sample_email.html")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Sample email written to {out_file}")
