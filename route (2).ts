import { NextRequest, NextResponse } from "next/server";
import { getServerDB, saveServerDB } from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getServerDB();
    return NextResponse.json({
      ok: true,
      user: db.user,
      wallets: db.wallets,
      categories: db.categories,
      budgets: db.budgets,
      transactions: db.transactions,
      transactionItems: db.transactionItems,
      telegramConfig: db.telegramConfig,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getServerDB();

    if (body.action === "reset_empty") {
      db.transactions = [];
      db.transactionItems = [];
      db.wallets.forEach((w) => (w.balance = 0));
      saveServerDB(db);
      return NextResponse.json({ ok: true, message: "Server data direset ke kosong" });
    }

    if (body.action === "sync_client") {
      // Merge client changes if newer
      if (Array.isArray(body.wallets) && body.wallets.length > 0) {
        db.wallets = body.wallets;
      }
      if (Array.isArray(body.categories) && body.categories.length > 0) {
        db.categories = body.categories;
      }
      if (Array.isArray(body.budgets) && body.budgets.length > 0) {
        db.budgets = body.budgets;
      }
      if (Array.isArray(body.transactions)) {
        // Merge transactions by ID
        const existingIds = new Set(db.transactions.map((t) => t.id));
        body.transactions.forEach((clientTx: any) => {
          if (!existingIds.has(clientTx.id)) {
            db.transactions.push(clientTx);
            existingIds.add(clientTx.id);
          }
        });
        db.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      saveServerDB(db);
      return NextResponse.json({ ok: true, data: db });
    }

    return NextResponse.json({ ok: false, message: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
