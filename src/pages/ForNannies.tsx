// For Nannies intermediate landing page
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArrowRight, Check } from "lucide-react";
import { GlassButton } from "@/components/ui/effects";
import GradientText from "@/components/ui/effects/GradientText";

export default function ForNannies() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      {/* 1. Photo - Hero Section */}
      <section className="pt-[72px] md:pt-[82px] px-2 md:px-20 lg:px-40">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden min-h-[75vh] md:min-h-[85vh] flex flex-col items-center justify-end">
          <img loading="lazy"
            src="/nanny-hero.jpg"
            alt="Nanny with children"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 50%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-auto mb-10 md:mb-16">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold font-heading mb-3 md:mb-4 tracking-tight text-white drop-shadow-lg">
              For Nannies
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-body max-w-2xl mx-auto drop-shadow-md">
              Purposeful work that aligns with your faith and values.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Copy - Become a Nanny With Purpose */}
      <section className="py-2 md:py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-heading mb-4 md:mb-6 text-[#4A4A4A]">
              <span className="font-normal">Become a Nanny </span>
              <GradientText className="font-bold text-3xl md:text-5xl inline">With Purpose</GradientText>
            </h2>
          </div>
        </div>
      </section>

      {/* 3. Grey Background with Copy */}
      <section className="px-2 md:px-4 py-1 md:py-3">
        <div className="rounded-2xl md:rounded-3xl p-8 md:p-12" style={{ backgroundColor: '#4A4A4A' }}>
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-6">
              Joining <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-5 md:h-6 inline-block align-middle mx-1" /> means stepping into meaningful, faith-aligned work where you serve families who share your values while growing both personally and professionally. It's more than just a job - it's an opportunity for ministry, mentorship, and building lasting relationships with families who truly value connection.
            </p>
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-6">
              You'll be part of a supportive, caring team that invests in you, offering real-world experience and leadership development along the way.
            </p>
            <p className="text-base md:text-lg text-white/80 leading-relaxed">
              We're looking for individuals who are passionate about working with children, feel called to serve with purpose, and bring experience in areas like babysitting, tutoring, or youth ministry. Whether you're seeking full-time or part-time placements, you'll join a community that feels like family - where your faith is honored, your work is meaningful, and you're supported at every step of the journey.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Photo Section */}
      <section className="px-2 md:px-4 py-1 md:py-3">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden min-h-[55vh] md:min-h-[50vh] flex items-center">
          <img loading="lazy"
            src="/faith-fear-image.jpeg"
            alt="Faith Family Purpose"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 25%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/50 to-black/20 md:from-black/70 md:via-black/40 md:to-transparent"></div>
          <div className="relative z-10 ml-0 md:ml-auto px-6 md:px-16 max-w-xl text-left md:text-right">
            <h2 className="text-2xl md:text-5xl font-bold font-heading mb-3 md:mb-4 text-white">
              Faith. Family. Purpose.
            </h2>
            <p className="text-base md:text-lg text-white/90">
              Join a community where your calling meets opportunity, and every day brings meaning.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Grey How It Works */}
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
                <p className="text-[#4A4A4A]/70 text-sm">Share your background and faith foundation.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Interview</h3>
                <p className="text-[#4A4A4A]/70 text-sm">We get to know your calling and approach.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Verification</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Background check and references.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Meet Family</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Video introduction with your match.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Begin</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Start with ongoing support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section className="py-2 md:py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-heading mb-4 text-[#4A4A4A] text-center">
            <span className="font-normal">Our </span>
            <GradientText className="font-bold text-3xl md:text-5xl inline">Pricing</GradientText>
          </h2>
          <p className="text-center text-[#4A4A4A]/70 mb-10 max-w-2xl mx-auto">
            Joining <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-5 md:h-6 inline-block align-middle mx-1" /> is simple and affordable. A one-time application fee gets you into our network and starts your journey.
          </p>

          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <span className="text-[#4A4A4A] font-medium">Application Fee</span>
                  <p className="text-xs text-[#4A4A4A]/60">One-time, non-refundable</p>
                </div>
                <span className="text-2xl font-bold text-[#8BA99E]">$75</span>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Application review and personal interview</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Background check and reference verification</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Entry into our faith-aligned nanny network</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Personalized matching with families who share your values</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">Ongoing support throughout your placement</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8BA99E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#4A4A4A]/70">No commission fees - every dollar paid by families goes directly to the caregiver</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-[#4A4A4A]/60 mt-6">
            No hidden fees. Wages are paid directly by your host family.
          </p>
        </div>
      </section>

      {/* 7. Ready to Begin CTA */}
      <section className="px-2 md:px-4 py-1 md:py-3">
        <div className="rounded-2xl md:rounded-3xl py-8 md:py-14 px-4 relative overflow-hidden" style={{ backgroundColor: '#8BA99E' }}>
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#ffffff', transform: 'translate(-30%, -30%)' }}></div>
          <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: '#ffffff', transform: 'translate(40%, -50%)' }}></div>
          <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: '#ffffff', transform: 'translate(0, 40%)' }}></div>

          <div className="container mx-auto max-w-3xl text-center relative z-10 px-2">
            <h2 className="text-2xl md:text-5xl font-bold font-heading mb-4 md:mb-6 text-white">
              Ready to Begin?
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-8 md:mb-10">
              If you feel called to join <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-5 md:h-6 inline-block align-middle mx-1" />, we'd love to meet you.
            </p>
            <GlassButton to="/apply-nanny" variant="white" size="lg">
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
