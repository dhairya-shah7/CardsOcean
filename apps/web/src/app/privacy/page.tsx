import { PRIVACY_POLICY } from "@/lib/legal-content";
import { LegalDocumentLayout } from "@/components/legal-document-layout";

export const metadata = {
  title: "Privacy Policy | Cards Ocean Prepaid Cards",
  description: "Privacy policy detailing how Cards Ocean collects, encrypts, and protects your personal and financial data."
};

export default function PrivacyPage() {
  return <LegalDocumentLayout document={PRIVACY_POLICY} />;
}
