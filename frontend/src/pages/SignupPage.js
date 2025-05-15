import React, { useState } from "react";

function SignupPage({ onSignup }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Enhanced client-side validation
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    
    if (form.name.length < 20 || form.name.length > 60) {
      setError("Name must be between 20 and 60 characters.");
      setIsLoading(false);
      return;
    }
    
    if (form.password.length < 8 || form.password.length > 16) {
      setError("Password must be 8-16 characters.");
      setIsLoading(false);
      return;
    }
    
    if (!/[A-Z]/.test(form.password) || !/[!@#$&*]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter and one special character (!@#$&*).");
      setIsLoading(false);
      return;
    }
    
    if (form.address.length > 400) {
      setError("Address cannot exceed 400 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (data.errors && data.errors[0]?.msg) || "Signup failed");
      } else {
        localStorage.setItem("token", data.token);
        onSignup && onSignup(data.user);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Network error. Please check if the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <label>Name: <span style={{ color: "gray", fontSize: "0.8em" }}>(20-60 characters)</span></label>
        <input 
          name="name" 
          value={form.name} 
          onChange={handleChange} 
          required 
          minLength="20"
          maxLength="60"
        />
      </div>
      <div>
        <label>Email:</label>
        <input 
          name="email" 
          type="email" 
          value={form.email} 
          onChange={handleChange} 
          required 
          pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
          title="Please enter a valid email address"
        />
      </div>
      <div>
        <label>Address: <span style={{ color: "gray", fontSize: "0.8em" }}>(optional, max 400 characters)</span></label>
        <input 
          name="address" 
          value={form.address} 
          onChange={handleChange} 
          maxLength="400"
        />
      </div>
      <div>
        <label>Password: <span style={{ color: "gray", fontSize: "0.8em" }}>(8-16 chars, 1 uppercase, 1 special char)</span></label>
        <input 
          name="password" 
          type="password" 
          value={form.password} 
          onChange={handleChange} 
          required 
          minLength="8"
          maxLength="16"
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}

export default SignupPage;