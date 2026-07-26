import { AuthLayout } from "@/components/templates/AuthLayout"
import { LoginForm } from "@/components/organisms/LoginForm"

export default function LoginPage() {
  return (
    <AuthLayout variant="login">
      <LoginForm />
    </AuthLayout>
  )
}
