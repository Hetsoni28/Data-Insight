"use client"
import dynamic from "next/dynamic"
import { AuthLayout } from "@/components/templates/AuthLayout"



const LoginForm = dynamic(() => import('@/components/organisms/LoginForm').then(m => m.LoginForm), { ssr: false })

export default function LoginPage() {
  return (
    <AuthLayout variant="login">
      <LoginForm />
    </AuthLayout>
  )
}
