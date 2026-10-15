import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Berhasil keluar" });
  response.cookies.delete("tatadana_user_id");
  response.cookies.delete("tatadana_user_role");
  return response;
}
