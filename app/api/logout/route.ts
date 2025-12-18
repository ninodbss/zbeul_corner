import { NextResponse } from "next/server";
import { clearSession } from "../../../lib/session";

export async function POST(req: Request) {
  clearSession();
  return NextResponse.redirect(new URL("/", req.url));
}
