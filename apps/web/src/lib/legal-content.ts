export interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

export interface LegalDocument {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const TERMS_AND_CONDITIONS: LegalDocument = {
  title: "Terms & Conditions",
  subtitle: "Terms governing your access to and use of Cards Ocean RuPay Prepaid & Gift Cards",
  lastUpdated: "July 25, 2026",
  sections: [
    {
      id: "introduction",
      title: "1. Acceptance of Terms & Introduction",
      content: [
        "Welcome to Cards Ocean ('we', 'us', 'our', or the 'Platform'). By accessing, browsing, registering for, or using our website and services (collectively, the 'Services'), you ('User', 'you', or 'Cardholder') acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions ('Terms').",
        "Cards Ocean is a premium fintech marketplace providing custom-value prepaid digital and physical gift cards operating on the RuPay payment network in compliance with applicable guidelines issued by the Reserve Bank of India (RBI) and National Payments Corporation of India (NPCI).",
        "If you do not agree with any part of these Terms, you must immediately discontinue your access to and use of the Platform and Services."
      ]
    },
    {
      id: "eligibility",
      title: "2. User Eligibility & Identity Verification",
      content: [
        "To purchase or redeem gift cards on Cards Ocean, you must be an individual at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872.",
        "Cards Ocean operates a streamlined, high-trust verification flow. Depending on the transaction value and regulatory thresholds, purchases may be subject to dual-factor authentication using SMS One-Time Password (OTP), Email OTP, and real-time Permanent Account Number (PAN) validation.",
        "You represent and warrant that all information provided during checkout—including recipient name, mobile number, email address, and PAN card details—is accurate, current, and complete. Submitting false, spoofed, or fraudulent identity information is strictly prohibited."
      ]
    },
    {
      id: "gift-card-issuance",
      title: "3. RuPay Gift Card Issuance & Denominations",
      content: [
        "Cards Ocean enables users to purchase pre-loaded virtual and physical RuPay gift cards within customizable denomination bounds ranging from ₹1,000 up to ₹10,000 per card (or as permitted by regulatory limits).",
        "Virtual cards (e.g., Aurora, Lumen, Verve) are delivered digitally to the designated recipient's email address and/or mobile number upon successful transaction authorization.",
        "Physical cards (e.g., Ember, Noir, Velvet) are dispatched to the validated domestic shipping address provided during checkout.",
        "Cards issued via Cards Ocean are pre-funded non-reloadable prepaid instruments (PPI) powered by RuPay. They can be used for merchant payments across participating physical point-of-sale (POS) terminals and online e-commerce gateways within India supporting RuPay prepaid card acceptance."
      ]
    },
    {
      id: "pricing-fees",
      title: "4. Pricing, Convenience & Processing Fees",
      content: [
        "The total order cost on Cards Ocean comprises the card face value, applicable convenience rate, and processing fees.",
        "Virtual Delivery Convenience Rate: A 2.5% convenience rate is applied to virtual card purchases to cover end-to-end cryptographic encryption, instant provisioning infrastructure, and digital delivery.",
        "Physical Delivery Convenience Rate: A 3.0% convenience rate is applied to physical card orders to cover tactile packaging, card printing, secure vault dispatch, and premium logistics.",
        "Standard Processing Rate: An 8.0% platform processing fee applies across all orders to support real-time ledger settlement, card network provisioning, and gateway integration costs.",
        "All fees are transparently displayed in the bill summary before order submission and payment authorization."
      ]
    },
    {
      id: "card-security-reveal",
      title: "5. Card Security & Rate-Limited Secret Reveal",
      content: [
        "Sensitve credentials associated with your digital card (such as full 16-digit card numbers, expiration dates, and Card Verification Values/CVVs) are stored using bank-grade AES-256 cryptographic encryption.",
        "Decryption and viewing of card credentials ('Secret Reveal') through your user dashboard requires explicit, rate-limited user action. Each reveal event is audit-logged and monitored for suspicious activity.",
        "You are solely responsible for maintaining the confidentiality of your card credentials, account credentials, and OTP verification codes. Cards Ocean will never ask for your CVV or account password via telephone or unprompted messages. Never share your card details with unauthorized third parties."
      ]
    },
    {
      id: "validity-expiry",
      title: "6. Validity, Expiration & Usage Rules",
      content: [
        "Each RuPay gift card issued through Cards Ocean carries a defined validity period, clearly stated on the card surface or digital card dashboard (typically up to 12 months from the date of issuance).",
        "Cards automatically expire on the designated expiration date. Upon expiry, any unused residual balance on non-reloadable gift cards shall be handled strictly in accordance with RBI guidelines for prepaid payment instruments.",
        "Cards cannot be redeemed for cash, transferred for cash equivalent, used at automated teller machines (ATMs) for cash withdrawal, or used for illegal transactions, illegal gambling, or money laundering."
      ]
    },
    {
      id: "prohibited-conduct",
      title: "7. Prohibited Conduct & Account Safeguards",
      content: [
        "Users agree not to: (a) use automated bots, scrapers, or reverse-engineering tools to access the Platform; (b) attempt to bypass DevTools guards, rate limits, or encryption mechanisms; (c) use stolen payment instruments or fraudulent PAN details; (d) resell gift cards commercially without explicit written authorization from Cards Ocean.",
        "Cards Ocean reserves the right to immediately suspend or terminate any account, decline card issuance, or freeze access to suspicious cards if fraud, money laundering, or breach of these Terms is detected."
      ]
    },
    {
      id: "intellectual-property",
      title: "8. Intellectual Property Rights",
      content: [
        "All content, logos, trademarks, card designs, UI layouts, source code, and visual styling on Cards Ocean are the exclusive property of Cards Ocean or its licensors and are protected under Indian and international intellectual property laws.",
        "RuPay is a registered trademark of National Payments Corporation of India (NPCI). All other brand names and logos belong to their respective owners."
      ]
    },
    {
      id: "limitation-liability",
      title: "9. Limitation of Liability & Disclaimers",
      content: [
        "The Services are provided on an 'AS IS' and 'AS AVAILABLE' basis without warranties of any kind, whether express or implied.",
        "To the maximum extent permitted by law, Cards Ocean shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising out of or related to your use of the Services, third-party gateway outages, or merchant terminal rejections.",
        "Cards Ocean's total cumulative liability for any claim arising out of these Terms shall not exceed the total processing fees paid by you to Cards Ocean for the transaction giving rise to the claim."
      ]
    },
    {
      id: "governing-law",
      title: "10. Governing Law & Dispute Resolution",
      content: [
        "These Terms shall be governed by and construed in accordance with the laws of the Republic of India.",
        "Any legal suit, action, or proceeding arising out of or relating to these Terms or the Platform shall be instituted exclusively in the competent courts located in Mumbai, Maharashtra, India."
      ]
    },
    {
      id: "contact-info",
      title: "11. Contact & Notice",
      content: [
        "For any questions, legal notices, or support inquiries concerning these Terms, please contact our Legal & Compliance Desk at legal@cardsocean.com or support@cardsocean.com."
      ]
    }
  ]
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  subtitle: "How Cards Ocean collects, uses, protects, and discloses your personal data",
  lastUpdated: "July 25, 2026",
  sections: [
    {
      id: "privacy-overview",
      title: "1. Overview & Data Philosophy",
      content: [
        "At Cards Ocean, protecting your privacy and securing your personal financial data is fundamental to our platform philosophy. This Privacy Policy describes how Cards Ocean collects, stores, uses, processes, and protects your information when you visit our website, mobile application, or purchase our RuPay gift cards.",
        "By using Cards Ocean, you consent to the data collection and processing practices described in this Privacy Policy. We adhere strictly to the Digital Personal Data Protection (DPDP) Act of India and relevant RBI cybersecurity frameworks."
      ]
    },
    {
      id: "data-collection",
      title: "2. Information We Collect",
      content: [
        "Personal Identifiers: Name, mobile number, email address, date of birth, and recipient delivery address for physical card shipping.",
        "Identity Verification Data: Permanent Account Number (PAN) details submitted during checkout for real-time compliance and anti-fraud validation.",
        "Transaction & Financial Information: Card purchase amounts, selected card types (virtual vs physical), order timestamps, payment transaction IDs, and cryptographic hashes of generated card ledgers.",
        "Technical & Usage Data: IP address, browser type, device identifiers, session cookies, rate-limit access logs, and security telemetry."
      ]
    },
    {
      id: "data-usage",
      title: "3. How We Use Your Information",
      content: [
        "To provision, activate, and deliver digital and physical RuPay gift cards to designated recipients.",
        "To perform real-time identity checks, dual-factor SMS/Email OTP verification, and anti-fraud PAN validations.",
        "To secure card credentials and manage rate-limited secret reveal actions in your user dashboard.",
        "To send transaction confirmations, delivery updates, security alerts, and customer support communications.",
        "To comply with statutory financial regulations, anti-money laundering (AML) directives, and lawful law enforcement requests."
      ]
    },
    {
      id: "data-security",
      title: "4. Cryptography & Data Security",
      content: [
        "We implement bank-grade security protocols to protect your personal and card data against unauthorized access, alteration, disclosure, or destruction.",
        "Sensitive information—including full 16-digit card numbers, CVVs, and balance ledgers—is encrypted at rest using AES-256 encryption and transmitted over TLS 1.3 encrypted channels.",
        "Our web client incorporates DevTools guards, anti-bot signature verification, and automated rate limiting to prevent unauthorized credential harvesting."
      ]
    },
    {
      id: "data-sharing",
      title: "5. Information Sharing & Third Parties",
      content: [
        "We do not sell, rent, or trade your personal data to third-party marketers.",
        "We share limited necessary data only with trusted operational partners strictly for fulfillment: (a) Banking and Card Network Partners (RuPay/NPCI) for card issuance and network routing; (b) Verified Payment Gateways for order processing; (c) SMS and Email Telephony Gateways for OTP delivery; (d) Logistics Partners for physical card delivery.",
        "We may disclose information if required to do so by law, court order, or governmental authority."
      ]
    },
    {
      id: "data-retention",
      title: "6. Data Retention & Storage",
      content: [
        "We retain personal information and transaction records only for as long as necessary to fulfill the purposes outlined in this policy or as required by applicable Indian banking and tax laws.",
        "When data is no longer required, it is securely purged or anonymized using industry-standard cryptographic sanitization techniques."
      ]
    },
    {
      id: "cookies-tracking",
      title: "7. Cookies & Session Management",
      content: [
        "Cards Ocean utilizes essential session cookies and local storage tokens to maintain authenticated states, secure checkout wizard progress, and prevent CSRF attacks.",
        "We do not use invasive third-party tracking pixels or behavioral profiling cookies."
      ]
    },
    {
      id: "user-rights",
      title: "8. Your Rights & Grievance Redressal",
      content: [
        "You have the right to request access to your personal data, request corrections to inaccurate information, or request account closure, subject to statutory record-retention requirements.",
        "In accordance with Indian Information Technology rules, if you have any questions, concerns, or grievances regarding data privacy, you may reach our Grievance Officer at privacy@cardsocean.com or write to: Grievance Officer, Cards Ocean Fintech Services, Mumbai, Maharashtra, India."
      ]
    },
    {
      id: "policy-updates",
      title: "9. Updates to This Privacy Policy",
      content: [
        "We may update this Privacy Policy periodically to reflect operational, legal, or regulatory changes. The 'Last Updated' date at the top of this policy indicates when changes were last published.",
        "Continued use of Cards Ocean after changes become effective constitutes your acknowledgment and acceptance of the revised policy."
      ]
    }
  ]
};
