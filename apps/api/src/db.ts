import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "./config.js";
import { toCsv } from "./utils/csv.js";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const { Pool } = pg;

const snapshotDir = resolve(dirname(fileURLToPath(import.meta.url)), "../.generated");

// CSV snapshots are intentionally separated by purpose so we do not mix
// source-of-truth order exports with fulfillment/detail exports.
const virtualCardOrdersCsvPath = resolve(snapshotDir, "virtual-card-orders.csv");
const virtualCardDetailsCsvPath = resolve(snapshotDir, "virtual-card-details.csv");
const physicalCardOrdersCsvPath = resolve(snapshotDir, "physical-card-orders.csv");
const physicalCardDetailsCsvPath = resolve(snapshotDir, "physical-card-details.csv");
const panVerificationLogsCsvPath = resolve(snapshotDir, "pan-verification-logs.csv");
const localDbPath = resolve(snapshotDir, "db");

const DEFAULT_PRODUCTS = [
  {
    id: "4e0c7b6a-2f6d-4d4d-9d4f-3f1c8b0d1a01",
    slug: "aurora-signature",
    title: "Aurora Signature Card",
    subtitle: "A premium virtual card built for elegant gifting.",
    description: "Designed for instant gifting, encrypted delivery, and custom amount control from checkout to reveal.",
    type: "VIRTUAL",
    minAmount: 1000,
    maxAmount: 10000,
    verified: true,
    featured: true,
    trendingScore: 100,
    status: "APPROVED",
    image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80",
    gallery: []
  },
  {
    id: "7d2ef4a0-7d7d-4a49-8d3f-6d7e5b8f2b02",
    slug: "ember-physical",
    title: "Ember Physical Card",
    subtitle: "A tactile premium card with gift-ready presentation.",
    description: "A physical-first option with the same encrypted fulfillment and trust signals as the digital experience.",
    type: "PHYSICAL",
    minAmount: 1000,
    maxAmount: 10000,
    verified: true,
    featured: true,
    trendingScore: 90,
    status: "APPROVED",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
    gallery: []
  },
  {
    id: "c1a4d8e9-3b6f-4f01-8d22-9e4c7a8b0f05",
    slug: "verve-instant",
    title: "Verve Instant Card",
    subtitle: "Quick to buy, quick to reveal, and easy to trust.",
    description: "A polished fallback for the product grid that preserves the luxury look and feel of the storefront.",
    type: "VIRTUAL",
    minAmount: 1000,
    maxAmount: 10000,
    verified: true,
    featured: false,
    trendingScore: 60,
    status: "APPROVED",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
    gallery: []
  }
];

type RelationDef = {
  table: string;
  localKey: string;
  foreignKey: string;
  many?: boolean;
};

const RELATIONS: Record<string, Record<string, RelationDef>> = {
  cartItem: {
    product: { table: "product", localKey: "productId", foreignKey: "id" }
  },
  order: {
    user: { table: "user", localKey: "userId", foreignKey: "id" },
    address: { table: "address", localKey: "addressId", foreignKey: "id" },
    items: { table: "orderItem", localKey: "id", foreignKey: "orderId", many: true }
  },
  user: {
    addresses: { table: "address", localKey: "id", foreignKey: "userId", many: true }
  },
  orderItem: {
    product: { table: "product", localKey: "productId", foreignKey: "id" }
  }
};

// Proxy helpers for local JSON file DB
async function readTable(tableName: string): Promise<any[]> {
  try {
    await mkdir(localDbPath, { recursive: true });
    const content = await readFile(resolve(localDbPath, `${tableName}.json`), "utf8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    if (tableName === "product") {
      await writeTable(tableName, DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS;
    }
    return parsed;
  } catch {
    if (tableName === "product") {
      await writeTable(tableName, DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS;
    }
    return [];
  }
}

async function writeTable(tableName: string, data: any[]): Promise<void> {
  await mkdir(localDbPath, { recursive: true });
  await writeFile(resolve(localDbPath, `${tableName}.json`), JSON.stringify(data, null, 2), "utf8");
}

function matchesWhere(item: any, where: any): boolean {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (value && typeof value === "object") {
      const valObj = value as any;
      if ("in" in valObj) {
        if (!Array.isArray(valObj.in)) return false;
        if (!valObj.in.includes(item[key])) return false;
      } else if ("not" in valObj) {
        if (item[key] === valObj.not) return false;
      } else if ("contains" in valObj) {
        if (typeof item[key] !== "string" || !(item[key] as string).includes(valObj.contains as string)) return false;
      } else {
        if (!matchesWhere(item[key], value)) return false;
      }
    } else {
      if (value === false && (item[key] === undefined || item[key] === null)) {
        continue;
      }
      if (item[key] !== value) return false;
    }
  }
  return true;
}

async function resolveRelation(tableName: string, item: any, relationName: string, relationDef: RelationDef) {
  const relatedItems = await readTable(relationDef.table);
  if (relationDef.many) {
    return relatedItems.filter((related) => related[relationDef.foreignKey] === item[relationDef.localKey]);
  }
  return relatedItems.find((related) => related[relationDef.foreignKey] === item[relationDef.localKey]) ?? null;
}

async function applyIncludes(items: any[], tableName: string, include: Record<string, unknown> | undefined) {
  if (!include) return items;
  const relations = RELATIONS[tableName];
  if (!relations) return items;

  return Promise.all(
    items.map(async (item) => {
      const enriched = { ...item };
      for (const [relationName, shouldInclude] of Object.entries(include)) {
        if (!shouldInclude || !relations[relationName]) continue;
        enriched[relationName] = await resolveRelation(tableName, item, relationName, relations[relationName]);
      }
      return enriched;
    })
  );
}

function applySelect(items: any[], select: Record<string, unknown> | undefined) {
  if (!select) return items;
  const keys = Object.keys(select).filter((key) => select[key]);
  return items.map((item) => {
    const picked: Record<string, unknown> = {};
    for (const key of keys) {
      picked[key] = item[key];
    }
    return picked;
  });
}

async function finalizeQueryResults(items: any[], tableName: string, queryArgs: any) {
  let results = items;
  if (queryArgs.include) {
    results = await applyIncludes(results, tableName, queryArgs.include);
  }
  if (queryArgs.select) {
    results = applySelect(results, queryArgs.select);
  }
  return results;
}

function applyOrderBy(items: any[], orderBy: any) {
  if (!orderBy) return items;
  const orderList = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...items].sort((a, b) => {
    for (const order of orderList) {
      const [key, direction] = Object.entries(order)[0];
      const valA = a[key];
      const valB = b[key];
      if (valA === valB) continue;
      const isAsc = direction === "asc";
      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
    }
    return 0;
  });
}

function applyTake(items: any[], take: number | undefined) {
  if (take === undefined) return items;
  return items.slice(0, take);
}

function createModelProxy(tableName: string) {
  return new Proxy({}, {
    get(target, prop) {
      const method = prop as string;
      return async (...args: any[]) => {
        const queryArgs = args[0] || {};
        let items = await readTable(tableName);

        if (method === "findMany") {
          let matched = items.filter(item => matchesWhere(item, queryArgs.where));
          matched = applyOrderBy(matched, queryArgs.orderBy);
          matched = applyTake(matched, queryArgs.take);
          return finalizeQueryResults(matched, tableName, queryArgs);
        }
        
        if (method === "findUnique" || method === "findFirst" || method === "findUniqueOrThrow") {
          const matched = items.find(item => matchesWhere(item, queryArgs.where));
          if (!matched && method === "findUniqueOrThrow") {
            throw new Error(`Record not found in table ${tableName}`);
          }
          if (!matched) return null;
          const [result] = await finalizeQueryResults([matched], tableName, queryArgs);
          return result ?? null;
        }

        if (method === "count") {
          return items.filter(item => matchesWhere(item, queryArgs.where)).length;
        }

        if (method === "create") {
          const newItem = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...(tableName === "cartItem" ? { savedForLater: false } : {}),
            ...queryArgs.data
          };
          items.push(newItem);
          await writeTable(tableName, items);
          const [result] = await finalizeQueryResults([newItem], tableName, queryArgs);
          return result ?? newItem;
        }

        if (method === "createMany") {
          const dataArray = Array.isArray(queryArgs.data) ? queryArgs.data : [queryArgs.data];
          const createdItems = dataArray.map((data: any) => ({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data
          }));
          items.push(...createdItems);
          await writeTable(tableName, items);
          return { count: createdItems.length };
        }

        if (method === "update") {
          const index = items.findIndex(item => matchesWhere(item, queryArgs.where));
          if (index === -1) {
            throw new Error(`Record to update not found in table ${tableName}`);
          }
          const updatedItem = {
            ...items[index],
            ...queryArgs.data,
            updatedAt: new Date().toISOString()
          };
          items[index] = updatedItem;
          await writeTable(tableName, items);
          return updatedItem;
        }

        if (method === "updateMany") {
          let count = 0;
          items = items.map(item => {
            if (matchesWhere(item, queryArgs.where)) {
              count++;
              return {
                ...item,
                ...queryArgs.data,
                updatedAt: new Date().toISOString()
              };
            }
            return item;
          });
          await writeTable(tableName, items);
          return { count };
        }

        if (method === "upsert") {
          const index = items.findIndex(item => matchesWhere(item, queryArgs.where));
          if (index !== -1) {
            const updatedItem = {
              ...items[index],
              ...queryArgs.update,
              updatedAt: new Date().toISOString()
            };
            items[index] = updatedItem;
            await writeTable(tableName, items);
            return updatedItem;
          } else {
            const newItem = {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...queryArgs.create
            };
            items.push(newItem);
            await writeTable(tableName, items);
            return newItem;
          }
        }

        if (method === "delete") {
          const index = items.findIndex(item => matchesWhere(item, queryArgs.where));
          if (index === -1) {
            throw new Error(`Record to delete not found in table ${tableName}`);
          }
          const deleted = items[index];
          items.splice(index, 1);
          await writeTable(tableName, items);
          return deleted;
        }

        if (method === "deleteMany") {
          const beforeCount = items.length;
          items = items.filter(item => !matchesWhere(item, queryArgs.where));
          await writeTable(tableName, items);
          return { count: beforeCount - items.length };
        }

        throw new Error(`Unsupported method ${method} on fallback db table ${tableName}`);
      };
    }
  });
}

const fallbackPrisma = new Proxy({}, {
  get(target, prop) {
    if (prop === "$transaction") {
      return async (promises: any) => {
        if (typeof promises === "function") {
          return promises(fallbackPrisma);
        }
        return Promise.all(promises);
      };
    }
    if (prop === "$disconnect") {
      return async () => {};
    }
    if (prop === "$connect") {
      return async () => {};
    }
    return createModelProxy(prop as string);
  }
});

// Determine DB selection on startup
let pgConnected = false;
let prismaPgInstance: any = null;
let pgPool: pg.Pool | undefined = undefined;

function isConnectionError(err: any): boolean {
  const errMsg = err?.message || "";
  const errCode = err?.code || "";
  return (
    errCode === "ECONNREFUSED" ||
    errCode === "57P01" || // admin_shutdown
    errCode === "57P02" || // crash_shutdown
    errCode === "57P03" || // cannot_connect_now
    errMsg.includes("connection") ||
    errMsg.includes("connect") ||
    errMsg.includes("refused") ||
    errMsg.includes("adapter") ||
    errMsg.includes("terminated")
  );
}

if (config.DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: config.DATABASE_URL,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });
    const client = await pgPool.connect();
    client.release();
    pgConnected = true;
    prismaPgInstance = new PrismaClient({
      datasources: {
        db: {
          url: config.DATABASE_URL
        }
      }
    });
  } catch (error: any) {
    console.warn("⚠️ PostgreSQL connection failed at startup. Falling back to local file database.");
    if (pgPool) {
      void pgPool.end().catch(() => {});
      pgPool = undefined;
    }
  }
}

export const secondaryDb = fallbackPrisma;
export const primaryDb = prismaPgInstance ?? fallbackPrisma;

export const prisma = new Proxy({}, {
  get(target, prop) {
    const modelName = prop as string;

    if (modelName.startsWith("$")) {
      return async (...args: any[]) => {
        if (prismaPgInstance) {
          try {
            const method = prismaPgInstance[modelName];
            if (typeof method === "function") {
              return await method.apply(prismaPgInstance, args);
            }
          } catch (err: any) {
            if (isConnectionError(err)) {
              console.warn(`⚠️ PostgreSQL operation ${modelName} failed, falling back to local file database. Error:`, err?.message);
              prismaPgInstance = null;
            } else {
              throw err;
            }
          }
        }
        const method = (fallbackPrisma as any)[modelName];
        if (typeof method === "function") {
          return await method.apply(fallbackPrisma, args);
        }
      };
    }

    return new Proxy({}, {
      get(modelTarget, prop2) {
        const method = prop2 as string;
        return async (...args: any[]) => {
          if (prismaPgInstance) {
            try {
              const modelObj = prismaPgInstance[modelName];
              if (modelObj && typeof modelObj[method] === "function") {
                return await modelObj[method](...args);
              }
            } catch (err: any) {
              if (isConnectionError(err)) {
                console.warn(`⚠️ PostgreSQL connection lost. Falling back to local file database for ${modelName}.${method}.`);
                prismaPgInstance = null;
              } else {
                throw err;
              }
            }
          }

          // Use fallback database
          const modelObj = (fallbackPrisma as any)[modelName];
          if (modelObj && typeof modelObj[method] === "function") {
            return await modelObj[method](...args);
          }
          throw new Error(`Unsupported method ${method} on fallback DB table ${modelName}`);
        };
      }
    });
  }
}) as any;

export { physicalCardOrdersCsvPath, physicalCardDetailsCsvPath, virtualCardDetailsCsvPath, panVerificationLogsCsvPath };

export function formatLocalDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return "";
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatLocalTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return "";
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function escapeCsvValue(val: string): string {
  const escaped = String(val ?? "").replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

const VIRTUAL_ORDER_HEADERS = [
  "Order ID",
  "Customer Name",
  "Email",
  "Mobile Number",
  "Card Reference Id",
  "Amount",
  "Number of Cards",
  "Order Date"
];

const PHYSICAL_ORDER_HEADERS = [
  "Order ID",
  "Customer Name",
  "Email",
  "Mobile Number",
  "PAN Number",
  "Cardholder Name",
  "Gender",
  "Date of Birth",
  "Amount",
  "Number of Cards",
  "Address Line 1",
  "Address Line 2",
  "City",
  "State",
  "Postal Code",
  "Country",
  "Order Date"
];

export function formatDobDdmmyyyy(dob: string | null | undefined): string {
  if (!dob) return "";
  const trimmed = dob.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    return `${day}${month}${year}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return `${day}${month}${year}`;
  }
  if (/^\d{8}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.replace(/[^0-9]/g, "");
}

export function formatGenderCode(gender: string | null | undefined): string {
  if (!gender) return "";
  const normalized = gender.trim().toLowerCase();
  if (normalized === "male" || normalized === "m") return "M";
  if (normalized === "female" || normalized === "f") return "F";
  return "";
}

function buildLoadingFormatRow(serialNo: number, details: {
  name: string;
  dob?: string;
  gender?: string;
  mobileNumber: string;
  pan: string;
  topupAmount: number;
  email: string;
  referenceNo: string;
}) {
  return [
    String(serialNo),
    details.name,
    formatDobDdmmyyyy(details.dob),
    formatGenderCode(details.gender),
    details.mobileNumber,
    details.pan,
    String(details.topupAmount),
    details.email,
    details.referenceNo
  ].map(escapeCsvValue).join(",") + "\n";
}

async function countCsvDataRows(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, "utf8");
    return content.trim().split(/\r?\n/).filter((line, index) => index > 0 && line.trim().length > 0).length;
  } catch {
    return 0;
  }
}

function buildPhysicalOrderRow(details: {
  orderId: string;
  customerName: string;
  email: string;
  mobileNumber: string;
  panNumber: string;
  cardHolderName?: string;
  gender?: string;
  dob?: string;
  amount: number;
  numberOfCards: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  orderDate: string;
}) {
  return [
    details.orderId,
    details.customerName,
    details.email,
    details.mobileNumber,
    details.panNumber,
    details.cardHolderName || details.customerName,
    details.gender || "",
    details.dob || "",
    String(details.amount),
    String(details.numberOfCards),
    details.addressLine1,
    details.addressLine2,
    details.city,
    details.state,
    details.postalCode,
    details.country,
    details.orderDate
  ].map(escapeCsvValue).join(",") + "\n";
}

function buildVirtualOrderRow(details: {
  orderId: string;
  customerName: string;
  email: string;
  mobileNumber: string;
  cardReferenceId: string;
  amount: number;
  numberOfCards: number;
  orderDate: string;
}) {
  return [
    details.orderId,
    details.customerName,
    details.email,
    details.mobileNumber,
    details.cardReferenceId,
    String(details.amount),
    String(details.numberOfCards),
    details.orderDate
  ].map(escapeCsvValue).join(",") + "\n";
}

async function appendCsvRow(filePath: string, headers: string[], row: string) {
  let fileExists = false;
  try {
    await readFile(filePath, "utf8");
    fileExists = true;
  } catch {
    fileExists = false;
  }

  if (!fileExists) {
    const csvHeader = headers.map(escapeCsvValue).join(",") + "\n";
    await writeFile(filePath, csvHeader + row, "utf8");
  } else {
    await writeFile(filePath, row, { flag: "a", encoding: "utf8" });
  }
}


export async function appendPhysicalOrderCsv(details: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPan: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  amount: number;
  numberOfCards: number;
  cardHolderName?: string;
  gender?: string;
  dob?: string;
}) {
  await mkdir(snapshotDir, { recursive: true });

  const rowDetails = {
    orderId: details.orderId,
    customerName: details.customerName,
    email: details.customerEmail,
    mobileNumber: details.customerPhone,
    panNumber: details.customerPan,
    cardHolderName: details.cardHolderName,
    gender: details.gender,
    dob: details.dob,
    amount: details.amount,
    numberOfCards: details.numberOfCards,
    addressLine1: details.addressLine1,
    addressLine2: details.addressLine2,
    city: details.city,
    state: details.state,
    postalCode: details.postalCode,
    country: details.country,
    orderDate: new Date().toISOString()
  };

  const csvRow = buildPhysicalOrderRow(rowDetails);
  await appendCsvRow(physicalCardOrdersCsvPath, PHYSICAL_ORDER_HEADERS, csvRow);
}

export const appendPhysicalCsv = appendPhysicalOrderCsv;

const LOAD_VIRTUAL_HEADERS = [
  "Name on Card",
  "Mobile Number",
  "Card Number",
  "Expiry Date",
  "CVV",
  "OTP",
  "Pin",
  "Card Reference Id",
  "Amount",
  "Current Balance"
];

const LOAD_PHYSICAL_HEADERS = [
  "Name on Card",
  "Mobile Number",
  "Card Number",
  "Expiry Date",
  "CVV",
  "Card Reference Id",
  "Amount",
  "Current Balance"
];

function buildVirtualFormatRow(details: {
  cardHolderName: string;
  mobileNumber: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  otp: string;
  pin: string;
  cardReferenceId: string;
  amount: number;
  currentBalance: string;
}) {
  return [
    details.cardHolderName,
    details.mobileNumber,
    details.cardNumber,
    details.expiryDate,
    details.cvv,
    details.otp,
    details.pin,
    details.cardReferenceId,
    `₹${details.amount}`,
    details.currentBalance
  ].map(escapeCsvValue).join(",") + "\n";
}

function buildPhysicalFormatRow(details: {
  cardHolderName: string;
  mobileNumber: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardReferenceId: string;
  amount: number;
  currentBalance: string;
}) {
  return [
    details.cardHolderName,
    details.mobileNumber,
    details.cardNumber,
    details.expiryDate,
    details.cvv,
    details.cardReferenceId,
    `₹${details.amount}`,
    details.currentBalance
  ].map(escapeCsvValue).join(",") + "\n";
}

export async function appendVirtualCardCsv(details: {
  cardHolderName: string;
  mobileNumber: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  otp?: string;
  pin?: string;
  cardReferenceId: string;
  amount: number;
  currentBalance?: string;
}) {
  await mkdir(snapshotDir, { recursive: true });

  let fileExists = false;
  try {
    await readFile(virtualCardDetailsCsvPath, "utf8");
    fileExists = true;
  } catch {
    fileExists = false;
  }

  if (!fileExists) {
    const csvHeader = LOAD_VIRTUAL_HEADERS.map(escapeCsvValue).join(",") + "\n";
    await writeFile(virtualCardDetailsCsvPath, csvHeader, "utf8");
  }
}

export async function appendVirtualCardOrderCsv(details: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cardReferenceId: string;
  amount: number;
  numberOfCards: number;
}) {
  await mkdir(snapshotDir, { recursive: true });

  const rowDetails = {
    orderId: details.orderId,
    customerName: details.customerName,
    email: details.customerEmail,
    mobileNumber: details.customerPhone,
    cardReferenceId: details.cardReferenceId,
    amount: details.amount,
    numberOfCards: details.numberOfCards,
    orderDate: new Date().toISOString()
  };

  const csvRow = buildVirtualOrderRow(rowDetails);
  await appendCsvRow(virtualCardOrdersCsvPath, VIRTUAL_ORDER_HEADERS, csvRow);
}

export async function appendPhysicalCardDetailsCsv(details: {
  cardHolderName: string;
  mobileNumber: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardReferenceId: string;
  amount: number;
  currentBalance?: string;
}) {
  await mkdir(snapshotDir, { recursive: true });

  let fileExists = false;
  try {
    await readFile(physicalCardDetailsCsvPath, "utf8");
    fileExists = true;
  } catch {
    fileExists = false;
  }

  if (!fileExists) {
    const csvHeader = LOAD_PHYSICAL_HEADERS.map(escapeCsvValue).join(",") + "\n";
    await writeFile(physicalCardDetailsCsvPath, csvHeader, "utf8");
  }
}

export async function appendVerifyCsv(details: {
  userId: string;
  email: string;
  mobileNumber: string;
  panNumber: string;
  status: string;
  date: string;
}) {
  await mkdir(snapshotDir, { recursive: true });

  const headers = [
    "User ID", "Email", "Mobile Number", "PAN Number", "Status", "Date", "Time"
  ];

  const formattedDate = formatLocalDate(details.date);
  const formattedTime = formatLocalTime(details.date);

  const rowData = [
    details.userId,
    details.email,
    details.mobileNumber,
    details.panNumber,
    details.status,
    formattedDate,
    formattedTime
  ];

  const csvRow = rowData.map(escapeCsvValue).join(",") + "\n";

  let fileExists = false;
  try {
    await readFile(panVerificationLogsCsvPath, "utf8");
    fileExists = true;
  } catch {
    fileExists = false;
  }

  if (!fileExists) {
    const csvHeader = headers.map(escapeCsvValue).join(",") + "\n";
    await writeFile(panVerificationLogsCsvPath, csvHeader + csvRow, "utf8");
  } else {
    const content = await readFile(panVerificationLogsCsvPath, "utf8").catch(() => "");
    if (!content.startsWith("User ID,Email,Mobile Number,")) {
      const csvHeader = headers.map(escapeCsvValue).join(",") + "\n";
      await writeFile(panVerificationLogsCsvPath, csvHeader + csvRow, "utf8");
    } else {
      await writeFile(panVerificationLogsCsvPath, csvRow, { flag: "a", encoding: "utf8" });
    }
  }
}

export const loadVirtualOrdersCsvPath = virtualCardOrdersCsvPath;
export const loadVirtualDetailsCsvPath = virtualCardDetailsCsvPath;
export const loadPhysicalOrdersCsvPath = physicalCardOrdersCsvPath;
export const loadPhysicalDetailsCsvPath = physicalCardDetailsCsvPath;


