import { ForgotPasswordForm } from "@/components/organisms/ForgotPasswordForm"
import { AuthLayout } from "@/components/templates/AuthLayout"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout variant="forgot-password">
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
