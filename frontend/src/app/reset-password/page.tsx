import { AuthLayout } from "@/components/templates/AuthLayout"
import { ResetPasswordForm } from "@/components/organisms/ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <AuthLayout variant="reset-password">
      <ResetPasswordForm />
    </AuthLayout>
  )
}
