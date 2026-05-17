import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { Problem } from "./components/problem";
import { Solution } from "./components/solution";
import { HowItWorks } from "./components/how-it-works";
import { Features } from "./components/features";
import { Comparison } from "./components/comparison";
import { UseCases } from "./components/use-cases";
import { Trust } from "./components/trust";
import { Pricing } from "./components/pricing";
import { CTA } from "./components/cta";
import { Footer } from "./components/footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <Comparison />
        <UseCases />
        <Trust />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
