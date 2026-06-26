import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { AlertCircle, Loader, Eye, EyeOff } from "lucide-react";
import Logo from "../../assets/logo.png";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      const res = await login(data);
      loginUser(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#fffbeb" }} // bg-amber-50 equivalent
    >
      <div className="relative z-10 w-full max-w-md">
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            {/* Soft Glow */}
            <div
              className="absolute -inset-8 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)",
              }}
            />
            <img
              src={Logo}
              alt="Candy Kingdom Logo"
              className="w-28 h-28 drop-shadow-xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-amber-950 tracking-tight mb-1">
            Candy Kingdom
          </h1>
          <p className="text-amber-600 font-semibold tracking-[3px] uppercase text-sm">
            INVENTORY MANAGEMENT
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-amber-100 rounded-3xl p-8 shadow-xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4">
              <AlertCircle
                className="text-red-500 mt-0.5 flex-shrink-0"
                size={18}
              />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-2 tracking-widest">
                EMAIL ADDRESS
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Please enter a valid email",
                  },
                })}
                type="email"
                placeholder="you@email.com"
                autoComplete="email"
                className="w-full bg-white border border-amber-200 focus:border-amber-400 rounded-2xl px-5 py-4 text-amber-950 placeholder:text-amber-400 text-sm transition-all outline-none"
              />
              {errors.email && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-2 tracking-widest">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white border border-amber-200 focus:border-amber-400 rounded-2xl px-5 py-4 text-amber-950 placeholder:text-amber-400 text-sm transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-4 rounded-2xl font-semibold text-base tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 shadow-md hover:shadow-lg"
              style={{
                background: loading
                  ? "linear-gradient(90deg, #f59e0b, #d97706)"
                  : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                color: "#451a03",
              }}
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Logging in...
                </>
              ) : (
                "LOG IN"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-amber-950 text-xs tracking-widest">
            AUTHORISED PERSONNEL ONLY • © 2026 CANDY KINGDOM IMS
          </p>
        </div>
      </div>
    </div>
  );
}
