import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPublicSupabaseEnv } from "./env";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const { url, publishableKey } = getPublicSupabaseEnv();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.getClaims();

    return {
      response,
      userId: error ? undefined : (data?.claims?.sub as string | undefined),
    };
  } catch {
    return { response, userId: undefined };
  }
}
