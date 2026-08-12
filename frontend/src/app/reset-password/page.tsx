import { AuthLayout } from "@/components/templates/AuthLayout"
import { ResetPasswordForm } from "@/components/organisms/ResetPasswordForm"

export const metadata = {
  title: "Reset Password",
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout variant="reset-password">
      <ResetPasswordForm />
    </AuthLayout>
  )
}
