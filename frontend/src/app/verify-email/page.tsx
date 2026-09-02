import dynamic from "next/dynamic"
import { AuthLayout } from "@/components/templates/AuthLayout"



const VerifyEmailForm = dynamic(() => import('@/components/organisms/VerifyEmailForm').then(m => m.VerifyEmailForm), { ssr: false })

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
