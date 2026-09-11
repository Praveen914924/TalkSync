import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // ==========================================
  // SEND OTP
  // ==========================================

  const sendOtp = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch(
        "http://localhost:5002/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setVerified(false);
      setSuccess("OTP sent to your email");

    } catch (error) {
      console.error("Send OTP Error:", error);
      setError("Cannot connect to server");
    } finally {
      setOtpLoading(false);
    }
  };


  // ==========================================
  // VERIFY OTP
  // ==========================================

  const verifyOtp = async () => {
    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be 6 digits");
      return;
    }

    try {
      setVerifyLoading(true);

      const response = await fetch(
        "http://localhost:5002/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp: otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid OTP");
        return;
      }

      setVerified(true);
      setSuccess("Email verified successfully");

    } catch (error) {
      console.error("Verify OTP Error:", error);
      setError("Cannot connect to server");
    } finally {
      setVerifyLoading(false);
    }
  };


  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!verified) {
      setError("Please verify your email first");
      return;
    }

    if (!password) {
      setError("Please enter a password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setRegisterLoading(true);

      const response = await fetch(
        "http://localhost:5002/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting..."
      );

      setTimeout(() => {
        navigate("/");
      }, 1200);

    } catch (error) {
      console.error("Register Error:", error);
      setError("Cannot connect to server");
    } finally {
      setRegisterLoading(false);
    }
  };


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1>Create Account</h1>

        <p>
          Join TalkSync Today
        </p>


        {/* NAME */}

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />


        {/* EMAIL */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "15px",
          }}
        >

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setOtpSent(false);
              setVerified(false);
              setOtp("");
            }}
            style={{
              flex: 1,
              marginBottom: 0,
            }}
          />

          <button
            type="button"
            onClick={sendOtp}
            disabled={otpLoading || verified}
            style={{
              width: "auto",
              padding: "0 12px",
              whiteSpace: "nowrap",
            }}
          >
            {verified
              ? "Verified ✓"
              : otpLoading
              ? "Sending..."
              : "Send OTP"}
          </button>

        </div>


        {/* OTP */}

        {otpSent && !verified && (

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "15px",
            }}
          >

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) =>
                setOtp(
                  e.target.value.replace(/\D/g, "")
                )
              }
              style={{
                flex: 1,
                marginBottom: 0,
              }}
            />

            <button
              type="button"
              onClick={verifyOtp}
              disabled={verifyLoading}
              style={{
                width: "auto",
                padding: "0 12px",
                whiteSpace: "nowrap",
              }}
            >
              {verifyLoading
                ? "Checking..."
                : "Verify"}
            </button>

          </div>

        )}


        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />


        {/* ERROR */}

        {error && (
          <p
            style={{
              color: "#ef4444",
              marginTop: "5px",
            }}
          >
            {error}
          </p>
        )}


        {/* SUCCESS */}

        {success && (
          <p
            style={{
              color: "#22c55e",
              marginTop: "5px",
            }}
          >
            {success}
          </p>
        )}


        {/* REGISTER BUTTON */}

        <button
          type="button"
          onClick={handleRegister}
          disabled={registerLoading || !verified}
        >
          {registerLoading
            ? "Creating Account..."
            : "Create Account"}
        </button>


        {/* LOGIN LINK */}

        <span>
          Already have an account?{" "}
          <Link to="/">
            Login
          </Link>
        </span>

      </div>

    </div>
  );
}

export default RegisterPage;