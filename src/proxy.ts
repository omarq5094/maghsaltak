import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { refreshSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const result = await refreshSupabaseSession(request);

  if (!result.userId) {
    return NextResponse.redirect(new URL("/?auth=required", request.url));
  }

  return result.response;
}

export const config = {
  matcher: ["/admin/:path*", "/kiosk/:path*"],
};
