import { AuthLayout } from "@/components/templates/AuthLayout"
import { RegisterForm } from "@/components/organisms/RegisterForm"

export default function RegisterPage() {
  return (
    <AuthLayout variant="register">
      <RegisterForm />
    </AuthLayout>
  )
}
