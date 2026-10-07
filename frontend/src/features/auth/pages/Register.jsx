import { useState } from "react";
import { useAuth } from "../hook/useAuth";
import { useNavigate, Link } from "react-router";
import ContinueWithGoogle from "../components/ContinueWithGoogle";

export default function Register() {
  const { handleRegister } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    contact: "",
    password: "",
    isSeller: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleRegister(form);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans selection:bg-[#FFD700] selection:text-black"
      style={{ backgroundColor: "#0d0b05", color: "#eae2cf" }}
    >
      <div
        className="w-full max-w-sm rounded-lg p-6 sm:p-8 shadow-2xl space-y-6"
        style={{
          backgroundColor: "#131109",
          border: "1px solid #2e2817",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        }}
      >
        <div className="text-center">
          <Link
            to="/"
            className="text-2xl font-black tracking-widest block mb-1 transition-colors"
            style={{ color: "#FFD700" }}
          >
            SNITCH
          </Link>
          <p className="text-xs" style={{ color: "#a3987d" }}>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label
              className="text-[11px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "#d4c8ad" }}
            >
              Full Name
            </label>
            <input
              type="text"
              name="fullname"
              required
              placeholder="e.g. John Doe"
              value={form.fullname}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded outline-none transition-colors"
              style={{
                backgroundColor: "#080704",
                border: "1px solid #2e2817",
                color: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "#2e2817")}
            />
          </div>

          <div>
            <label
              className="text-[11px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "#d4c8ad" }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded outline-none transition-colors"
              style={{
                backgroundColor: "#080704",
                border: "1px solid #2e2817",
                color: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "#2e2817")}
            />
          </div>

          <div>
            <label
              className="text-[11px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "#d4c8ad" }}
            >
              Contact Number
            </label>
            <input
              type="tel"
              name="contact"
              placeholder="+91 98765 43210"
              value={form.contact}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded outline-none transition-colors"
              style={{
                backgroundColor: "#080704",
                border: "1px solid #2e2817",
                color: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "#2e2817")}
            />
          </div>

          <div>
            <label
              className="text-[11px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "#d4c8ad" }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded outline-none transition-colors"
              style={{
                backgroundColor: "#080704",
                border: "1px solid #2e2817",
                color: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "#2e2817")}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              name="isSeller"
              checked={form.isSeller}
              onChange={handleChange}
              className="w-3.5 h-3.5 cursor-pointer accent-[#FFD700]"
            />
            <span className="text-xs" style={{ color: "#d4c8ad" }}>
              Register as Seller
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-bold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer mt-2 disabled:opacity-50 shadow-md"
            style={{
              backgroundColor: "#FFD700",
              color: "#0d0b05",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffe135")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFD700")}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <ContinueWithGoogle />
        </form>

        <p className="text-xs text-center" style={{ color: "#7a7058" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold underline transition-colors"
            style={{ color: "#FFD700" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
