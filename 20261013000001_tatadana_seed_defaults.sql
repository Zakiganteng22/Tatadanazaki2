-- ============================================================================
-- TATADANA SEED DEFAULTS & DATABASE FUNCTIONS
-- Automates user onboarding (default wallet, initial categories, balance triggers)
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_wallet_id UUID;
BEGIN
    -- 1. Create Profile
    INSERT INTO public.profiles (id, full_name, avatar_url, plan_tier, is_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna TataDana'),
        NEW.raw_user_meta_data->>'avatar_url',
        'starter',
        CASE WHEN NEW.email = 'admin@tatadana.id' THEN TRUE ELSE FALSE END
    );

    -- 2. Create Default Wallet (Cash)
    INSERT INTO public.wallets (user_id, name, icon, color, balance, is_default)
    VALUES (NEW.id, 'Dompet Tunai', '💵', '#F97316', 0.00, TRUE)
    RETURNING id INTO new_wallet_id;

    -- Secondary wallet: Rekening Bank
    INSERT INTO public.wallets (user_id, name, icon, color, balance, is_default)
    VALUES (NEW.id, 'BCA / Rekening Utama', '🏦', '#3B82F6', 0.00, FALSE);

    -- Tertiary wallet: E-Wallet
    INSERT INTO public.wallets (user_id, name, icon, color, balance, is_default)
    VALUES (NEW.id, 'GoPay / OVO', '📱', '#10B981', 0.00, FALSE);

    -- 3. Create Default Starter Categories (Recommended Indonesian Starter Pack)
    INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
        (NEW.id, 'Makanan & Minuman', 'expense', '🍜', '#F97316'),
        (NEW.id, 'Transportasi', 'expense', '🚗', '#3B82F6'),
        (NEW.id, 'Tagihan & Utilitas', 'expense', '🏠', '#EF4444'),
        (NEW.id, 'Belanja Harian', 'expense', '👕', '#EC4899'),
        (NEW.id, 'Hiburan & Hobi', 'expense', '🎮', '#8B5CF6'),
        (NEW.id, 'Kesehatan', 'expense', '💊', '#14B8A6'),
        (NEW.id, 'Pendidikan', 'expense', '📚', '#6366F1'),
        (NEW.id, 'Gaji & Honor', 'income', '💰', '#22C55E'),
        (NEW.id, 'Bonus & Freelance', 'income', '💼', '#10B981'),
        (NEW.id, 'Investasi & Lainnya', 'income', '📈', '#06B6D4');

    -- 4. Create Initial Default Reminder (12:00 & 20:00 WIB)
    INSERT INTO public.reminders (user_id, is_enabled, frequency, time_1, time_2)
    VALUES (NEW.id, TRUE, 2, '12:00', '20:00');

    -- 5. Initialize Telegram Account placeholder
    INSERT INTO public.telegram_accounts (user_id, is_connected)
    VALUES (NEW.id, FALSE);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TRIGGER: UPDATE WALLET BALANCE ON TRANSACTION INSERT/DELETE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'income') THEN
            UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
        ELSIF (NEW.type = 'expense') THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
        ELSIF (NEW.type = 'transfer') THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
            IF (NEW.transfer_to_wallet_id IS NOT NULL) THEN
                UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.transfer_to_wallet_id;
            END IF;
        END IF;

        -- Increment user monthly transaction count
        UPDATE public.profiles 
        SET monthly_transaction_count = monthly_transaction_count + 1, updated_at = NOW()
        WHERE id = NEW.user_id;

        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.type = 'income') THEN
            UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
        ELSIF (OLD.type = 'expense') THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
        ELSIF (OLD.type = 'transfer') THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
            IF (OLD.transfer_to_wallet_id IS NOT NULL) THEN
                UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = NOW() WHERE id = OLD.transfer_to_wallet_id;
            END IF;
        END IF;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_balance_sync ON public.transactions;
CREATE TRIGGER on_transaction_balance_sync
    AFTER INSERT OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_balance();
