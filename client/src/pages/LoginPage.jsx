import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5002/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Invalid email or password"
        );
        return;
      }

      // Save logged-in user
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Save token if backend sends one
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      navigate("/chat");
    } catch (error) {
      console.error("Login Error:", error);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form
        className="auth-card"
        onSubmit={handleLogin}
      >
        <h1>TalkSync</h1>

        <p>Connect & Chat Easily</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
        />

        {error && (
          <div
            style={{
              color: "#ef4444",
              fontSize: "14px",
              textAlign: "center",
              marginTop: "5px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* FORGOT PASSWORD */}
        <div
          style={{
            textAlign: "center",
            marginTop: "5px",
          }}
        >
          <Link to="/forgot-password">
            Forgot Password?
          </Link>
        </div>

        <span>
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </span>
      </form>
    </div>
  );
}

export default LoginPage;