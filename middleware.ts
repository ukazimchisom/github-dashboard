import { NextResponse } from "next/server";

// Route protection middleware
export function middleware() {
  return NextResponse.next();
}
