import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email wajib diisi." },
        { status: 400 }
      );
    }

    const authResult = authenticateUser(email, password);

    if (!authResult.success) {
      // Differentiate between pending approval, rejected, and wrong credentials
      if (authResult.status === "pending") {
        return NextResponse.json(
          {
            ok: false,
            status: "pending",
            user: authResult.user,
            message: "Akun Anda sedang menunggu verifikasi dari Admin. Silakan tunggu hingga admin menyetujui akun Anda.",
          },
          { status: 403 }
        );
      }

      if (authResult.status === "rejected") {
        return NextResponse.json(
          {
            ok: false,
            status: "rejected",
            user: authResult.user,
            message: "Pendaftaran akun Anda ditolak oleh Admin. Hubungi kami untuk informasi lebih lanjut.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { ok: false, message: authResult.error || "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    const user = authResult.user!;

    // Set simple HTTP cookie for session persistence
    const response = NextResponse.json({
      ok: true,
      user,
      message: `Selamat datang kembali, ${user.full_name}!`,
    });

    response.cookies.set("tatadana_user_id", user.id, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    response.cookies.set("tatadana_user_role", user.role, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Gagal memproses login: ${err.message}` },
      { status: 500 }
    );
  }
}
