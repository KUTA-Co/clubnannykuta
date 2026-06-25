import { useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

export default function Terms() {
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

      // Check if we need a new page
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
    doc.text("Terms of Service", margin, 30);

    yPos = 55;

    // Content
    addText("1. Acceptance of Terms", 14, true);
    addText("By accessing or using Club Nanny, you agree to be bound by these Terms of Service. If you do not agree, you may not use our services.", 10);
    yPos += 4;

    addText("2. Nature of Services", 14, true);
    addText("Club Nanny provides nanny placement and sitter network services. We connect families and caregivers but are not the employer of any nanny or sitter. All employment or service relationships are solely between families and caregivers. Club Nanny does not employ, supervise, or control any caregiver.", 10);
    yPos += 4;

    addText("3. No Guarantee of Placement", 14, true);
    addText("Submission of an application and payment of fees does not guarantee placement or a successful match. Matching timelines may vary based on availability, qualifications, and preferences.", 10);
    yPos += 4;

    addText("4. Fees & Payment Terms", 14, true);
    addText("An Investment in Your Home: We understand that inviting someone into your home is one of the most important decisions you'll make. Our process is designed to bring clarity, confidence, and peace - so you can focus on what matters most: your family.", 10);
    addText("Families seeking sitter services: Families download the Club Nanny app and pay $20/month to access our carefully vetted, faith-aligned sitter network. Babysitter wages are paid directly by families.", 10);
    addText("Sitters: Application Fee - $45 (non-refundable). This fee covers application review, interview process, background check, and entry into our sitter network. Sitters also pay a $12 first month subscription fee at application submission; this $12 is refunded if the sitter is rejected and serves as the first monthly subscription fee if approved.", 10);
    addText("Families seeking nanny services: Family Application Fee - $250 (annual fee, non-refundable). With your application, you receive a detailed family consultation to learn your values, routines, and specific needs; prayerful consideration as we begin your search; and access to our carefully vetted, faith-aligned nanny network.", 10);
    addText("Nannies: Nanny Application Fee - $75 (non-refundable). This fee covers application review, interview process, background check, and entry into our nanny network.", 10);
    addText("Nanny wages are paid directly by families and are not included in these fees. All fees are non-refundable except the sitter first month subscription fee when a sitter application is rejected.", 10);
    yPos += 4;

    addText("5. Background Checks & Verification", 14, true);
    addText("Club Nanny may conduct background checks and identity verification. By using our service, you consent to these checks. However, background checks are not guaranteed to be complete, accurate, or up-to-date. Club Nanny does not guarantee the safety, reliability, or suitability of any user. Families are responsible for conducting their own due diligence before hiring.", 10);
    yPos += 4;

    addText("6. User Responsibilities", 14, true);
    addText("You agree to: provide accurate and truthful information, maintain confidentiality of login credentials, and communicate respectfully with other users. You may not: misrepresent identity, qualifications, or experience, engage in harassment or inappropriate conduct, or use the platform for unlawful purposes.", 10);
    yPos += 4;

    addText("7. Independent Relationship", 14, true);
    addText("Nothing in this agreement creates an employer-employee relationship or a partnership or joint venture. Club Nanny acts solely as an intermediary platform.", 10);
    yPos += 4;

    addText("8. Limitation of Liability", 14, true);
    addText("To the fullest extent permitted by law, Club Nanny shall not be liable for: any acts, errors, or omissions of families or nannies, injuries, damages, or disputes arising from placements, or loss of income, data, or business opportunities. Use of the service is at your own risk.", 10);
    yPos += 4;

    addText("9. Indemnification", 14, true);
    addText("You agree to indemnify and hold harmless Club Nanny from any claims, damages, or disputes arising out of: your use of the service, your interactions with other users, or any employment relationship formed through the platform.", 10);
    yPos += 4;

    addText("10. Service Availability", 14, true);
    addText("We may modify, suspend, or discontinue any part of the service at any time without notice.", 10);
    yPos += 4;

    addText("11. Governing Law", 14, true);
    addText("These Terms shall be governed by the laws of the State of Alabama.", 10);
    yPos += 4;

    addText("12. Changes to Terms", 14, true);
    addText("We may update these Terms at any time. Material changes will be communicated with reasonable notice.", 10);
    yPos += 4;

    addText("13. Contact", 14, true);
    addText("For questions, contact: Leigh@clubnanny.com", 10);
    yPos += 10;

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text("Last updated: June 23, 2026", margin, yPos);
    doc.text("www.clubnanny.com", pageWidth - margin - 30, yPos);

    doc.save("ClubNanny-Terms-of-Service.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b border-[#E8E5DF]">
          <DialogTitle className="text-3xl font-bold font-heading text-[#4A4A4A]">
            Terms of Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-6 font-body text-[#4A4A4A]/80">
          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using Club Nanny, you agree to be bound by these Terms of Service. If you do not agree, you may not use our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">2. Nature of Services</h2>
            <p className="leading-relaxed mb-3">
              Club Nanny provides nanny placement and sitter network services. We connect families and caregivers but are not the employer of any nanny or sitter.
            </p>
            <p className="leading-relaxed">
              All employment or service relationships are solely between families and caregivers. Club Nanny does not employ, supervise, or control any caregiver.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">3. No Guarantee of Placement</h2>
            <p className="leading-relaxed">
              Submission of an application and payment of fees does not guarantee placement or a successful match. Matching timelines may vary based on availability, qualifications, and preferences.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">4. Fees & Payment Terms</h2>
            <p className="leading-relaxed mb-3">
              <strong>An Investment in Your Home:</strong> We understand that inviting someone into your home is one of the most important decisions you'll make.
              Our process is designed to bring clarity, confidence, and peace - so you can focus on what matters most: your family.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>Families seeking sitter services:</strong> Families download the Club Nanny app and pay $20/month to access our carefully vetted, faith-aligned sitter network.
              Babysitter wages are paid directly by families.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>Sitters: Application Fee - $45 (non-refundable):</strong> This fee covers application review, interview process, background check, and entry into our sitter network.
              Sitters also pay a $12 first month subscription fee at application submission; this $12 is refunded if the sitter is rejected and serves as the first monthly subscription fee if approved.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>Families seeking nanny services: Family Application Fee - $250 (annual fee, non-refundable):</strong> With your application, you receive a detailed family consultation to learn your values, routines, and specific needs; prayerful consideration as we begin your search; and access to our carefully vetted, faith-aligned nanny network.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>Nannies: Nanny Application Fee - $75 (non-refundable):</strong> This fee covers application review, interview process, background check, and entry into our nanny network.
            </p>
            <p className="leading-relaxed">
              Nanny wages are paid directly by families and are not included in these fees. All fees are non-refundable except the sitter first month subscription fee when a sitter application is rejected.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">5. Background Checks & Verification</h2>
            <p className="leading-relaxed mb-3">
              Club Nanny may conduct background checks and identity verification. By using our service, you consent to these checks.
            </p>
            <p className="leading-relaxed mb-3">However:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Background checks are not guaranteed to be complete, accurate, or up-to-date</li>
              <li>Club Nanny does not guarantee the safety, reliability, or suitability of any user</li>
            </ul>
            <p className="leading-relaxed">
              Families are responsible for conducting their own due diligence before hiring.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">6. User Responsibilities</h2>
            <p className="leading-relaxed mb-3">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Provide accurate and truthful information</li>
              <li>Maintain confidentiality of login credentials</li>
              <li>Communicate respectfully with other users</li>
            </ul>
            <p className="leading-relaxed mb-3">You may not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Misrepresent identity, qualifications, or experience</li>
              <li>Engage in harassment or inappropriate conduct</li>
              <li>Use the platform for unlawful purposes</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">7. Independent Relationship</h2>
            <p className="leading-relaxed mb-3">Nothing in this agreement creates:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>An employer-employee relationship</li>
              <li>A partnership or joint venture</li>
            </ul>
            <p className="leading-relaxed">
              Club Nanny acts solely as an intermediary platform.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">8. Limitation of Liability</h2>
            <p className="leading-relaxed mb-3">
              To the fullest extent permitted by law, Club Nanny shall not be liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>Any acts, errors, or omissions of families or nannies</li>
              <li>Injuries, damages, or disputes arising from placements</li>
              <li>Loss of income, data, or business opportunities</li>
            </ul>
            <p className="leading-relaxed">
              Use of the service is at your own risk.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">9. Indemnification</h2>
            <p className="leading-relaxed mb-3">
              You agree to indemnify and hold harmless Club Nanny from any claims, damages, or disputes arising out of:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your use of the service</li>
              <li>Your interactions with other users</li>
              <li>Any employment relationship formed through the platform</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">10. Service Availability</h2>
            <p className="leading-relaxed">
              We may modify, suspend, or discontinue any part of the service at any time without notice.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">11. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms shall be governed by the laws of the State of Alabama.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">12. Changes to Terms</h2>
            <p className="leading-relaxed">
              We may update these Terms at any time. Material changes will be communicated with reasonable notice.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">13. Contact</h2>
            <p className="leading-relaxed">
              For questions, contact: <a href="mailto:Leigh@clubnanny.com" className="text-[#8BA99E] hover:underline">Leigh@clubnanny.com</a>
            </p>
          </div>

          <div className="pt-6 border-t border-[#E8E5DF]">
            <p className="text-sm text-[#4A4A4A]/60">
              Last updated: June 23, 2026
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
