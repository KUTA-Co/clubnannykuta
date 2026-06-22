// About Us page
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import GradientText from "@/components/ui/effects/GradientText";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      <main className="flex-1 pt-[100px] md:pt-[120px]">
        <div className="max-w-4xl mx-auto px-4 pb-8">

          {/* Welcome */}
          <div className="mb-8 text-center">
            <h2 className="text-4xl md:text-7xl font-heading mb-4">
              <span className="font-normal text-[#7a7a7a]">Welcome to </span>
              <GradientText className="font-normal text-4xl md:text-7xl inline">Our Story</GradientText>
            </h2>
            <p className="text-sm md:text-base text-[#4A4A4A]/70 max-w-2xl mx-auto leading-relaxed">
              A faith-centered childcare environment where everything we do is rooted in shared values, trust, and intentional relationships. We nurture children and families through meaningful connections that feel like home - built on care, transparency, and genuine support.
            </p>
          </div>

          {/* Team Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Left - Image */}
            <div className="relative rounded-2xl overflow-hidden min-h-[350px] md:min-h-[450px]">
              <img
                loading="lazy"
                src="/aboutus1.jpeg"
                alt="Meet the team"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center 30%' }}
              />
            </div>

            {/* Right - Content */}
            <div className="flex flex-col justify-center">
              <h3 className="text-xl md:text-2xl font-bold font-heading mb-2 text-[#4A4A4A]">
                A Multigenerational Team
              </h3>
              <p className="text-sm text-[#4A4A4A]/70 mb-5">
                We're a family united by a shared calling to serve other families with faith, purpose, and heart.
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <h4 className="font-semibold text-[#4A4A4A] text-sm mb-1">Andries</h4>
                  <p className="text-[#4A4A4A]/60 text-xs leading-relaxed">
                    The steady voice of wisdom and experience. His leadership and heart for families guide our mission.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white relative">
                  <h4 className="font-semibold text-[#4A4A4A] text-sm mb-1">Leigh</h4>
                  <p className="text-[#4A4A4A]/60 text-xs leading-relaxed">
                    The connector. With a natural gift for understanding people, she helps create a trusted and welcoming community where families and caregivers can find meaningful connections.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <h4 className="font-semibold text-[#4A4A4A] text-sm mb-1">Campbell</h4>
                  <p className="text-[#4A4A4A]/60 text-xs leading-relaxed">
                    The next generation. Her passion for children and fresh perspective help us stay connected to modern families.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What We Believe Section */}
        <div className="max-w-4xl mx-auto px-0">
          <div className="rounded-2xl py-8 md:py-12 px-4 md:px-8" style={{ backgroundColor: '#4A4A4A' }}>
            <h2 className="text-xl md:text-3xl font-bold font-heading mb-8 text-white text-center">
              What We Believe
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-xl md:text-2xl font-bold mb-2 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-base font-bold font-heading mb-1 text-[#4A4A4A]">Empower Women</h3>
                <p className="text-[#4A4A4A]/70 text-xs">
                  Purposeful work that strengthens leadership and deepens faith.
                </p>
              </div>

              <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-xl md:text-2xl font-bold mb-2 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-base font-bold font-heading mb-1 text-[#4A4A4A]">Support Families</h3>
                <p className="text-[#4A4A4A]/70 text-xs">
                  Connect with caregivers who bring warmth and spiritual alignment.
                </p>
              </div>

              <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-xl md:text-2xl font-bold mb-2 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-base font-bold font-heading mb-1 text-[#4A4A4A]">Foster Relationships</h3>
                <p className="text-[#4A4A4A]/70 text-xs">
                  Build connections that feel like extended family.
                </p>
              </div>

              <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-xl md:text-2xl font-bold mb-2 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-base font-bold font-heading mb-1 text-[#4A4A4A]">Build Community</h3>
                <p className="text-[#4A4A4A]/70 text-xs">
                  Create space where faith and mentorship come together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
