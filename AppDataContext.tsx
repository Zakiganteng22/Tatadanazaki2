"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { 
  UserProfile, 
  Wallet, 
  Category, 
  Budget, 
  Transaction, 
  TransactionItem, 
  TelegramAccount, 
  ReminderSetting, 
  AIProviderConfig, 
  AILogEntry, 
  PaymentRecord, 
  ExportHistoryRecord,
  AdminAuditLog 
} from "@/types";
import { 
  INITIAL_USER, 
  INITIAL_WALLETS, 
  INITIAL_CATEGORIES, 
  INITIAL_BUDGETS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_TRANSACTION_ITEMS, 
  INITIAL_AI_PROVIDERS, 
  INITIAL_AI_LOGS, 
  INITIAL_PAYMENTS 
} from "@/lib/store";

interface AppDataContextType {
  // Current user & Auth
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  isImpersonating: boolean;
  impersonatedUser: UserProfile | null;
  startImpersonation: (targetUser: UserProfile) => void;
  stopImpersonation: () => void;
  
  // Wallets
  wallets: Wallet[];
  addWallet: (name: string, icon: string, color: string, initialBalance: number) => Wallet;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  setDefaultWallet: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (name: string, type: 'expense' | 'income', icon: string, color: string) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Budgets
  budgets: Budget[];
  setCategoryBudget: (categoryId: string, monthlyLimit: number) => void;
  deleteBudget: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  addTransaction: (tx: {
    wallet_id: string;
    category_id?: string | null;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    date: string;
    notes?: string;
    source?: 'web' | 'telegram_text' | 'telegram_photo' | 'telegram_voice';
    is_receipt_parent?: boolean;
    receipt_image_url?: string | null;
    merchant_name?: string | null;
    transfer_to_wallet_id?: string | null;
    items?: Array<{ item_name: string; quantity: number; price: number; category_id?: string | null }>;
  }) => { transaction: Transaction; error?: string };
  deleteTransaction: (id: string) => void;

  // Telegram
  telegramAccount: TelegramAccount;
  updateTelegramAccount: (updates: Partial<TelegramAccount>) => void;
  unlinkTelegram: () => void;

  // Reminders
  reminder: ReminderSetting;
  updateReminder: (updates: Partial<ReminderSetting>) => void;

  // AI Providers & Logs
  aiProviders: AIProviderConfig[];
  updateAIProvider: (id: string, updates: Partial<AIProviderConfig>) => void;
  addAIProvider: (provider: Omit<AIProviderConfig, 'id'>) => void;
  deleteAIProvider: (id: string) => void;
  aiLogs: AILogEntry[];
  addAILog: (log: Omit<AILogEntry, 'id' | 'created_at'>) => void;

  // Payments
  payments: PaymentRecord[];
  createPayment: (plan: 'starter' | 'pro', method: 'midtrans_qris' | 'midtrans_va' | 'manual_transfer', proofUrl?: string) => PaymentRecord;
  approvePayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string, reason: string) => void;

  // Export History
  exportHistory: ExportHistoryRecord[];
  addExportRecord: (record: Omit<ExportHistoryRecord, 'id' | 'created_at'>) => void;

  // Admin Audit Logs
  auditLogs: AdminAuditLog[];
  addAuditLog: (action: string, details: Record<string, any>, targetUserId?: string) => void;

  // Reset / Seeding utilities
  resetToEmptyState: () => void;
  resetToDemoState: () => void;

  // Stats calculation helper
  stats: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    remainingBudget: number;
    totalBudget: number;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const STORAGE_KEY = "tatadana_app_data_v1";

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  // Load from local storage or fallback to initial store
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [impersonatedUser, setImpersonatedUser] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>(INITIAL_TRANSACTION_ITEMS);
  const [telegramAccount, setTelegramAccount] = useState<TelegramAccount>({
    id: "tg_01",
    user_id: INITIAL_USER.id,
    telegram_user_id: 198273641,
    telegram_username: "budipratama_id",
    first_name: "Budi",
    phone_number: INITIAL_USER.phone_number,
    is_connected: true,
    custom_bot_token: null,
    connected_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  });
  const [reminder, setReminder] = useState<ReminderSetting>({
    id: "rem_01",
    user_id: INITIAL_USER.id,
    is_enabled: true,
    frequency: 2,
    time_1: "12:00",
    time_2: "20:00",
    last_sent_at: new Date().toISOString(),
  });
  const [aiProviders, setAIProviders] = useState<AIProviderConfig[]>(INITIAL_AI_PROVIDERS);
  const [aiLogs, setAILogs] = useState<AILogEntry[]>(INITIAL_AI_LOGS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [exportHistory, setExportHistory] = useState<ExportHistoryRecord[]>([
    {
      id: "exp_01",
      user_id: INITIAL_USER.id,
      file_name: "Laporan_Keuangan_TataDana_Oktober_2026.pdf",
      file_type: "pdf",
      period_range: "01/10/2026 - 31/10/2026",
      storage_path: "tatadana-exports/usr_budi_01/Laporan_Keuangan_TataDana_Oktober_2026.pdf",
      file_size_kb: 142,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    }
  ]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Active user depends on impersonation
  const activeUser = impersonatedUser || user;

  // Sync to local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.wallets) setWallets(parsed.wallets);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.transactionItems) setTransactionItems(parsed.transactionItems);
        if (parsed.telegramAccount) setTelegramAccount(parsed.telegramAccount);
        if (parsed.reminder) setReminder(parsed.reminder);
        if (parsed.aiProviders) setAIProviders(parsed.aiProviders);
        if (parsed.aiLogs) setAILogs(parsed.aiLogs);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.exportHistory) setExportHistory(parsed.exportHistory);
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    setIsLoaded(true);
  }, []);

  // Periodic background sync with server store to pull transactions recorded via Telegram Bot
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/app-data");
        const data = await res.json();
        if (data.ok && Array.isArray(data.transactions)) {
          setTransactions((prev) => {
            const currentIds = new Set(prev.map((t) => t.id));
            const newOnes = data.transactions.filter((st: any) => !currentIds.has(st.id));
            if (newOnes.length > 0) {
              if (Array.isArray(data.wallets) && data.wallets.length > 0) {
                setWallets(data.wallets);
              }
              return [...newOnes, ...prev];
            }
            return prev;
          });
        }
      } catch (err) {
        // Silently ignore background poll error
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          wallets,
          categories,
          budgets,
          transactions,
          transactionItems,
          telegramAccount,
          reminder,
          aiProviders,
          aiLogs,
          payments,
          exportHistory,
        })
      );
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }, [
    isLoaded,
    user,
    wallets,
    categories,
    budgets,
    transactions,
    transactionItems,
    telegramAccount,
    reminder,
    aiProviders,
    aiLogs,
    payments,
    exportHistory,
  ]);

  // Impersonation handlers
  const startImpersonation = (targetUser: UserProfile) => {
    setImpersonatedUser(targetUser);
    addAuditLog("impersonate_user", { target_name: targetUser.full_name }, targetUser.id);
  };

  const stopImpersonation = () => {
    setImpersonatedUser(null);
  };

  // Wallet methods
  const addWallet = (name: string, icon: string, color: string, initialBalance: number): Wallet => {
    const newWallet: Wallet = {
      id: `wlt_${Date.now()}`,
      user_id: activeUser.id,
      name,
      icon: icon || "👛",
      color: color || "#F97316",
      balance: initialBalance,
      is_default: wallets.length === 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setWallets((prev) => [...prev, newWallet]);
    return newWallet;
  };

  const updateWallet = (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w))
    );
  };

  const deleteWallet = (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  };

  const setDefaultWallet = (id: string) => {
    setWallets((prev) =>
      prev.map((w) => ({
        ...w,
        is_default: w.id === id,
        updated_at: new Date().toISOString(),
      }))
    );
  };

  // Category methods
  const addCategory = (name: string, type: 'expense' | 'income', icon: string, color: string): Category => {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      user_id: activeUser.id,
      name,
      type,
      icon: icon || "🏷️",
      color: color || "#F97316",
      created_at: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Budget methods
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const setCategoryBudget = (categoryId: string, monthlyLimit: number) => {
    setBudgets((prev) => {
      const existing = prev.find((b) => b.category_id === categoryId && b.month_period === currentMonthKey);
      if (existing) {
        return prev.map((b) =>
          b.id === existing.id ? { ...b, monthly_limit: monthlyLimit } : b
        );
      }
      return [
        ...prev,
        {
          id: `bg_${Date.now()}`,
          user_id: activeUser.id,
          category_id: categoryId,
          monthly_limit: monthlyLimit,
          month_period: currentMonthKey,
        },
      ];
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // Transaction methods
  const addTransaction = (data: {
    wallet_id: string;
    category_id?: string | null;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    date: string;
    notes?: string;
    source?: 'web' | 'telegram_text' | 'telegram_photo' | 'telegram_voice';
    is_receipt_parent?: boolean;
    receipt_image_url?: string | null;
    merchant_name?: string | null;
    transfer_to_wallet_id?: string | null;
    items?: Array<{ item_name: string; quantity: number; price: number; category_id?: string | null }>;
  }) => {
    // Plan limit enforcement: Starter max 50 transactions/month
    if (activeUser.plan_tier === 'starter' && activeUser.monthly_transaction_count >= 50) {
      return {
        transaction: {} as Transaction,
        error: "Batas 50 transaksi/bulan untuk paket Starter telah tercapai! Silakan upgrade ke Pro untuk transaksi unlimited.",
      };
    }

    const txId = `tx_${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      user_id: activeUser.id,
      wallet_id: data.wallet_id,
      category_id: data.category_id || null,
      type: data.type,
      amount: data.amount,
      date: data.date,
      notes: data.notes || null,
      source: data.source || "web",
      is_receipt_parent: Boolean(data.is_receipt_parent),
      receipt_image_url: data.receipt_image_url || null,
      merchant_name: data.merchant_name || null,
      transfer_to_wallet_id: data.transfer_to_wallet_id || null,
      created_at: new Date().toISOString(),
    };

    // Update wallet balances
    setWallets((prev) =>
      prev.map((w) => {
        if (data.type === "income" && w.id === data.wallet_id) {
          return { ...w, balance: w.balance + data.amount };
        }
        if (data.type === "expense" && w.id === data.wallet_id) {
          return { ...w, balance: w.balance - data.amount };
        }
        if (data.type === "transfer") {
          if (w.id === data.wallet_id) {
            return { ...w, balance: w.balance - data.amount };
          }
          if (w.id === data.transfer_to_wallet_id) {
            return { ...w, balance: w.balance + data.amount };
          }
        }
        return w;
      })
    );

    // Save multi items if any
    if (data.items && data.items.length > 0) {
      const newItems: TransactionItem[] = data.items.map((item, index) => ({
        id: `ti_${Date.now()}_${index}`,
        transaction_id: txId,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        category_id: item.category_id || null,
        created_at: new Date().toISOString(),
      }));
      setTransactionItems((prev) => [...prev, ...newItems]);
    }

    // Increment transaction count
    setUser((prev) => ({
      ...prev,
      monthly_transaction_count: prev.monthly_transaction_count + 1,
    }));

    setTransactions((prev) => [newTx, ...prev]);

    return { transaction: newTx };
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    // Rollback wallet balance
    setWallets((prev) =>
      prev.map((w) => {
        if (target.type === "income" && w.id === target.wallet_id) {
          return { ...w, balance: w.balance - target.amount };
        }
        if (target.type === "expense" && w.id === target.wallet_id) {
          return { ...w, balance: w.balance + target.amount };
        }
        if (target.type === "transfer") {
          if (w.id === target.wallet_id) return { ...w, balance: w.balance + target.amount };
          if (w.id === target.transfer_to_wallet_id) return { ...w, balance: w.balance - target.amount };
        }
        return w;
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setTransactionItems((prev) => prev.filter((item) => item.transaction_id !== id));
  };

  // Telegram account helpers
  const updateTelegramAccount = (updates: Partial<TelegramAccount>) => {
    setTelegramAccount((prev) => ({ ...prev, ...updates }));
  };

  const unlinkTelegram = () => {
    setTelegramAccount({
      id: `tg_${Date.now()}`,
      user_id: activeUser.id,
      telegram_user_id: null,
      telegram_username: null,
      first_name: null,
      phone_number: null,
      is_connected: false,
      custom_bot_token: null,
      connected_at: null,
    });
  };

  // Reminder helpers
  const updateReminder = (updates: Partial<ReminderSetting>) => {
    setReminder((prev) => ({ ...prev, ...updates }));
  };

  // AI Providers
  const updateAIProvider = (id: string, updates: Partial<AIProviderConfig>) => {
    setAIProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addAIProvider = (provider: Omit<AIProviderConfig, 'id'>) => {
    const newProv: AIProviderConfig = {
      ...provider,
      id: `aip_${Date.now()}`,
    };
    setAIProviders((prev) => [...prev, newProv]);
  };

  const deleteAIProvider = (id: string) => {
    setAIProviders((prev) => prev.filter((p) => p.id !== id));
  };

  const addAILog = (log: Omit<AILogEntry, 'id' | 'created_at'>) => {
    const newLog: AILogEntry = {
      ...log,
      id: `log_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setAILogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Payments & Subscription
  const createPayment = (
    plan: 'starter' | 'pro',
    method: 'midtrans_qris' | 'midtrans_va' | 'manual_transfer',
    proofUrl?: string
  ): PaymentRecord => {
    const orderId = `TD-${Date.now().toString().slice(-8)}`;
    const amount = plan === 'pro' ? 99000 : 49000;
    const isAutoApprove = method !== 'manual_transfer';

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      user_id: activeUser.id,
      order_id: orderId,
      plan_tier: plan,
      amount,
      payment_method: method,
      payment_proof_url: proofUrl || null,
      status: isAutoApprove ? 'approved' : 'pending',
      midtrans_transaction_id: isAutoApprove ? `mid-${Date.now()}` : null,
      admin_notes: isAutoApprove ? "Pembayaran terverifikasi Midtrans" : "Menunggu verifikasi manual transfer admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: activeUser,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // If auto approved, upgrade plan immediately
    if (isAutoApprove) {
      setUser((prev) => ({
        ...prev,
        plan_tier: plan,
        plan_expires_at: plan === 'pro' ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
      }));
    }

    return newPayment;
  };

  const approvePayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          // Upgrade user
          setUser((u) => ({
            ...u,
            plan_tier: p.plan_tier,
            plan_expires_at: p.plan_tier === 'pro' ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
          }));
          return {
            ...p,
            status: 'approved',
            admin_notes: 'Disetujui manual oleh Admin',
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    addAuditLog("approve_payment", { payment_id: paymentId });
  };

  const rejectPayment = (paymentId: string, reason: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'rejected',
              admin_notes: `Ditolak admin: ${reason}`,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
    addAuditLog("reject_payment", { payment_id: paymentId, reason });
  };

  // Export History
  const addExportRecord = (record: Omit<ExportHistoryRecord, 'id' | 'created_at'>) => {
    const newRecord: ExportHistoryRecord = {
      ...record,
      id: `exp_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setExportHistory((prev) => [newRecord, ...prev]);
  };

  // Audit Logs
  const addAuditLog = (action: string, details: Record<string, any>, targetUserId?: string) => {
    const log: AdminAuditLog = {
      id: `aud_${Date.now()}`,
      admin_user_id: user.id,
      target_user_id: targetUserId || null,
      action,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Reset / Seeding methods
  const resetToEmptyState = () => {
    setTransactions([]);
    setTransactionItems([]);
    setWallets([
      {
        id: "wlt_01",
        user_id: activeUser.id,
        name: "Dompet Tunai",
        icon: "💵",
        color: "#F97316",
        balance: 0,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "wlt_02",
        user_id: activeUser.id,
        name: "Rekening Bank BCA",
        icon: "🏦",
        color: "#3B82F6",
        balance: 0,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    setUser((prev) => ({
      ...prev,
      monthly_transaction_count: 0,
    }));
    addAuditLog("reset_to_empty_state", { message: "Data direset ke kondisi bersih" });
  };

  const resetToDemoState = () => {
    setUser(INITIAL_USER);
    setWallets(INITIAL_WALLETS);
    setCategories(INITIAL_CATEGORIES);
    setBudgets(INITIAL_BUDGETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTransactionItems(INITIAL_TRANSACTION_ITEMS);
    addAuditLog("reset_to_demo_state", { message: "Data demo dipulihkan" });
  };

  // Computed dashboard statistics
  const stats = useMemo(() => {
    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

    // Filter current month transactions
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum) {
        if (tx.type === "income") monthlyIncome += tx.amount;
        if (tx.type === "expense") monthlyExpense += tx.amount;
      }
    });

    const totalBudget = budgets.reduce((acc, b) => acc + b.monthly_limit, 0);
    const remainingBudget = Math.max(0, totalBudget - monthlyExpense);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      remainingBudget,
      totalBudget,
    };
  }, [wallets, transactions, budgets]);

  return (
    <AppDataContext.Provider
      value={{
        user: activeUser,
        setUser,
        isImpersonating: Boolean(impersonatedUser),
        impersonatedUser,
        startImpersonation,
        stopImpersonation,
        wallets,
        addWallet,
        updateWallet,
        deleteWallet,
        setDefaultWallet,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        budgets,
        setCategoryBudget,
        deleteBudget,
        transactions,
        transactionItems,
        addTransaction,
        deleteTransaction,
        telegramAccount,
        updateTelegramAccount,
        unlinkTelegram,
        reminder,
        updateReminder,
        aiProviders,
        updateAIProvider,
        addAIProvider,
        deleteAIProvider,
        aiLogs,
        addAILog,
        payments,
        createPayment,
        approvePayment,
        rejectPayment,
        exportHistory,
        addExportRecord,
        auditLogs,
        addAuditLog,
        resetToEmptyState,
        resetToDemoState,
        stats,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
