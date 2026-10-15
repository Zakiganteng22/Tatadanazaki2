export type PlanTier = 'starter' | 'pro';
export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  phone_verified: boolean;
  currency: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  profession?: string;
  plan_tier: PlanTier;
  plan_expires_at: string | null;
  is_admin: boolean;
  monthly_transaction_count: number;
  last_count_reset: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  balance: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  month_period: string; // 'YYYY-MM'
  spent?: number;
  percentage?: number;
  alert_80_sent?: boolean;
  alert_100_sent?: boolean;
  category?: Category;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'web' | 'telegram_text' | 'telegram_photo' | 'telegram_voice';

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_name: string;
  quantity: number;
  price: number;
  category_id: string | null;
  category?: Category;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  date: string; // ISO string in WIB
  notes: string | null;
  source: TransactionSource;
  is_receipt_parent: boolean;
  receipt_image_url: string | null;
  merchant_name: string | null;
  transfer_to_wallet_id: string | null;
  wallet?: Wallet;
  category?: Category;
  transfer_to_wallet?: Wallet;
  items?: TransactionItem[];
  created_at: string;
}

export interface TelegramAccount {
  id: string;
  user_id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  first_name: string | null;
  phone_number: string | null;
  is_connected: boolean;
  custom_bot_token: string | null;
  connected_at: string | null;
}

export interface ReminderSetting {
  id: string;
  user_id: string;
  is_enabled: boolean;
  frequency: 1 | 2;
  time_1: string; // HH:mm WIB
  time_2: string; // HH:mm WIB
  last_sent_at: string | null;
}

export interface AIProviderConfig {
  id: string;
  name: string; // 'gemini' | 'openai' | 'deepseek'
  display_name: string;
  model_name: string;
  api_key_masked: string;
  is_active: boolean;
  priority: number;
  mode: 'single' | 'failover';
}

export interface AILogEntry {
  id: string;
  provider: string;
  feature: 'parse_text' | 'ocr_receipt' | 'speech_to_text' | 'advisor' | 'category_recommendation';
  tokens_used: number;
  latency_ms: number;
  status: 'success' | 'error';
  error_message?: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  order_id: string;
  plan_tier: PlanTier;
  amount: number;
  payment_method: 'midtrans_qris' | 'midtrans_va' | 'manual_transfer';
  payment_proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  midtrans_transaction_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface ExportHistoryRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: 'pdf' | 'xlsx';
  period_range: string;
  storage_path: string;
  file_size_kb: number;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
  admin_user?: UserProfile;
  target_user?: UserProfile;
}
