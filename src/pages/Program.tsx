import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import GradientText from "@/components/ui/effects/GradientText";

export default function Program() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="pt-[72px] md:pt-[82px] px-2 md:px-20 lg:px-40">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden min-h-[75vh] md:min-h-[85vh] flex flex-col items-start justify-end md:justify-start">
          <img loading="lazy"
            src="/homepage.jpg"
            alt="Family together"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 40%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          {/* Title on image - off-center left */}
          <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-2xl mb-10 md:mb-0 md:mt-16 lg:mt-20">
            <h2 className="text-4xl md:text-7xl font-heading mb-4 text-white md:text-[#7a7a7a] drop-shadow-lg md:flex md:flex-col">
              <span className="font-normal">Childcare With </span>
              <span className="font-normal">Purpose</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-6 md:py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-heading mb-2 text-[#4A4A4A] text-center">
            <span className="font-normal">Where </span>
            <GradientText className="font-bold text-3xl md:text-5xl inline">Faith Meets Family</GradientText>
          </h2>
          <p className="text-lg md:text-xl text-[#8BA99E] font-medium mb-4 md:mb-6 text-center">
            Faith driven women serving families with heart.
          </p>
          <p className="text-base md:text-lg text-[#4A4A4A] leading-relaxed mb-6">
            Club Nanny was born from a simple belief: childcare should be more than a service. We created a curated, boutique platform built on shared values, faith and trust.
          </p>
          <p className="text-base md:text-lg text-[#4A4A4A] leading-relaxed mb-6">
            At Club Nanny, we offer two distinct care options designed to meet families where they are while creating meaningful opportunities for exceptional women.
          </p>
          <p className="text-base md:text-lg text-[#4A4A4A] leading-relaxed mb-6">
            The <span className="font-bold">Nanny Option</span> is for families seeking consistent, recurring childcare support. These long-term placements are thoughtfully matched to become an extension of your family, providing dependable care, mentorship, and meaningful connection. This option is ideal for families who need regular weekly care and for caregivers seeking stability and deeper connection with one family.
          </p>
          <p className="text-base md:text-lg text-[#4A4A4A] leading-relaxed mb-6">
            The <span className="font-bold">Sitter Option</span> is for families seeking flexible, as-needed childcare. Whether for date nights, school breaks, special events, or occasional support, families can connect with trusted caregivers for reliable care without a long-term commitment. This option is ideal for families who value flexibility and for caregivers who want freedom in their schedule.
          </p>
          <p className="text-base md:text-lg text-[#4A4A4A] leading-relaxed mb-10">
            Every Club Nanny caregiver completes our intentional vetting process, including background checks, interviews, and reference verification. Rooted in Christian faith and built on meaningful relationships, Club Nanny exists to provide families with care they can trust while helping women find purposeful work that fits their calling and season of life.
          </p>

          {/* Service Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Link
              to="/become-nanny"
              className="px-8 py-4 text-center text-lg md:text-xl font-heading font-semibold tracking-wide border-2 border-[#8BA99E] text-[#8BA99E] rounded-lg hover:bg-[#8BA99E] hover:text-white transition-all duration-300"
            >
              NANNY SERVICES
            </Link>
            <Link
              to="/for-sitters"
              className="px-8 py-4 text-center text-lg md:text-xl font-heading font-semibold tracking-wide border-2 border-[#E8A0BF] text-[#E8A0BF] rounded-lg hover:bg-[#E8A0BF] hover:text-white transition-all duration-300"
            >
              SITTER SERVICES
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
