import { NextResponse } from "next/server";
import { botPollingManager, validateBotToken } from "@/lib/telegram/bot-service";
import { getTelegramConfig } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getTelegramConfig();
    const pollingStatus = botPollingManager.getStatus();

    const activeToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const isConfigured = Boolean(activeToken && !activeToken.includes("AAExampleTataDanaBotTokenMock"));

    let botInfo = config.botInfo;
    let webhookInfo: any = null;

    // If configured and bot info missing or needs refresh, fetch getMe once
    if (isConfigured && activeToken && !botInfo) {
      try {
        const testRes = await validateBotToken(activeToken);
        if (testRes.ok && testRes.bot) {
          botInfo = testRes.bot;
          webhookInfo = testRes.webhook;
        }
      } catch {
        // Silently continue
      }
    }

    const tokenMasked = activeToken
      ? `${activeToken.slice(0, 8)}••••••••••••••••••••••••${activeToken.slice(-4)}`
      : null;

    return NextResponse.json({
      ok: true,
      is_configured: isConfigured,
      token_masked: tokenMasked,
      is_polling_active: pollingStatus.isRunning,
      mode: pollingStatus.isRunning ? "polling" : config.mode,
      bot: botInfo,
      webhook: webhookInfo,
      last_poll_at: pollingStatus.lastPollAt,
      last_error: pollingStatus.lastError || config.lastError,
      app_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
