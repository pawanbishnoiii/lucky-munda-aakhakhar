
-- Fix ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- Games table
DROP POLICY IF EXISTS "Anyone can view active games" ON public.games;
DROP POLICY IF EXISTS "Admins can manage games" ON public.games;
CREATE POLICY "Anyone can view active games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Admins can manage games" ON public.games FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Game Results
DROP POLICY IF EXISTS "Anyone can view results" ON public.game_results;
DROP POLICY IF EXISTS "Admins can manage results" ON public.game_results;
CREATE POLICY "Anyone can view results" ON public.game_results FOR SELECT USING (true);
CREATE POLICY "Admins can manage results" ON public.game_results FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin Settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Anyone can view settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id) OR (is_global = true));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Wallets
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wallets" ON public.wallets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Wallet Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.wallet_transactions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Bets
DROP POLICY IF EXISTS "Users can view own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can place bets" ON public.bets;
DROP POLICY IF EXISTS "Admins can view all bets" ON public.bets;
DROP POLICY IF EXISTS "Admins can update bets" ON public.bets;
CREATE POLICY "Users can view own bets" ON public.bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can place bets" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all bets" ON public.bets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update bets" ON public.bets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Support Tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User Roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Make payment-screenshots bucket public for viewing
UPDATE storage.buckets SET public = true WHERE id = 'payment-screenshots';

-- Add storage policy for public access (if not exists)
DO $$ BEGIN
  CREATE POLICY "Public can view screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'payment-screenshots');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure trigger for new users exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add realtime for notifications and game_results (wallets already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.game_results;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
