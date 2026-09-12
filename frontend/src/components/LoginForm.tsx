import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onForgot: () => void;
}

export default function LoginForm({ onForgot }: LoginFormProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.email && formData.password) {
      localStorage.setItem("ec_token", "logged_in");
      localStorage.setItem(
        "ec_user_profile",
        JSON.stringify({
          name: formData.email.split("@")[0],
          email: formData.email,
          mode: "account",
          joinedAt: new Date().toISOString(),
        })
      );
      navigate("/persona");
    } else {
      alert("Please enter email and password");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      
      {/* Heading */}
      <h2 className="form-heading">
        Welcome <em>back</em> 👋
      </h2>
      <p className="form-sub">
        Sign in to continue your conversations and mood history.
      </p>

      {/* Email Field */}
      <div className="field">
        <label>Email</label>
        <div className="input-wrap">
          <span className="input-icon">📧</span>
          <input
            type="email"
            name="email"
            placeholder="you@college.edu"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="field">
        <label>Password</label>
        <div className="input-wrap">
          <span className="input-icon">🔒</span>
          <input
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Forgot Password */}
      <div className="forgot-row">
        <button
          className="forgot-link"
          type="button"
          onClick={onForgot}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <button className="btn-submit" type="submit">
        Sign in →
      </button>

      {/* Divider */}
      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">or continue without account</span>
        <div className="divider-line"></div>
      </div>

      {/* Anonymous Button */}
      <button
        className="btn-anon"
        type="button"
        onClick={() => {
          const anonId =
            "anon_" + Math.random().toString(36).substring(2, 14);
          sessionStorage.setItem("ec_anon_id", anonId);
          localStorage.setItem(
            "ec_user_profile",
            JSON.stringify({
              name: "Anonymous",
              email: "",
              mode: "guest",
              joinedAt: new Date().toISOString(),
            })
          );
          navigate("/persona");
        }}
      >
        🎭 Try anonymously — no login needed
      </button>

      {/* Note */}
      <p className="form-note">
        Your session stays on your device only.
        <br />
        No mood history saved in anonymous mode.
      </p>
    </form>
  );
}