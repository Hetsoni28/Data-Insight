import { Navbar } from "@/components/organisms/Navbar"
import { HeroSection } from "@/components/organisms/HeroSection"
import { StopReportingSection } from "@/components/organisms/StopReportingSection"
import { ArchitectureSection } from "@/components/organisms/ArchitectureSection"
import { ExcelSection } from "@/components/organisms/ExcelSection"
import { IntelligenceSection } from "@/components/organisms/IntelligenceSection"
import { WhitelabelShowcaseSection } from "@/components/organisms/WhitelabelShowcaseSection"
import { ScheduledReportsSection } from "@/components/organisms/ScheduledReportsSection"
import { SecurityComplianceSection } from "@/components/organisms/SecurityComplianceSection"
import { PricingSection } from "@/components/organisms/PricingSection"
import { FaqSection } from "@/components/organisms/FaqSection"
import { CtaSection } from "@/components/organisms/CtaSection"
import { Footer } from "@/components/organisms/Footer"

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
