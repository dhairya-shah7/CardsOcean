import { CheckoutWizard } from "@/components/checkout-wizard";
import { SectionHeading } from "@/components/section-heading";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Checkout"
        title="Secure multi-step payment flow"
        description="Bill summary, PAN verification, delivery preferences, and payment are handled as explicit steps before issuance."
      />
      <div className="mt-8">
        <CheckoutWizard />
      </div>
    </main>
  );
}
