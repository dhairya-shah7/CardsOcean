export type BrandConfig = {
  name: string;
  logoUrl: string;
  tagline: string;
};

export type ProductType = "VIRTUAL" | "PHYSICAL";
export type CardStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type DeliveryStatus = "PENDING" | "PROCESSING" | "DELIVERED";

export type Product = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  type: ProductType;
  minAmount: number;
  maxAmount: number;
  image?: string | null;
  gallery?: string[];
  verified: boolean;
  featured: boolean;
  trendingScore: number;
  status?: string;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  message: string;
  createdAt: string;
  user?: {
    name: string;
  };
};

export type Card = {
  id: string;
  cardNumberMasked?: string;
  balance: number;
  cardType: ProductType;
  status: CardStatus;
  expiryDate: string;
  revealCount: number;
  lastRevealedAt?: string | null;
  product?: Product;
  createdAt: string;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  amount: number;
  cardType: ProductType;
  savedForLater?: boolean;
  product: Product | null;
};

export type OrderItem = {
  id: string;
  title: string;
  quantity: number;
  amount: number;
  cardType: ProductType;
};

export type Order = {
  id: string;
  giftCardFaceValue?: number;
  deductionRate?: number;
  deductionAmount?: number;
  finalCreditedAmount?: number;
  totalAmount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  deliveryMethod?: "VIRTUAL" | "PHYSICAL";
  createdAt: string;
  items?: OrderItem[];
  cards?: Card[];
};
