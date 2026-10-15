import { NextRequest, NextResponse } from "next/server";
import { validateBotToken } from "@/lib/telegram/bot-service";
import { getTelegramConfig } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let token = body.token?.trim();

    if (!token) {
      const config = getTelegramConfig();
      token = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
    }

    if (!token) {
      return NextResponse.json(
        { 
          ok: false, 
          message: "Token bot belum diisi. Silakan masukkan token bot dari Telegram @BotFather." 
        },
        { status: 400 }
      );
    }

    const result = await validateBotToken(token);

    if (!result.ok) {
      return NextResponse.json(
        { 
          ok: false, 
          message: result.message,
          error: result.error 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      bot: result.bot,
      webhook: result.webhook,
      message: `Koneksi berhasil! Bot @${result.bot?.username} (${result.bot?.first_name}) siap digunakan.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Terjadi error saat verifikasi token: ${err.message}` },
      { status: 500 }
    );
  }
}
