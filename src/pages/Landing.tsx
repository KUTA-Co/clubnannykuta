// Landing / home page
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Send } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GlassButton, BlurText } from "@/components/ui/effects";
import GradientText from "@/components/ui/effects/GradientText";

export default function Landing() {
  const [supportTab, setSupportTab] = useState<'faq' | 'contact'>('faq');
  const [openFaqLeft, setOpenFaqLeft] = useState<number | null>(0);
  const [openFaqRight, setOpenFaqRight] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    type: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);


  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      name: `${contactForm.firstName} ${contactForm.lastName}`.trim(),
      email: contactForm.email,
      phone: contactForm.phone,
      subject: contactForm.type || 'General Inquiry',
      message: contactForm.message,
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/forms/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setContactForm({ firstName: '', lastName: '', email: '', phone: '', type: '', message: '' });
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="pt-[72px] md:pt-[82px] px-2 md:px-20 lg:px-40">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden min-h-[60vh] md:min-h-[70vh]">
          <img
            src="/homepage.jpg"
            alt="Faith-centered childcare"
            className="absolute inset-0 w-full h-full object-cover object-[50%_40%] md:object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>
      </section>

      {/* Blur Text Section */}
      <section className="pt-8 pb-2 md:py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-heading mb-4 md:mb-8 text-[#1a1a1a] md:flex md:flex-col">
            <span className="font-normal">Childcare With{" "}<span className="md:hidden"><GradientText className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl">Purpose</GradientText></span></span>
            <GradientText className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl hidden md:inline">Purpose</GradientText>
          </h2>
          <BlurText
            text="Faith-driven women."
            delay={100}
            animateBy="words"
            direction="bottom"
            className="text-lg md:text-2xl text-[#1a1a1a]/80"
          />
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-2 md:py-8 px-2 md:px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-3 md:gap-8 items-center">
            {/* Left - Text */}
            <div className="order-2 md:order-1">
              <p className="text-sm uppercase tracking-wider mb-3" style={{ color: '#8BA99E' }}>WHO WE ARE</p>
              <h2 className="text-3xl md:text-5xl font-heading mb-6 text-[#4A4A4A]">
                A Family With One Shared Calling
              </h2>
              <p className="text-base md:text-lg text-[#4A4A4A]/70 mb-4 leading-relaxed">
                <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-5 md:h-6 inline-block align-middle mx-1" /> was born from a simple belief: childcare should be more than a service — it should be a partnership built on shared values, trust, and faith.
              </p>
              <p className="text-base md:text-lg text-[#4A4A4A]/70 mb-4 leading-relaxed">
                As a multigenerational team, we saw the need for something different. Something intentional. We connect families with women who don't just watch children, but nurture them with purpose, joy, and integrity.
              </p>
              <p className="text-base md:text-lg text-[#4A4A4A]/70 mb-6 leading-relaxed">
                Whether you're a family seeking a faith-aligned caregiver or a woman looking for meaningful work — we'd love to connect with you.
              </p>
              <GlassButton to="/about" variant="sage" size="lg">
                Meet the Team
                <ArrowRight className="h-5 w-5" />
              </GlassButton>
            </div>
            {/* Right - Image */}
            <div className="order-1 md:order-2 -mx-4 md:mx-0">
              <div className="rounded-lg md:rounded-3xl overflow-hidden">
                <img
                  src="/whoweareimage.jpeg"
                  loading="lazy"
                  alt="Nanny with child"
                  className="w-full h-[280px] md:h-[500px] object-cover"
                  style={{ objectPosition: 'center 55%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="px-2 md:px-4 py-1 md:py-3">
        <div className="rounded-2xl md:rounded-3xl py-2 md:py-8 px-3 md:px-12" style={{ backgroundColor: '#4A4A4A' }}>
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-5xl font-bold font-heading mb-6 md:mb-12 text-white text-center">
              What Makes Us Different
            </h2>

            <div className="grid md:grid-cols-3 gap-3 md:gap-6">
              <div className="rounded-2xl p-5 md:p-8" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-4xl md:text-5xl font-bold font-heading mb-3 md:mb-4 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-lg md:text-xl font-bold font-heading mb-2 md:mb-3 text-[#4A4A4A]">Faith-Centered</h3>
                <p className="text-[#4A4A4A]/70 text-sm md:text-base">
                  Childcare is more than supervision—it's discipleship, character-building, and modeling love.
                </p>
              </div>

              <div className="rounded-2xl p-5 md:p-8" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-4xl md:text-5xl font-bold font-heading mb-3 md:mb-4 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-lg md:text-xl font-bold font-heading mb-2 md:mb-3 text-[#4A4A4A]">Family-Run</h3>
                <p className="text-[#4A4A4A]/70 text-sm md:text-base">
                  As a multigenerational team, we understand the real challenges families face.
                </p>
              </div>

              <div className="rounded-2xl p-5 md:p-8" style={{ backgroundColor: '#FAF9F6' }}>
                <span className="text-4xl md:text-5xl font-bold font-heading mb-3 md:mb-4 block" style={{ color: '#8BA99E' }}>✦</span>
                <h3 className="text-lg md:text-xl font-bold font-heading mb-2 md:mb-3 text-[#4A4A4A]">Trust-Based</h3>
                <p className="text-[#4A4A4A]/70 text-sm md:text-base">
                  Our screening process is thorough, personal, and designed to give families peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & Contact Section */}
      <section className="py-2 md:py-8 px-2 md:px-4">
        <div className="mx-auto md:max-w-5xl">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-3xl md:text-5xl font-heading mb-3 md:mb-4 text-[#4A4A4A]">
              <span className="font-normal">Got </span>
              <GradientText className="font-bold text-3xl md:text-5xl inline">Questions?</GradientText>
            </h2>
            <p className="text-base md:text-lg text-[#4A4A4A]/70 max-w-2xl mx-auto">
              Find answers or reach out to us directly.
            </p>
          </div>

          {/* Tab Bar */}
          <div className="flex justify-center mb-8 px-1 md:px-0">
            <div className="flex w-full md:w-auto md:inline-flex rounded-full p-1.5" style={{ backgroundColor: '#E8E8E8' }}>
              <button
                onClick={() => setSupportTab('faq')}
                className={`flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 rounded-full font-medium text-sm md:text-base transition-all duration-300 ${
                  supportTab === 'faq'
                    ? 'bg-white text-[#4A4A4A] shadow-md'
                    : 'text-[#4A4A4A]/60 hover:text-[#4A4A4A]'
                }`}
              >
                FAQ
              </button>
              <button
                onClick={() => setSupportTab('contact')}
                className={`flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 rounded-full font-medium text-sm md:text-base transition-all duration-300 ${
                  supportTab === 'contact'
                    ? 'bg-white text-[#4A4A4A] shadow-md'
                    : 'text-[#4A4A4A]/60 hover:text-[#4A4A4A]'
                }`}
              >
                Contact Us
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
            {supportTab === 'faq' ? (
              <div className="p-5 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Left Column */}
                  <div className="flex flex-col gap-3 md:gap-4">
                    {faqs.filter((_, i) => i % 2 === 0).map((faq, index) => {
                      const actualIndex = index * 2;
                      return (
                        <div
                          key={actualIndex}
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
                      );
                    })}
                  </div>
                  {/* Right Column */}
                  <div className="flex flex-col gap-3 md:gap-4">
                    {faqs.filter((_, i) => i % 2 === 1).map((faq, index) => {
                      const actualIndex = index * 2 + 1;
                      return (
                        <div
                          key={actualIndex}
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
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2">
                {/* Left - Image */}
                <div className="relative min-h-[300px] md:min-h-[500px] overflow-hidden">
                  <img
                    src="/contactusimage.jpg"
                    loading="lazy"
                    alt="Contact us"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: 'center center' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                {/* Right - Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  {submitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold font-heading mb-2 text-[#4A4A4A]">Message Sent!</h3>
                      <p className="text-[#4A4A4A]/60 mb-6">
                        Thank you for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="px-6 py-2 rounded-full border-2 font-medium transition-colors hover:bg-gray-50"
                        style={{ borderColor: '#8BA99E', color: '#8BA99E' }}
                      >
                        Send Another Message
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl md:text-3xl font-bold font-heading mb-2 text-[#4A4A4A]">
                        Send Us a Message
                      </h3>
                      <p className="text-[#4A4A4A]/60 mb-6">
                        We'd love to hear from you. Fill out the form below.
                      </p>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="First Name"
                            required
                            value={contactForm.firstName}
                            onChange={(e) => setContactForm({...contactForm, firstName: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8BA99E] transition-colors"
                          />
                          <input
                            type="text"
                            placeholder="Last Name"
                            required
                            value={contactForm.lastName}
                            onChange={(e) => setContactForm({...contactForm, lastName: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8BA99E] transition-colors"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <input
                            type="email"
                            placeholder="Email Address"
                            required
                            value={contactForm.email}
                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8BA99E] transition-colors"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8BA99E] transition-colors"
                          />
                        </div>
                        <select
                          value={contactForm.type}
                          onChange={(e) => setContactForm({...contactForm, type: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8BA99E] transition-colors text-[#4A4A4A]/60"
                        >
                          <option value="">I am a...</option>
                          <option value="Family looking for a nanny">Family looking for a nanny</option>
                          <option value="Caregiver interested in joining">Caregiver interested in joining</option>
                          <option value="Other">Other</option>
                        </select>
                        <textarea
                          placeholder="Your Message"
                          required
                          rows={4}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8BA99E] transition-colors resize-none"
                        ></textarea>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: '#8BA99E' }}
                        >
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
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
          <div className="absolute top-1/4 right-1/4 w-20 h-20 rounded-full opacity-5" style={{ backgroundColor: '#ffffff' }}></div>
          <div className="absolute bottom-1/4 left-10 w-16 h-16 rounded-full opacity-5" style={{ backgroundColor: '#ffffff' }}></div>

          <div className="container mx-auto max-w-3xl text-center relative z-10 px-2">
            <h2 className="text-2xl md:text-5xl font-bold font-heading mb-4 md:mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-8 md:mb-10">
              Join our community of faith-centered families and caregivers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <GlassButton to="/apply-family" variant="white" size="lg">
                Apply as Family
                <ArrowRight className="h-5 w-5" />
              </GlassButton>
              <GlassButton to="/apply-nanny" variant="outline" size="lg">
                Apply as Nanny
                <ArrowRight className="h-5 w-5" />
              </GlassButton>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
