// Nannies page (For Families / For Nannies tabs + FAQ)
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Check, ArrowRight, ChevronDown, Share, PlusSquare } from "lucide-react";
import { GlassButton } from "@/components/ui/effects";
import GradientText from "@/components/ui/effects/GradientText";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useToast } from "@/hooks/use-toast";

export default function BecomeNanny() {
  const [activeTab, setActiveTab] = useState<'families' | 'nannies'>('families');
  const [openFaqLeft, setOpenFaqLeft] = useState<number | null>(null);
  const [openFaqRight, setOpenFaqRight] = useState<number | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { isIOS, promptInstall } = useInstallPrompt();
  const { toast } = useToast();

  const handleDownloadApp = async () => {
    // iOS has no native install prompt — always show the Add-to-Home-Screen steps.
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Android/desktop: fire the native prompt if available, otherwise guide them.
    const installed = await promptInstall();
    if (installed) {
      toast({
        title: "Download Started",
        description: "Club Nanny is being added to this device.",
      });
      return;
    }

    toast({
      title: "Install Club Nanny",
      description: "Look for the browser install option in the address bar, toolbar, or install popup.",
    });
  };

  const faqs = [
    {
      question: "What makes Club Nanny different?",
      answer: "Club Nanny is a faith-centered, family-run service that focuses on intentional matching based on shared values."
    },
    {
      question: "What does it cost?",
      answer: "An Investment in Your Home: We understand that inviting someone into your home is one of the most important decisions you'll make. Our process is designed to bring clarity, confidence, and peace - so you can focus on what matters most: your family.\n\nNanny Application Fee - $75 (Non-refundable): This fee covers your application review, interview process, background check, and entry into our nanny network.\n\nFamily Application Fee - $250 (Annual fee, non-refundable): With your application, you receive a detailed family consultation to learn your values, routines, and specific needs; prayerful consideration as we begin your search; and access to our carefully vetted, faith-aligned nanny network.\n\nNanny wages are paid directly by families and are not included in these fees. All fees are non-refundable."
    },
    {
      question: "What is the screening process?",
      answer: "Every nanny goes through personal interviews, background checks, and reference verification."
    },
    {
      question: "Can we meet our nanny first?",
      answer: "Yes! We arrange video introductions and personal interviews before making a final decision."
    },
    {
      question: "What support do you offer?",
      answer: "We provide ongoing support throughout the partnership, including regular check-ins and a replacement guarantee if needed."
    },
    {
      question: "Who are your nannies?",
      answer: "Faith-driven women passionate about nurturing children with purpose, joy, and integrity."
    },
    {
      question: "How do I get started?",
      answer: "Simply fill out our application form, pay the application fee, and we'll reach out to schedule your personal interview."
    },
    {
      question: "Do you collect commissions?",
      answer: "No Commission Fees – Every dollar paid by families goes directly to the nanny. We believe in transparent, fair compensation."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      {/* Where Faith Meets Family */}
      <section className="pt-[100px] md:pt-[120px] pb-6 md:pb-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-7xl font-heading">
              <GradientText className="font-normal text-4xl md:text-7xl">Where Faith Meets Family</GradientText>
            </h2>
          </div>
          <p className="text-base md:text-lg text-[#4A4A4A]/70 leading-relaxed text-center italic">
            We believe every family deserves exceptional care they can trust and every child deserves the consistency of a nurturing, lasting relationship. Club Nanny was created to thoughtfully connect families with professional nannies who provide personalized, long-term support tailored to each family's unique lifestyle and needs. Every nanny completes our rigorous vetting process, including comprehensive background checks, in-depth interviews, and reference verification, ensuring the highest standards of care and professionalism. By taking a highly curated approach to every placement, we create meaningful matches built on trust, compatibility, and continuity - giving families confidence, stability, and peace of mind through every stage of childhood and family life.
          </p>
        </div>
      </section>

      {/* Families & Nannies Tabs Section */}
      <section className="py-2 md:py-8 px-2 md:px-4">
        <div className="mx-auto md:max-w-5xl">
          {/* Tab Bar */}
          <div className="flex justify-center mb-8 px-1 md:px-0">
            <div className="flex w-full md:w-auto md:inline-flex rounded-full p-1.5" style={{ backgroundColor: '#E8E8E8' }}>
              <button
                onClick={() => setActiveTab('families')}
                className={`flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-full font-medium text-sm md:text-base transition-all duration-300 ${
                  activeTab === 'families'
                    ? 'bg-white text-[#4A4A4A] shadow-md'
                    : 'text-[#4A4A4A]/60 hover:text-[#4A4A4A]'
                }`}
              >
                For Families
              </button>
              <button
                onClick={() => setActiveTab('nannies')}
                className={`flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-full font-medium text-sm md:text-base transition-all duration-300 ${
                  activeTab === 'nannies'
                    ? 'bg-white text-[#4A4A4A] shadow-md'
                    : 'text-[#4A4A4A]/60 hover:text-[#4A4A4A]'
                }`}
              >
                For Nannies
              </button>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
            <div className="grid md:grid-cols-2">
              {/* Left - Image */}
              <div className="relative min-h-[400px] md:min-h-[500px] overflow-hidden">
                <img loading="lazy"
                  src={activeTab === 'families' ? '/forfamilyourprogram.jpeg' : '/fornanniesourprogram-new.jpeg'}
                  alt={activeTab === 'families' ? 'Family' : 'Nanny'}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                  style={{ objectPosition: activeTab === 'families' ? 'center 75%' : 'center 85%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>

              {/* Right - Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                {activeTab === 'families' ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-[#4A4A4A]">
                      Find Your Perfect Match
                    </h3>
                    <p className="text-[#4A4A4A]/70 mb-6 leading-relaxed">
                      Our ideal families are looking for more than a babysitter — they want a role model,
                      a helper, and a joyful presence in their home.
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#4A4A4A]/80">Faith-centered households</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#4A4A4A]/80">Relationship-driven approach</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#4A4A4A]/80">Supportive of character development</span>
                      </li>
                    </ul>
                    <div>
                      <GlassButton to="/for-families" variant="sage" size="lg">
                        Learn More
                        <ArrowRight className="h-5 w-5" />
                      </GlassButton>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl md:text-3xl font-bold font-heading mb-4 text-[#4A4A4A]">
                      Purposeful Work
                    </h3>
                    <p className="text-[#4A4A4A]/70 mb-6 leading-relaxed">
                      We welcome women who feel called to serve families with warmth, integrity, and faith.
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#4A4A4A]/80">Universities & communities</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#4A4A4A]/80">Youth ministry backgrounds</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#4A4A4A]/80">Education & child development focus</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#4A4A4A]/80">Passionate about nurturing children</span>
                      </li>
                    </ul>
                    <div>
                      <GlassButton to="/for-nannies" variant="sage" size="lg">
                        Learn More
                        <ArrowRight className="h-5 w-5" />
                      </GlassButton>
                    </div>
                  </>
                )}
              </div>
            </div>
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
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Apply Online</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Complete a simple application about your values and needs.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Interview</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Meet with us to share your story and faith background.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Matching</h3>
                <p className="text-[#4A4A4A]/70 text-sm">We pair families and nannies based on values and personality.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Video Call</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Meet your match through a video introduction.</p>
              </div>

              <div className="rounded-xl md:rounded-2xl p-4 md:p-6" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-2xl md:text-4xl font-bold font-heading mb-2 md:mb-3 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-sm md:text-lg font-bold font-heading mb-1 md:mb-2 text-[#4A4A4A]">Begin</h3>
                <p className="text-[#4A4A4A]/70 text-sm">Start your partnership with ongoing support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why They Love It */}
      <section className="pt-6 pb-2 md:py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center mb-4 md:mb-12">
          <h2 className="text-4xl md:text-5xl font-heading mb-4 text-[#4A4A4A]">
            <span className="font-normal">Why They </span>
            <GradientText className="font-bold text-4xl md:text-5xl inline">Love It</GradientText>
          </h2>
        </div>
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {/* Why Families Love */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm">
              <h3 className="text-2xl font-bold font-heading mb-6 text-[#4A4A4A]">
                Families
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">Trusted, faith-aligned caregivers</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">A consistent family rhythm</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">Support for travel and flexible schedules</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">Relationships that last beyond placements</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">No Commission Fees - Every dollar paid by families goes directly to the caregiver</span>
                </li>
              </ul>
            </div>

            {/* Why Nannies Love */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm">
              <h3 className="text-2xl font-bold font-heading mb-6 text-[#4A4A4A]">
                Nannies
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">Purposeful, meaningful work</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">A chance to pour into children</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">A supportive family environment</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">Experience rooted in faith and connection</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#8BA99E' }}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[#4A4A4A]/80">No Commission Fees - Every dollar paid by families goes directly to the caregiver</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-2 md:py-8 px-2 md:px-4">
        <div className="mx-auto md:max-w-5xl">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-3xl md:text-5xl font-heading mb-3 md:mb-4 text-[#4A4A4A]">
              <span className="font-normal">Got </span>
              <GradientText className="font-bold text-3xl md:text-5xl inline">Questions?</GradientText>
            </h2>
            <p className="text-base md:text-lg text-[#4A4A4A]/70 max-w-2xl mx-auto">
              Find answers to common questions about our program.
            </p>
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm p-5 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* Left Column */}
              <div className="flex flex-col gap-3 md:gap-4">
                {faqs.filter((_, i) => i % 2 === 0).map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#F0F0F0' }}
                  >
                    <button
                      onClick={() => setOpenFaqLeft(openFaqLeft === index ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left hover:opacity-80 transition-opacity"
                    >
                      <span className="font-medium text-[#4A4A4A] pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 flex-shrink-0 text-[#8BA99E] transition-transform duration-300 ${
                          openFaqLeft === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaqLeft === index ? 'max-h-[800px] pb-5 px-5' : 'max-h-0'
                      }`}
                    >
                      <p className="text-[#4A4A4A]/70 text-sm whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Right Column */}
              <div className="flex flex-col gap-3 md:gap-4">
                {faqs.filter((_, i) => i % 2 === 1).map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#F0F0F0' }}
                  >
                    <button
                      onClick={() => setOpenFaqRight(openFaqRight === index ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left hover:opacity-80 transition-opacity"
                    >
                      <span className="font-medium text-[#4A4A4A] pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 flex-shrink-0 text-[#8BA99E] transition-transform duration-300 ${
                          openFaqRight === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaqRight === index ? 'max-h-[800px] pb-5 px-5' : 'max-h-0'
                      }`}
                    >
                      <p className="text-[#4A4A4A]/70 text-sm whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              Ready to Join?
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-8 md:mb-10">
              Whether you're a family seeking a nurturing caregiver or a woman looking for meaningful work,
              we'd love to welcome you into our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center flex-wrap">
              <GlassButton to="/apply-family" variant="white" size="lg">
                Apply as Family
                <ArrowRight className="h-5 w-5" />
              </GlassButton>
              <GlassButton to="/apply-nanny" variant="outline" size="lg">
                Apply as Nanny
              </GlassButton>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowIOSModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#4A4A4A] mb-4 text-center">Install Club Nanny</h3>
            <p className="text-[#4A4A4A]/70 text-center mb-6">To install on your iPhone or iPad:</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#8BA99E' }}>1</div>
                <div className="flex items-center gap-2 text-[#4A4A4A]">
                  <span>Tap the</span>
                  <Share className="w-5 h-5" />
                  <span>Share button</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#8BA99E' }}>2</div>
                <div className="flex items-center gap-2 text-[#4A4A4A]">
                  <span>Tap</span>
                  <PlusSquare className="w-5 h-5" />
                  <span>"Add to Home Screen"</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#8BA99E' }}>3</div>
                <span className="text-[#4A4A4A]">Tap "Add" to install</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-6 py-3 rounded-full font-medium text-white"
              style={{ backgroundColor: '#8BA99E' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
