import "../globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      {/* <TestimonialsSection /> */}
      <FAQSection />
      <ContactSection />
    </>
  );
}
