import fs from "fs";
import path from "path";
import { 
  UserProfile, 
  Wallet, 
  Category, 
  Budget, 
  Transaction, 
  TransactionItem, 
  TelegramAccount,
  UserRole,
  UserStatus
} from "@/types";
import { 
  INITIAL_USER, 
  INITIAL_ADMIN,
  INITIAL_USERS,
  INITIAL_WALLETS, 
  INITIAL_CATEGORIES, 
  INITIAL_BUDGETS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_TRANSACTION_ITEMS 
} from "@/lib/store";

export interface TelegramConfigState {
  botToken: string | null;
  mode: "polling" | "webhook" | "idle";
  isConnected: boolean;
  botInfo: {
    id?: number;
    first_name?: string;
    username?: string;
    can_join_groups?: boolean;
  } | null;
  webhookUrl: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  isPollingActive?: boolean;
}

export interface ServerDBData {
  user: UserProfile; // active default user
  users: UserProfile[]; // all registered users
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  telegramConfig: TelegramConfigState;
  telegramLinks: Array<{
    chatId: number;
    telegramUserId: number;
    telegramUsername: string | null;
    firstName: string | null;
    userId: string;
    linkedAt: string;
  }>;
  processedUpdateIds: number[];
}

const DB_PATH = path.join(process.cwd(), "data", "tatadana_db.json");

function getDefaultDB(): ServerDBData {
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  const isMockToken = !envToken || envToken.includes("AAExampleTataDanaBotTokenMock") || envToken.includes("mock");

  return {
    user: INITIAL_USER,
    users: INITIAL_USERS,
    wallets: INITIAL_WALLETS,
    categories: INITIAL_CATEGORIES,
    budgets: INITIAL_BUDGETS,
    transactions: INITIAL_TRANSACTIONS,
    transactionItems: INITIAL_TRANSACTION_ITEMS,
    telegramConfig: {
      botToken: isMockToken ? null : envToken,
      mode: "idle",
      isConnected: false,
      botInfo: null,
      webhookUrl: null,
      lastConnectedAt: null,
      lastError: null,
      isPollingActive: false,
    },
    telegramLinks: [],
    processedUpdateIds: [],
  };
}

let memoryCache: ServerDBData | null = null;

export function getServerDB(): ServerDBData {
  if (memoryCache) return memoryCache;

  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      memoryCache = JSON.parse(content);
      // Migration: ensure users array exists
      if (!Array.isArray(memoryCache!.users) || memoryCache!.users.length === 0) {
        memoryCache!.users = INITIAL_USERS;
        saveServerDB(memoryCache!);
      }
      return memoryCache!;
    }
  } catch (err) {
    console.warn("[server-store] Failed to read tatadana_db.json, initializing fresh store:", err);
  }

  const defaultData = getDefaultDB();
  saveServerDB(defaultData);
  return defaultData;
}

export function saveServerDB(data: ServerDBData): void {
  memoryCache = data;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[server-store] Failed to write tatadana_db.json:", err);
  }
}

// ================= USER & RBAC MANAGEMENT =================

export function getAllUsers(): UserProfile[] {
  const db = getServerDB();
  return db.users || [];
}

export function getUserById(id: string): UserProfile | undefined {
  const db = getServerDB();
  return db.users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): UserProfile | undefined {
  const db = getServerDB();
  const cleanEmail = email.toLowerCase().trim();
  return db.users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
}

export function registerNewUser(data: {
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  profession?: string;
}): { success: boolean; user?: UserProfile; error?: string } {
  const db = getServerDB();
  const cleanEmail = data.email.toLowerCase().trim();

  // Check uniqueness
  const existing = db.users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
  if (existing) {
    return {
      success: false,
      error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk dengan akun Anda.",
    };
  }

  const nowIso = new Date().toISOString();
  const newUser: UserProfile = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    full_name: data.fullName.trim() || "Pengguna Baru",
    avatar_url: null,
    phone_number: data.phoneNumber ? data.phoneNumber.trim() : null,
    phone_verified: false,
    currency: "IDR",
    role: "user",
    status: "pending", // DEFAULT PENDING: WAJIB PERSETUJUAN ADMIN
    password: data.password || "password123",
    profession: data.profession || "karyawan",
    plan_tier: "starter",
    plan_expires_at: null,
    is_admin: false,
    monthly_transaction_count: 0,
    last_count_reset: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  db.users.unshift(newUser);
  saveServerDB(db);

  return { success: true, user: newUser };
}

export function authenticateUser(
  email: string,
  password?: string
): {
  success: boolean;
  user?: UserProfile;
  error?: string;
  status?: UserStatus;
} {
  const db = getServerDB();
  const cleanEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase().trim() === cleanEmail);

  if (!user) {
    return {
      success: false,
      error: "Email atau kata sandi tidak ditemukan.",
    };
  }

  // Password check if provided
  if (password && user.password && user.password !== password) {
    return {
      success: false,
      error: "Kata sandi yang Anda masukkan salah.",
    };
  }

  // Admin approval check
  if (user.role !== "admin") {
    if (user.status === "pending") {
      return {
        success: false,
        status: "pending",
        user,
        error: "Akun Anda sedang menunggu verifikasi dan persetujuan dari Admin.",
      };
    }

    if (user.status === "rejected") {
      return {
        success: false,
        status: "rejected",
        user,
        error: "Pendaftaran akun Anda ditolak oleh Admin. Silakan hubungi admin untuk info lebih lanjut.",
      };
    }
  }

  return {
    success: true,
    user,
    status: user.status,
  };
}

export function updateUserStatus(userId: string, newStatus: UserStatus): boolean {
  const db = getServerDB();
  const target = db.users.find((u) => u.id === userId);
  if (!target) return false;

  target.status = newStatus;
  target.updated_at = new Date().toISOString();

  // If updating current active user, sync it as well
  if (db.user.id === userId) {
    db.user.status = newStatus;
  }

  saveServerDB(db);
  return true;
}

export function updateUserRole(userId: string, newRole: UserRole): boolean {
  const db = getServerDB();
  const target = db.users.find((u) => u.id === userId);
  if (!target) return false;

  target.role = newRole;
  target.is_admin = newRole === "admin";
  target.updated_at = new Date().toISOString();

  if (db.user.id === userId) {
    db.user.role = newRole;
    db.user.is_admin = newRole === "admin";
  }

  saveServerDB(db);
  return true;
}

export function deleteUser(userId: string): boolean {
  const db = getServerDB();
  const initialLen = db.users.length;
  db.users = db.users.filter((u) => u.id !== userId);

  if (db.users.length < initialLen) {
    saveServerDB(db);
    return true;
  }
  return false;
}

// ================= TELEGRAM & TRANSACTION HELPERS =================

export function isUpdateProcessed(updateId: number): boolean {
  const db = getServerDB();
  return db.processedUpdateIds.includes(updateId);
}

export function markUpdateProcessed(updateId: number): void {
  const db = getServerDB();
  if (!db.processedUpdateIds.includes(updateId)) {
    db.processedUpdateIds.push(updateId);
    if (db.processedUpdateIds.length > 5000) {
      db.processedUpdateIds = db.processedUpdateIds.slice(-2000);
    }
    saveServerDB(db);
  }
}

export function getTelegramConfig(): TelegramConfigState {
  const db = getServerDB();
  return db.telegramConfig;
}

export function updateTelegramConfig(updates: Partial<TelegramConfigState>): TelegramConfigState {
  const db = getServerDB();
  db.telegramConfig = { ...db.telegramConfig, ...updates };
  saveServerDB(db);
  return db.telegramConfig;
}

export function getUserForTelegramChat(chatId: number, telegramUserId: number): {
  user: UserProfile;
  isAutoLinked: boolean;
} {
  const db = getServerDB();
  const link = db.telegramLinks.find(
    (l) => l.chatId === chatId || l.telegramUserId === telegramUserId
  );

  if (link) {
    const linkedUser = db.users.find((u) => u.id === link.userId);
    return { user: linkedUser || db.user, isAutoLinked: false };
  }

  // Auto-link primary active user for seamless instant experience
  linkTelegramChat(chatId, telegramUserId, null, null, db.user.id);
  return { user: db.user, isAutoLinked: true };
}

export function linkTelegramChat(
  chatId: number,
  telegramUserId: number,
  telegramUsername: string | null,
  firstName: string | null,
  userId?: string
): void {
  const db = getServerDB();
  const targetUserId = userId || db.user.id;

  const existingIndex = db.telegramLinks.findIndex(
    (l) => l.chatId === chatId || l.telegramUserId === telegramUserId
  );

  const linkData = {
    chatId,
    telegramUserId,
    telegramUsername,
    firstName,
    userId: targetUserId,
    linkedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    db.telegramLinks[existingIndex] = linkData;
  } else {
    db.telegramLinks.push(linkData);
  }

  saveServerDB(db);
}

export function unlinkTelegramChat(chatId: number): boolean {
  const db = getServerDB();
  const prevCount = db.telegramLinks.length;
  db.telegramLinks = db.telegramLinks.filter((l) => l.chatId !== chatId);
  if (db.telegramLinks.length !== prevCount) {
    saveServerDB(db);
    return true;
  }
  return false;
}

export function addServerTransaction(data: {
  userId?: string;
  walletId?: string;
  categoryId?: string | null;
  type: "income" | "expense" | "transfer";
  amount: number;
  date?: string;
  notes?: string;
  source?: "web" | "telegram_text" | "telegram_photo" | "telegram_voice";
  merchantName?: string | null;
  items?: Array<{ item_name: string; quantity: number; price: number; category_id?: string | null }>;
}): {
  transaction: Transaction;
  wallet: Wallet;
  category?: Category;
  budget?: Budget;
  categorySpentThisMonth?: number;
} {
  const db = getServerDB();
  const userId = data.userId || db.user.id;

  let wallet = db.wallets.find((w) => w.id === data.walletId);
  if (!wallet) {
    wallet = db.wallets.find((w) => w.is_default) || db.wallets[0];
  }

  if (data.type === "income") {
    wallet.balance += data.amount;
  } else if (data.type === "expense") {
    wallet.balance -= data.amount;
  }
  wallet.updated_at = new Date().toISOString();

  const category = db.categories.find((c) => c.id === data.categoryId);

  const txId = `tx_${Date.now()}`;
  const nowIso = data.date || new Date().toISOString();

  const newTx: Transaction = {
    id: txId,
    user_id: userId,
    wallet_id: wallet.id,
    category_id: data.categoryId || null,
    type: data.type,
    amount: data.amount,
    date: nowIso,
    notes: data.notes || null,
    source: data.source || "telegram_text",
    is_receipt_parent: Boolean(data.items && data.items.length > 0),
    receipt_image_url: null,
    merchant_name: data.merchantName || null,
    transfer_to_wallet_id: null,
    wallet,
    category,
    created_at: nowIso,
  };

  db.transactions.unshift(newTx);

  if (data.items && data.items.length > 0) {
    data.items.forEach((item, idx) => {
      db.transactionItems.push({
        id: `ti_${Date.now()}_${idx}`,
        transaction_id: txId,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        category_id: item.category_id || null,
        created_at: nowIso,
      });
    });
  }

  db.user.monthly_transaction_count = (db.user.monthly_transaction_count || 0) + 1;

  const currentMonth = nowIso.slice(0, 7);
  const budget = db.budgets.find(
    (b) => b.category_id === data.categoryId && b.month_period === currentMonth
  );

  let categorySpentThisMonth = 0;
  if (budget) {
    categorySpentThisMonth = db.transactions
      .filter((t) => t.category_id === data.categoryId && t.type === "expense" && t.date.slice(0, 7) === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  saveServerDB(db);

  return {
    transaction: newTx,
    wallet,
    category,
    budget,
    categorySpentThisMonth,
  };
}
