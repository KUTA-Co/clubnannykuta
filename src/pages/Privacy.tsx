import { useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

export default function Privacy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const handleClose = () => {
    navigate(returnTo);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = 20;

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [74, 74, 74]) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, maxWidth);

      if (yPos + (lines.length * fontSize * 0.4) > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(lines, margin, yPos);
      yPos += lines.length * fontSize * 0.4 + 4;
    };

    // Title
    doc.setFillColor(139, 169, 158);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Club Nanny", margin, 18);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Privacy Policy", margin, 30);

    yPos = 55;

    // Content
    addText("1. Information We Collect", 14, true);
    addText("We collect information that you provide directly to us, including: account information (name, email, phone number), application information, household and caregiver profile information, photos, bio, experience, certifications, payment and membership information, communication data, device notification preferences, and usage data.", 10);
    yPos += 6;

    addText("2. How We Use Your Information", 14, true);
    addText("We use the information we collect to: provide, maintain, and improve our services; review applications; process membership and application payments through Stripe; connect families with nannies and sitters; send technical notices, support messages, and app notifications; respond to your comments and questions; conduct background checks and verification; and detect, prevent, and address technical issues.", 10);
    yPos += 6;

    addText("3. Information Sharing", 14, true);
    addText("We do not sell your personal information. We may share your information with other users as appropriate for matching and bookings, with service providers such as Stripe, hosting, email, notification, and background-check providers, for legal compliance, or in connection with a business transfer.", 10);
    yPos += 6;

    addText("4. Data Security", 14, true);
    addText("We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.", 10);
    yPos += 6;

    addText("5. Your Rights", 14, true);
    addText("You have the right to: Access and receive a copy of your personal data; Rectify inaccurate data; Request deletion; Object to processing; Request restriction of processing; Data portability.", 10);
    yPos += 6;

    addText("6. Cookies and Tracking", 14, true);
    addText("We use cookies and similar tracking technologies. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent.", 10);
    yPos += 6;

    addText("7. Children's Privacy", 14, true);
    addText("Our service is not intended for children under the age of 16. We do not knowingly collect personal information from children under 16 without appropriate parental or guardian consent where required by law. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us immediately so we can review and remove the information if necessary.", 10);
    addText("Club Nanny permits individuals ages 16 and older to apply as caregivers on the platform. For caregivers under the age of 18, parental or legal guardian consent may be required prior to account approval and participation in the platform.", 10);
    addText("Parents and guardians of minor caregivers acknowledge and agree that participation on the platform is voluntary and subject to Club Nanny's screening, safety, and community standards. Club Nanny reserves the right to deny, suspend, or remove any account at its discretion.", 10);
    addText("Families are solely responsible for evaluating and selecting caregivers that meet their individual preferences and comfort levels. Club Nanny provides a platform for connection and does not employ caregivers or supervise individual childcare arrangements.", 10);
    yPos += 6;

    addText("8. Payments", 14, true);
    addText("Payment information is processed by Stripe. This includes application fees, sitter application fees, and app membership payments. We do not store full card numbers on our servers. Stripe may collect and process payment data according to its own privacy policy.", 10);
    yPos += 6;

    addText("9. Changes to This Policy", 14, true);
    addText("We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.", 10);
    yPos += 6;

    addText("10. Contact Us", 14, true);
    addText("If you have any questions about this Privacy Policy, please contact us at Leigh@clubnanny.com", 10);
    yPos += 10;

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(`Last updated: ${new Date().toLocaleDateString("en-US")}`, margin, yPos);
    doc.text("www.clubnanny.com", pageWidth - margin - 30, yPos);

    doc.save("ClubNanny-Privacy-Policy.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b border-[#E8E5DF]">
          <DialogTitle className="text-3xl font-bold font-heading text-[#4A4A4A]">
            Privacy Policy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-6 font-body text-[#4A4A4A]/80">
          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed mb-3">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account information (name, email, phone number)</li>
              <li>Application information, including family needs, caregiver experience, faith background, and references</li>
              <li>Household and caregiver profile information (photos, bio, experience, certifications, availability, and location details)</li>
              <li>Payment and membership information</li>
              <li>Communication data (messages and booking-related activity between families and caregivers)</li>
              <li>Device notification preferences for the Club Nanny app</li>
              <li>Usage data (how you interact with our platform)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">2. How We Use Your Information</h2>
            <p className="leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Review applications and process background-check or verification steps</li>
              <li>Process application fees, sitter application fees, and app membership payments through Stripe</li>
              <li>Connect families with nannies and sitters for matching and bookings</li>
              <li>Send you technical notices and support messages</li>
              <li>Send app notifications about requests, responses, bookings, and payments when enabled</li>
              <li>Respond to your comments and questions</li>
              <li>Detect, prevent, and address technical issues</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">3. Information Sharing</h2>
            <p className="leading-relaxed mb-3">
              We do not sell your personal information. We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>With other users (families and caregivers can see relevant profiles and booking details, as appropriate)</li>
              <li>With service providers who assist us in operating our platform, including Stripe, hosting, email, notification, and background-check providers</li>
              <li>For legal compliance or to protect rights and safety</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">4. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to 
              use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">5. Your Rights</h2>
            <p className="leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">6. Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our platform and hold certain information. 
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">7. Children's Privacy</h2>
            <div className="space-y-4 leading-relaxed">
              <p>
                Our service is not intended for children under the age of 16. We do not knowingly collect personal information
                from children under 16 without appropriate parental or guardian consent where required by law. If you are a
                parent or guardian and believe your child has provided us with personal information without your consent, please
                contact us immediately so we can review and remove the information if necessary.
              </p>
              <p>
                Club Nanny permits individuals ages 16 and older to apply as caregivers on the platform. For caregivers under
                the age of 18, parental or legal guardian consent may be required prior to account approval and participation
                in the platform.
              </p>
              <p>
                Parents and guardians of minor caregivers acknowledge and agree that participation on the platform is voluntary
                and subject to Club Nanny's screening, safety, and community standards. Club Nanny reserves the right to deny,
                suspend, or remove any account at its discretion.
              </p>
              <p>
                Families are solely responsible for evaluating and selecting caregivers that meet their individual preferences
                and comfort levels. Club Nanny provides a platform for connection and does not employ caregivers or supervise
                individual childcare arrangements.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">8. Payments</h2>
            <p className="leading-relaxed">
              Payment information is processed by Stripe. This includes application fees, sitter application fees, and app membership payments.
              We do not store full card numbers on our servers.
              Stripe may collect and process payment data according to its own privacy policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy 
              Policy on this page and updating the "Last updated" date.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">10. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at Leigh@clubnanny.com
            </p>
          </div>

          <div className="pt-6 border-t border-[#E8E5DF]">
            <p className="text-sm text-[#4A4A4A]/60">
              Last updated: {new Date().toLocaleDateString("en-US")}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-6 border-t border-[#E8E5DF] mt-6">
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadPDF}
              className="flex-1 h-12 text-base font-body font-medium text-white shadow-sm hover:shadow-md transition-all rounded-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: '#8BA99E' }}
            >
              <Download className="w-5 h-5" />
              Download PDF
            </Button>
            <Button
              onClick={handleClose}
              className="flex-1 h-12 text-base font-body font-medium text-white shadow-sm hover:shadow-md transition-all rounded-xl"
              style={{ backgroundColor: '#4A4A4A' }}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </div>
  );
}
