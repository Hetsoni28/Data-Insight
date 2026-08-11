import { ForgotPasswordForm } from "@/components/organisms/ForgotPasswordForm"
import { AuthLayout } from "@/components/templates/AuthLayout"

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
