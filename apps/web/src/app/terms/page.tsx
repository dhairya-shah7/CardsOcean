import { TERMS_AND_CONDITIONS } from "@/lib/legal-content";
import { LegalDocumentLayout } from "@/components/legal-document-layout";

export const metadata = {
  title: "Terms & Conditions | Mufin Prepaid Cards",
  description: "Terms and conditions governing the purchase, issuance, and usage of RuPay prepaid gift cards on Mufin."
};

export default function TermsPage() {
  return <LegalDocumentLayout document={TERMS_AND_CONDITIONS} />;
}
