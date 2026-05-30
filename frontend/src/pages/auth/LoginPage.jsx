import React from "react";
import { set, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";
import { AlertCircle, Loader } from "lucide-react";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setError(""); // Clear previous errors
    setLoading(true); //shows loading state while waiting for response
    // Handle form submission, like sending send login request to server
    try {
      const res = await login(data);
      loginUser(res.data.token, res.data.user);
      navigate("/"); // Redirect to dashboard after login
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "Login failed. Please check your credentials and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false); // Stop loading state
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">CK</span>
          </div>
          <h1 className="text-xl font-bold">Candy Kingdom</h1>
          <p className="text-sm text-gray-500">Inventory Management System</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm text-red-500 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Please enter a valid email address",
                },
              })}
              type="email"
              placeholder="Enter your email"
              className={`mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 ${
                errors.email ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              type="password"
              placeholder="Enter your password"
              className={`mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 ${
                errors.password ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 mt-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={16} /> Logging in...{" "}
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
