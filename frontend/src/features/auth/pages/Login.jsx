import { useState } from "react";
import { useNavigate, Link } from "react-router";
import ContinueWithGoogle from "../components/ContinueWithGoogle";
import { useAuth } from "../hook/useAuth.js";

export default function Login() {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await handleLogin({ email: form.email, password: form.password });
      if (user.role === "buyer") {
        navigate("/");
      } else if (user.role === "seller") {
        navigate("/seller/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(error.response?.data?.message || "Login failed");
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
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <ContinueWithGoogle />
        </form>

        <p className="text-xs text-center" style={{ color: "#7a7058" }}>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-bold underline transition-colors"
            style={{ color: "#FFD700" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
