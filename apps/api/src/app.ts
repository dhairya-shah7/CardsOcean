import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import "./types.js";
import { errorHandler } from "./middleware/error-handler.js";
import { logSensitiveAction } from "./middleware/request-meta.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { checkoutRouter } from "./routes/checkout.js";
import { ordersRouter } from "./routes/orders.js";
import { cardsRouter } from "./routes/cards.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { notificationsRouter } from "./routes/notifications.js";
import { settingsRouter } from "./routes/settings.js";
import { sellerRouter } from "./routes/seller.js";
import { adminRouter } from "./routes/admin.js";
import { metaRouter } from "./routes/meta.js";
import { reviewsRouter } from "./routes/reviews.js";
import { verificationRouter } from "./routes/verification.js";
import { globalLimiter } from "./middleware/rate-limits.js";

export const app = express();

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  if (origin === config.FRONTEND_URL) {
    return true;
  }

  if (config.NODE_ENV !== "development") {
    return false;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local):\d+$/.test(origin);
}

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'none'"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", config.FRONTEND_URL]
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "no-referrer" }
}));

app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(logSensitiveAction);
app.use(globalLimiter);

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/meta", metaRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/admin", adminRouter);
app.use("/api", verificationRouter);
app.use("/api/reviews", reviewsRouter);

app.use(errorHandler);
