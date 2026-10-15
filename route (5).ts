import { NextRequest, NextResponse } from "next/server";
import { registerNewUser } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, phoneNumber, profession } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: "Alamat email tidak valid." },
        { status: 400 }
      );
    }

    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { ok: false, message: "Nama lengkap wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    const result = registerNewUser({
      fullName,
      email,
      password: password || "password123",
      phoneNumber,
      profession,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { ok: false, message: result.error || "Gagal mendaftarkan akun." },
        { status: 400 }
      );
    }

    // Return pending status message per requirements
    return NextResponse.json({
      ok: true,
      status: "pending",
      user: result.user,
      message: "Registrasi berhasil! Akun Anda sedang menunggu verifikasi dan persetujuan dari Admin.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Terjadi kesalahan pendaftaran: ${err.message}` },
      { status: 500 }
    );
  }
}
