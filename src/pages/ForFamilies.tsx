// For Families intermediate landing page
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArrowRight, Check } from "lucide-react";
import { GlassButton } from "@/components/ui/effects";
import GradientText from "@/components/ui/effects/GradientText";

export default function ForFamilies() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="pt-[72px] md:pt-[82px] px-2 md:px-20 lg:px-40">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden min-h-[75vh] md:min-h-[85vh] flex flex-col items-center justify-end">
          <img loading="lazy"
            src="/family-hero.jpg"
            alt="Family together"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 30%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-auto mb-10 md:mb-16">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold font-heading mb-3 md:mb-4 tracking-tight text-white drop-shadow-lg">
              For Families
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-body mb-6 md:mb-8 max-w-2xl mx-auto drop-shadow-md">
              Find a faith-aligned caregiver who feels like family.
            </p>
          </div>
        </div>
      </section>

      {/* About Our Service */}
      <section className="py-2 md:py-8 px-2 md:px-4">
        {/* What We Offer - Full Width */}
        <div className="rounded-2xl md:rounded-3xl p-6 md:p-12" style={{ backgroundColor: '#4A4A4A' }}>
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-heading mb-4 md:mb-6 text-white flex flex-wrap items-center justify-center gap-2">
              <span className="font-normal">Is </span>
              <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-8 md:h-12 inline-block" />
              <span className="font-normal"> Right for You?</span>
            </h2>
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-3xl mx-auto mb-6">
              We work with families who see their nanny not just as a helper — but as an extension of their home and a partner in raising children with love, faith, and purpose.
            </p>
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-3xl mx-auto mb-8">
              Our families are faith-centered, seeking caregivers who share their values and beliefs. They need seasonal support for travel, camps, and flexible schedules. They have welcoming hearts, open to bringing a trusted nanny into their home. And they prefer a relationship-first approach over transactional care.
            </p>
            <h3 className="text-xl md:text-2xl font-bold font-heading mb-4 text-white">What We Offer</h3>
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-3xl mx-auto">
              We offer thoughtfully matched, fully vetted caregivers who share your values and beliefs, giving you peace of mind through thorough background checks and reference verification. Each placement is personally selected to suit your family's unique needs. Our ideal families are those seeking faith-centered care, whether for seasonal support like travel or camps, or for a more meaningful, relationship-first approach. We especially welcome families that are open to hosting a trusted nanny, and creating a warm, supportive environment where both caregiver and family can thrive together.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Dark Container */}
      <section className="px-2 md:px-4 py-1 md:py-3">
        <div className="rounded-2xl md:rounded-3xl py-6 md:py-12 px-4 md:px-12" style={{ backgroundColor: '#4A4A4A' }}>
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-5xl font-bold font-heading mb-6 md:mb-12 text-white text-center">
              How It Works
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Apply</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Submit your family profile and childcare needs.</p>
              </div>

              <div className="rounded-2xl p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-4xl font-bold font-heading mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-lg font-bold font-heading mb-2 text-[#4A4A4A]">Interview</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Share your parenting style and hopes.</p>
              </div>

              <div className="rounded-2xl p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-4xl font-bold font-heading mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-lg font-bold font-heading mb-2 text-[#4A4A4A]">Matching</h3>
                <p className="text-[#4A4A4A]/70 text-sm">We find your perfect faith-aligned match.</p>
              </div>

              <div className="rounded-2xl p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-4xl font-bold font-heading mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-lg font-bold font-heading mb-2 text-[#4A4A4A]">Meet</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Video introduction with your nanny.</p>
              </div>

              <div className="rounded-2xl p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-4xl font-bold font-heading mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-lg font-bold font-heading mb-2 text-[#4A4A4A]">Begin</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Start with ongoing support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-2 md:py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-heading mb-4 text-[#4A4A4A] text-center">
            <span className="font-normal">Our </span>
            <GradientText className="font-bold text-3xl md:text-5xl inline">Pricing</GradientText>
          </h2>
          <p className="text-center text-[#4A4A4A]/70 mb-10 max-w-2xl mx-auto">
            At <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-5 md:h-6 inline-block align-middle mx-1" />, we keep our pricing simple and transparent.
          </p>

          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            {/* Application Fee */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-300">
              <div>
                <span className="text-[#4A4A4A] font-medium">Application Fee</span>
                <p className="text-xs text-[#4A4A4A]/60">Annual fee, non-refundable</p>
              </div>
              <span className="text-xl font-bold text-[#4A4A4A]">$250</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 pt-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Access to our vetted, faith-aligned nanny network</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Personalized matching process</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Background-checked caregivers</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Ongoing support throughout the placement</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Replacement guarantee if needed</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-[#4A4A4A]/60 mt-6">
            Nanny wages are paid directly by families, separate from placement fees.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-2 md:px-4 py-1 md:py-3">
        <div className="rounded-2xl md:rounded-3xl py-8 md:py-14 px-4 relative overflow-hidden" style={{ backgroundColor: '#8BA99E' }}>
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#ffffff', transform: 'translate(-30%, -30%)' }}></div>
          <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: '#ffffff', transform: 'translate(40%, -50%)' }}></div>
          <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#ffffff', transform: 'translate(0, 40%)' }}></div>

          <div className="container mx-auto max-w-3xl text-center relative z-10 px-2">
            <h2 className="text-2xl md:text-5xl font-bold font-heading mb-4 md:mb-6 text-white">
              Ready to Find Your Nanny?
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-8 md:mb-10">
              We'd love to welcome your family into our community.
            </p>
            <GlassButton to="/apply-family" variant="white" size="lg">
              Start Your Application
              <ArrowRight className="h-5 w-5" />
            </GlassButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
