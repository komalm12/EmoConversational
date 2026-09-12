import React, { useState } from "react";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      setSent(true);
    } else {
      alert("Please enter your email");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="form-heading">
        Reset your <em>password</em>
      </h2>
      <p className="form-sub">
        {sent
          ? "Check your inbox for a reset link."
          : "Enter the email you signed up with and we'll send you a reset link."}
      </p>

      {!sent && (
        <>
          <div className="field">
            <label>Email</label>
            <div className="input-wrap">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="btn-submit" type="submit">
            Send reset link →
          </button>
        </>
      )}

      {sent && (
        <div
          style={{
            background: "var(--cream)",
            borderRadius: "14px",
            padding: "20px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✉️</div>
          <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: 0, lineHeight: 1.6 }}>
            We've sent a reset link to <strong>{email}</strong>. 
            Check your spam folder if you don't see it.
          </p>
        </div>
      )}

      <button
        className="btn-anon"
        type="button"
        onClick={onBack}
      >
        ← Back to sign in
      </button>
    </form>
  );
}