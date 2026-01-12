"use client";
import InputBox from "@/app/components/InputBox";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Geist } from "next/font/google";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginForm() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = emailOrUser.trim() !== "" && password.trim() !== "";
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError("");

    try {
      const loginData = {
        email: emailOrUser,
        password: password,
      };

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Login successful:", data);

        localStorage.setItem("auth_token", data.access_token);
        localStorage.setItem("current_user_id", data.user.id);
        localStorage.setItem("user_data", JSON.stringify(data.user));

        router.push("/home");
      } else {
        const errorData = await res.json();
        setError(
          errorData.detail || "Login failed. Please check your credentials."
        );
        console.error("Login failed:", errorData);
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${geistSans.className} min-h-screen bg-gray-50`}>
      <div className="flex flex-col items-center justify-center px-6 pt-8">
        <div className="w-full mb-5 animate-fade-in">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src="/semai-elephant-water.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome!
            </h2>
            <p className="text-gray-600 text-md">Let's sign you in!</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <InputBox
              label="Email"
              type="email"
              value={emailOrUser}
              onChange={setEmailOrUser}
              placeholder="Enter your email"
              required
            />

            <InputBox
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
            />

            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className={`w-full mt-6 rounded-2xl py-3 text-base font-semibold transition 
                ${
                  canSubmit && !isLoading
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:bg-emerald-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <a href="/register" className="font-semibold">
            <button className="w-full mt-6 rounded-2xl py-3 text-base font-semibold bg-white text-emerald-600 border border-emerald-500 hover:bg-emerald-50 transition">
              Register
            </button>
          </a>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
