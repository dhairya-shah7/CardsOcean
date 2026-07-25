import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

export const virtualDetailsCsvPath = resolve(testDir, "../.generated/virtual-card-details.csv");
export const virtualOrdersCsvPath = resolve(testDir, "../.generated/virtual-card-orders.csv");
