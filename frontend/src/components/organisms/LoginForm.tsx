"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { loginUser } from "@/lib/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

export function LoginForm() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [fieldError, setFieldError] = useState("")

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldError("")
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setFieldError("Please fill in all fields.")
      return
    }
    setIsLoading(true)
    setFieldError("")

    try {
      // 1. Exchange credentials for JWT
      const { access_token } = await loginUser({
        email: form.email,
        password: form.password,
      })

      // 2. Store token + fetch /auth/me profile (authStore handles both)
      await login(access_token)

      toast.success("Welcome back! 👋")
      router.push("/dashboard")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg =
        axiosErr.response?.data?.message ??
        "Invalid email or password. Please try again."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      {/* Header */}
      <motion.div variants={item} className="space-y-1 mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to your account to continue</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <motion.div variants={item} className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
            value={form.email}
            onChange={set("email")}
            className="h-10 bg-white border-slate-200 focus:border-[#10B981] focus:ring-[#10B981]/20"
          />
        </motion.div>

        {/* Password */}
        <motion.div variants={item} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <Link href="/forgot-password" className="text-xs text-[#10B981] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={set("password")}
              className="h-10 bg-white border-slate-200 pr-10 focus:border-[#10B981] focus:ring-[#10B981]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>

        {/* Inline error */}
        {fieldError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
          >
            {fieldError}
          </motion.p>
        )}

        {/* Submit */}
        <motion.div variants={item}>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-medium gap-2 transition-all shadow-sm shadow-[#10B981]/20",
                isLoading && "opacity-80"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        variants={item}
        className="flex items-center gap-3 my-7"
      >
        <Separator className="flex-1" />
        <span className="text-xs text-slate-400">OR</span>
        <Separator className="flex-1" />
      </motion.div>

      {/* Google (placeholder) */}
      <motion.div variants={item}>
        <Button
          variant="outline"
          className="w-full h-10 border-slate-200 gap-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          disabled
          title="Google SSO coming soon"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
      </motion.div>

      <motion.p
        variants={item}
        className="text-center text-sm text-slate-500 mt-7"
      >
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#10B981] font-medium hover:underline">
          Create one free →
        </Link>
      </motion.p>
    </motion.div>
  )
}
