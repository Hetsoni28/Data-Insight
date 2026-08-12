import { AuthLayout } from "@/components/templates/AuthLayout"
import { LoginForm } from "@/components/organisms/LoginForm"

export const metadata = {
  title: "Sign In",
}

export default function LoginPage() {
  return (
    <AuthLayout variant="login">
      <LoginForm />
    </AuthLayout>
  )
}
