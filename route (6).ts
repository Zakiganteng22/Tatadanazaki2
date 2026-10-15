import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { profession, lifestyle, incomeSource } = await req.json();

    // AI recommendation simulation based on user answers
    const recommendations = [
      { name: "Makanan & Kuliner", type: "expense", icon: "🍜", color: "#F97316" },
      { name: "Transportasi Harian", type: "expense", icon: "🚗", color: "#3B82F6" },
      { name: "Tagihan & Listrik", type: "expense", icon: "🏠", color: "#EF4444" },
      { name: "Belanja & Lifestyle", type: "expense", icon: "👕", color: "#EC4899" },
    ];

    if (profession?.toLowerCase().includes("freelance")) {
      recommendations.push(
        { name: "Software & SaaS Tools", type: "expense", icon: "💻", color: "#8B5CF6" },
        { name: "Pendapatan Klien & Proyek", type: "income", icon: "💼", color: "#10B981" },
        { name: "Royalti & Passive Income", type: "income", icon: "📈", color: "#06B6D4" }
      );
    } else if (profession?.toLowerCase().includes("mahasiswa")) {
      recommendations.push(
        { name: "Buku & Biaya Kuliah", type: "expense", icon: "📚", color: "#6366F1" },
        { name: "Nongkrong & Ngopi", type: "expense", icon: "☕", color: "#F59E0B" },
        { name: "Kiriman Ortu & Beasiswa", type: "income", icon: "🎓", color: "#10B981" }
      );
    } else {
      // Default Karyawan
      recommendations.push(
        { name: "Hiburan & Hobi", type: "expense", icon: "🎮", color: "#8B5CF6" },
        { name: "Kesehatan & Asuransi", type: "expense", icon: "💊", color: "#14B8A6" },
        { name: "Gaji Bulanan", type: "income", icon: "💰", color: "#22C55E" },
        { name: "Bonus / THR", type: "income", icon: "🎉", color: "#10B981" }
      );
    }

    return NextResponse.json({
      ok: true,
      recommendations,
      message: `AI merekomendasikan ${recommendations.length} kategori khusus untuk profil ${profession || 'kamu'}.`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
