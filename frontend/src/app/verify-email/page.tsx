import { AuthLayout } from "@/components/templates/AuthLayout"
import { VerifyEmailForm } from "@/components/organisms/VerifyEmailForm"

export default function VerifyEmailPage() {
  return (
    <AuthLayout variant="verify-email">
      <VerifyEmailForm />
    </AuthLayout>
  )
}
