import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { SocialProof } from "@/components/marketing/social-proof";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { UseCases } from "@/components/marketing/use-cases";
import { ProductStory } from "@/components/marketing/product-story";
import { LiveDemoSection } from "@/components/marketing/live-demo-section";
import { AiExplanation } from "@/components/marketing/ai-explanation";
import { SecuritySection } from "@/components/marketing/security-section";
import { FinalCta } from "@/components/marketing/final-cta";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <SocialProof />
        <FeaturesGrid />
        <UseCases />
        <ProductStory />
        <LiveDemoSection />
        <AiExplanation />
        <SecuritySection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
