import { config } from "../config.js";

export function getBrandConfig() {
  return {
    name: config.BRAND_NAME,
    logoUrl: config.BRAND_LOGO_URL,
    tagline: config.BRAND_TAGLINE
  };
}

