import { Navbar } from "@/components/organisms/Navbar"
import { HeroSection } from "@/components/organisms/HeroSection"
import { StopReportingSection } from "@/components/organisms/StopReportingSection"
import { IntelligenceSection } from "@/components/organisms/IntelligenceSection"
import { ExcelSection } from "@/components/organisms/ExcelSection"
import { FaqSection } from "@/components/organisms/FaqSection"
import { PricingSection } from "@/components/organisms/PricingSection"
import { CtaSection } from "@/components/organisms/CtaSection"
import { Footer } from "@/components/organisms/Footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StopReportingSection />
      <IntelligenceSection />
      <ExcelSection />
      <FaqSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
