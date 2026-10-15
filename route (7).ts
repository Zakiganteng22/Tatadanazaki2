import { NextRequest, NextResponse } from "next/server";
import { botPollingManager } from "@/lib/telegram/bot-service";
import { getTelegramConfig, updateTelegramConfig } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "start";
    let token = body.token?.trim();

    if (!token) {
      const config = getTelegramConfig();
      token = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
    }

    if (action === "start") {
      if (!token) {
        return NextResponse.json(
          { ok: false, message: "Token bot belum diberikan. Silakan isi token bot terlebih dahulu." },
          { status: 400 }
        );
      }

      const result = await botPollingManager.start(token);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (action === "stop") {
      const result = botPollingManager.stop();
      updateTelegramConfig({
        isConnected: false,
        isPollingActive: false,
        mode: "idle",
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, message: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET() {
  const status = botPollingManager.getStatus();
  return NextResponse.json({ ok: true, polling: status });
}
