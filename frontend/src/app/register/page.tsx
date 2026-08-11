import { AuthLayout } from "@/components/templates/AuthLayout"
import { LoginForm } from "@/components/organisms/LoginForm"

export const metadata = {
  title: "Register & Request Access",
  description: "Join your organization on Data Insight",
}

export default function RegisterPage() {
  return (
    <AuthLayout variant="login">
      <LoginForm defaultMode="request" />
    </AuthLayout>
  )
}
