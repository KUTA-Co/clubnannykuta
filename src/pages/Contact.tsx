// Contact page
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import GradientText from "@/components/ui/effects/GradientText";
import { trackFormSubmit } from "@/lib/analytics";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
        trackFormSubmit('contact');
        setSubmitted(true);
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <img
              src="/contactusimage.jpeg"
              loading="lazy"
              alt="Contact us"
              className="w-full h-[300px] md:h-[400px] object-cover"
              style={{ objectPosition: 'center 40%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-2 drop-shadow-lg">
                Contact Us
              </h2>
              <p className="text-white/90 text-sm md:text-base drop-shadow-md">
                Have questions? We'd love to hear from you.
              </p>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="bg-[#F5F5F5] rounded-2xl p-4 md:p-6 mb-12">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {/* Email Us */}
              <div className="bg-white rounded-xl p-4 md:p-6 text-center shadow-sm">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-[#4A4A4A] text-sm mb-1">Email Us</h3>
                <a href="mailto:Leigh@clubnanny.com" className="text-xs" style={{ color: '#8BA99E' }}>
                  Leigh@clubnanny.com
                </a>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl p-4 md:p-6 text-center shadow-sm">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-[#4A4A4A] text-sm mb-1">Location</h3>
                <p className="text-xs text-[#4A4A4A]/70">Serving nationwide</p>
              </div>
            </div>
          </div>

          {/* Get in Touch Section */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-heading mb-2 text-[#4A4A4A]">
              <span className="font-normal">Get in </span>
              <GradientText className="font-bold text-2xl md:text-4xl inline">Touch</GradientText>
            </h2>
            <p className="text-sm md:text-base text-[#4A4A4A]/70">
              Send us a message or check our FAQ below.
            </p>
          </div>

          {/* Contact Form */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg md:text-xl font-semibold font-heading mb-6 text-[#4A4A4A]">
                Send a Message
              </h3>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#8BA99E' }}>
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-2 text-[#4A4A4A]">Message Sent!</h3>
                  <p className="text-[#4A4A4A]/70 mb-5 text-sm">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
                    }}
                    className="px-5 py-2.5 rounded-full border-2 font-medium text-sm transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#8BA99E', color: '#8BA99E' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#4A4A4A]">Full Name *</Label>
                      <Input
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                        className="h-11 rounded-lg border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#4A4A4A]">Email *</Label>
                      <Input
                        type="email"
                        placeholder="you@email.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                        className="h-11 rounded-lg border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#4A4A4A]">Phone</Label>
                      <Input
                        placeholder="(555) 555-5555"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="h-11 rounded-lg border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#4A4A4A]">Subject *</Label>
                      <Input
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={(e) => handleChange("subject", e.target.value)}
                        required
                        className="h-11 rounded-lg border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Message *</Label>
                    <Textarea
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      required
                      className="min-h-[120px] rounded-lg border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#8BA99E' }}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
