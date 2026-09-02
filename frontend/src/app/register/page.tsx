import dynamic from "next/dynamic"
import { AuthLayout } from "@/components/templates/AuthLayout"

const LoginForm = dynamic(() => import('@/components/organisms/LoginForm').then(m => m.LoginForm), { ssr: false })


export const metadata = {
  title: "Register",
  description: "Join your organization on Data Insight",
}

export default function RegisterPage() {
  return (
    <AuthLayout variant="login">
      <LoginForm defaultMode="request" />
    </AuthLayout>
  )
}
