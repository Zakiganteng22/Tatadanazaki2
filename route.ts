import { NextRequest, NextResponse } from "next/server";
import { 
  getAllUsers, 
  updateUserStatus, 
  updateUserRole, 
  deleteUser, 
  getUserById 
} from "@/lib/server-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = getAllUsers();
    // Return masked passwords for security
    const safeUsers = users.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });

    return NextResponse.json({
      ok: true,
      users: safeUsers,
      total: safeUsers.length,
      pendingCount: safeUsers.filter((u) => u.status === "pending").length,
      approvedCount: safeUsers.filter((u) => u.status === "approved").length,
      rejectedCount: safeUsers.filter((u) => u.status === "rejected").length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Gagal memuat daftar user: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, status, role } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "userId wajib disertakan." },
        { status: 400 }
      );
    }

    const existingUser = getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { ok: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      updateUserStatus(userId, status);
    }

    if (role && ["admin", "user"].includes(role)) {
      updateUserRole(userId, role);
    }

    const updated = getUserById(userId);
    return NextResponse.json({
      ok: true,
      user: updated,
      message: `User ${updated?.full_name} berhasil diperbarui (Status: ${updated?.status}, Role: ${updated?.role}).`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Gagal memperbarui user: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "userId query parameter wajib disertakan." },
        { status: 400 }
      );
    }

    const success = deleteUser(userId);
    if (!success) {
      return NextResponse.json(
        { ok: false, message: "User tidak ditemukan atau gagal dihapus." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "User berhasil dihapus dari sistem.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Gagal menghapus user: ${err.message}` },
      { status: 500 }
    );
  }
}
