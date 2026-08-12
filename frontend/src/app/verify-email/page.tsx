import { AuthLayout } from "@/components/templates/AuthLayout"
import { VerifyEmailForm } from "@/components/organisms/VerifyEmailForm"

export const metadata = {
  title: "Verify Email",
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout variant="verify-email">
      <VerifyEmailForm />
    </AuthLayout>
  )
}
