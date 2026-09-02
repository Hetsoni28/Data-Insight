import dynamic from "next/dynamic"

const Navbar = dynamic(() => import('@/components/organisms/Navbar').then(m => m.Navbar), { ssr: false })
const HeroSection = dynamic(() => import('@/components/organisms/HeroSection').then(m => m.HeroSection), { ssr: false })
const StopReportingSection = dynamic(() => import('@/components/organisms/StopReportingSection').then(m => m.StopReportingSection), { ssr: false })
const ArchitectureSection = dynamic(() => import('@/components/organisms/ArchitectureSection').then(m => m.ArchitectureSection), { ssr: false })
const ExcelSection = dynamic(() => import('@/components/organisms/ExcelSection').then(m => m.ExcelSection), { ssr: false })
const IntelligenceSection = dynamic(() => import('@/components/organisms/IntelligenceSection').then(m => m.IntelligenceSection), { ssr: false })
const WhitelabelShowcaseSection = dynamic(() => import('@/components/organisms/WhitelabelShowcaseSection').then(m => m.WhitelabelShowcaseSection), { ssr: false })
const ScheduledReportsSection = dynamic(() => import('@/components/organisms/ScheduledReportsSection').then(m => m.ScheduledReportsSection), { ssr: false })
const SecurityComplianceSection = dynamic(() => import('@/components/organisms/SecurityComplianceSection').then(m => m.SecurityComplianceSection), { ssr: false })
const PricingSection = dynamic(() => import('@/components/organisms/PricingSection').then(m => m.PricingSection), { ssr: false })
const FaqSection = dynamic(() => import('@/components/organisms/FaqSection').then(m => m.FaqSection), { ssr: false })
const CtaSection = dynamic(() => import('@/components/organisms/CtaSection').then(m => m.CtaSection), { ssr: false })
const Footer = dynamic(() => import('@/components/organisms/Footer').then(m => m.Footer), { ssr: false })


export const metadata = {
  title: "Enterprise AI Business Intelligence",
  description:
    "Turn-key enterprise AI Business Intelligence platform available for dedicated VPC rental and custom global whitelabel licensing. Living multi-tab Excel workbooks, 6-stage autonomous data ingestion, and zero-retention security.",
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-hidden selection:bg-[#10B981] selection:text-white">
      <Navbar />
      <HeroSection />
      <StopReportingSection />
      <ArchitectureSection />
      <ExcelSection />
      <IntelligenceSection />
      <WhitelabelShowcaseSection />
      <ScheduledReportsSection />
      <SecurityComplianceSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
