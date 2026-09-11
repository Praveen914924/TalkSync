import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5002/api/password/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setMessage("OTP sent successfully. Check your email.");
    } catch (error) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setMessage("");

    if (!otp || !newPassword) {
      setError("OTP and new password are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5002/api/password/reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Password reset failed");
        return;
      }

      setMessage("Password reset successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Forgot Password</h1>

        <p>Reset your TalkSync password</p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={otpSent}
        />

        {!otpSent ? (
          <button onClick={sendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
            />

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
            />

            <button
              onClick={resetPassword}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        {message && (
          <p style={{ color: "#22c55e" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <span>
          Remember your password?{" "}
          <Link to="/">Login</Link>
        </span>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;