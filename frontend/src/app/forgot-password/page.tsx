import dynamic from "next/dynamic"
import { AuthLayout } from "@/components/templates/AuthLayout"

const ForgotPasswordForm = dynamic(() => import('@/components/organisms/ForgotPasswordForm').then(m => m.ForgotPasswordForm), { ssr: false })


export const metadata = {
  title: "Forgot Password",
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout variant="forgot-password">
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
