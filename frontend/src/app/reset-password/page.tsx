"use client"
import dynamic from "next/dynamic"
import { AuthLayout } from "@/components/templates/AuthLayout"



const ResetPasswordForm = dynamic(() => import('@/components/organisms/ResetPasswordForm').then(m => m.ResetPasswordForm), { ssr: false })

export default function ResetPasswordPage() {
  return (
    <AuthLayout variant="reset-password">
      <ResetPasswordForm />
    </AuthLayout>
  )
}
