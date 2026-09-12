import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PERSONAS = [
  { emoji: "👩", name: "Mom" },
  { emoji: "👨", name: "Dad" },
  { emoji: "👴", name: "Grandpa" },
  { emoji: "👦", name: "Sibling" },
];

export default function SignupForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    persona: "",
    terms: false,
  });

  const [showPass, setShowPass] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      formData.name &&
      formData.email &&
      formData.password &&
      formData.terms
    ) {
      localStorage.setItem("ec_token", "logged_in");
      localStorage.setItem(
        "ec_user_profile",
        JSON.stringify({
          name: formData.name,
          email: formData.email,
          preferredPersona: formData.persona || "mom",
          mode: "account",
          joinedAt: new Date().toISOString(),
        })
      );
      navigate("/persona");
    } else {
      alert("Please fill all fields and accept terms");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSignup}>

      {/* Heading */}
      <h2 className="form-heading">
        Join <em>EmoCompanion</em> 🌱
      </h2>
      <p className="form-sub">
        Set up your safe space in under a minute.
      </p>

      {/* Name */}
      <div className="field">
        <label>Name</label>
        <div className="input-wrap">
          <span className="input-icon">👤</span>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Email */}
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

      {/* Password */}
      <div className="field">
        <label>Password</label>
        <div className="input-wrap">
          <span className="input-icon">🔑</span>
          <input
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Min. 8 characters"
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

      {/* Persona Picker */}
      <span className="picker-label">
        Who do you usually want to talk to?
      </span>
      <div className="persona-picker">
        {PERSONAS.map(({ emoji, name }) => (
          <div
            key={name}
            className={`persona-opt ${formData.persona === name ? "picked" : ""
              }`}
            onClick={() =>
              setFormData((prev) => ({ ...prev, persona: name }))
            }
          >
            <span className="p-emoji">{emoji}</span>
            <span className="p-label">{name}</span>
          </div>
        ))}
      </div>

      {/* Terms */}
      <label className="terms-row">
        <div
          className={`custom-check ${formData.terms ? "checked" : ""
            }`}
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              terms: !prev.terms,
            }))
          }
        >
          ✓
        </div>
        <span className="terms-text">
          I agree to the terms & conditions
        </span>
      </label>

      {/* Submit */}
      <button className="btn-submit" type="submit">
        Create my account →
      </button>

      {/* Divider */}
      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">or</span>
        <div className="divider-line"></div>
      </div>

      {/* Anonymous */}
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
              preferredPersona: formData.persona || "mom",
              mode: "guest",
              joinedAt: new Date().toISOString(),
            })
          );
          navigate("/persona");
        }}
      >
        🎭 Try anonymously instead
      </button>

      {/* Note */}
      <p className="form-note">
        Your data is anonymized before storage.
        <br />
        Session logs auto-expire after 30 days. 🔒
      </p>
    </form>
  );
}