import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import PainPointsSection from "./components/PainPointsSection";
import OutcomeSection from "./components/OutcomeSection";
import ProductSection from "./components/ProductSection";
import PricingSection from "./components/PricingSection";
import FinalCTASection from "./components/FinalCTASection";
import Footer from "./components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PainPointsSection />
        <OutcomeSection />
        <ProductSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;