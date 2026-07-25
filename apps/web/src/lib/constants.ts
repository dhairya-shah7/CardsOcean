import type { Product } from "./types";

export const MIN_CARD_AMOUNT = 1000;
export const MAX_CARD_AMOUNT = 10000;
export const DEFAULT_CARD_AMOUNT = MIN_CARD_AMOUNT;
export const DEFAULT_CURRENCY = "INR";
export const GIFT_CARD_DEDUCTION_RATE = Number(process.env.NEXT_PUBLIC_GIFT_CARD_DEDUCTION_RATE ?? "0.08");

export const FALLBACK_PRODUCTS = [
	{
		id: "4e0c7b6a-2f6d-4d4d-9d4f-3f1c8b0d1a01",
		slug: "aurora-signature",
		title: "Aurora Signature Card",
		subtitle: "A premium virtual card built for elegant gifting.",
		description: "Designed for instant gifting, encrypted delivery, and custom amount control from checkout to reveal.",
		type: "VIRTUAL",
		minAmount: 1000,
		maxAmount: 10000,
		image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80",
		gallery: [],
		verified: true,
		featured: true,
		trendingScore: 100
	},
	{
		id: "7d2ef4a0-7d7d-4a49-8d3f-6d7e5b8f2b02",
		slug: "ember-physical",
		title: "Ember Physical Card",
		subtitle: "A tactile premium card with gift-ready presentation.",
		description: "A physical-first option with the same encrypted fulfillment and trust signals as the digital experience.",
		type: "PHYSICAL",
		minAmount: 1500,
		maxAmount: 10000,
		image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
		gallery: [],
		verified: true,
		featured: true,
		trendingScore: 90
	},
	{
		id: "0c2e5a8f-5f3d-4d2b-9c8f-4f6f6d9c3c03",
		slug: "lumen-gift-collective",
		title: "Lumen Gift Collective",
		subtitle: "A flexible collection for corporate and personal gifting.",
		description: "Built for premium gifting moments when you need a polished storefront even before the live catalog is populated.",
		type: "VIRTUAL",
		minAmount: 2000,
		maxAmount: 10000,
		image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80",
		gallery: [],
		verified: false,
		featured: false,
		trendingScore: 80
	},
	{
		id: "9b7f3c1e-1f2d-4f7f-8a8a-1a2b3c4d5e04",
		slug: "noir-premium",
		title: "Noir Premium Card",
		subtitle: "Dark, minimal, and built for high-trust checkout flows.",
		description: "A minimal showcase card that keeps the storefront visually complete when the backend catalog is empty.",
		type: "PHYSICAL",
		minAmount: 1000,
		maxAmount: 8000,
		image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
		gallery: [],
		verified: false,
		featured: false,
		trendingScore: 70
	},
	{
		id: "c1a4d8e9-3b6f-4f01-8d22-9e4c7a8b0f05",
		slug: "verve-instant",
		title: "Verve Instant Card",
		subtitle: "Quick to buy, quick to reveal, and easy to trust.",
		description: "A polished fallback for the product grid that preserves the luxury look and feel of the storefront.",
		type: "VIRTUAL",
		minAmount: 1000,
		maxAmount: 6000,
		image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
		gallery: [],
		verified: true,
		featured: false,
		trendingScore: 60
	},
	{
		id: "f0e1d2c3-b4a5-4c6d-8e7f-102938475606",
		slug: "velvet-collector",
		title: "Velvet Collector Card",
		subtitle: "A high-end gift card concept with boutique energy.",
		description: "A sixth card to keep the trending section visually balanced until real catalog data is available.",
		type: "PHYSICAL",
		minAmount: 2500,
		maxAmount: 10000,
		image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
		gallery: [],
		verified: false,
		featured: false,
		trendingScore: 50
	}
] satisfies Product[];
