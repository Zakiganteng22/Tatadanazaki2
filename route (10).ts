import { NextRequest, NextResponse } from "next/server";
import { processTelegramUpdate } from "@/lib/telegram/bot-service";
import { getTelegramConfig } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const config = getTelegramConfig();
    const token = config.botToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.warn("[webhook] Webhook received but no bot token configured.");
      return NextResponse.json({ ok: true, skipped: true, reason: "no_token_configured" });
    }

    const result = await processTelegramUpdate(update, token);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[webhook] Error processing incoming webhook:", err);
    // Always return 200 so Telegram doesn't retry on formatting errors
    return NextResponse.json({ ok: true, error: err.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "TataDana Telegram Webhook Handler",
    timezone: "Asia/Jakarta (WIB)",
  });
}
