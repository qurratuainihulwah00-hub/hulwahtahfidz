import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./config";

const HULWAH_WORKSPACE_USER_ID = "31a9adbd-b5bf-4e14-ac56-d73d605363a5";

type CookieOptions = {
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  priority?: "low" | "medium" | "high";
  partitioned?: boolean;
};

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function createClient() {
  const cookieStore = await cookies();
  const client = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server components cannot always write cookies.
        }
      },
    },
  });

  // Tahfidz with Hulwah is intentionally a single-user personal workspace.
  // Server data loaders/actions use the fixed workspace owner while Postgres RLS
  // limits anonymous API access to that same workspace.
  (client.auth as any).getUser = async () => ({
    data: {
      user: {
        id: HULWAH_WORKSPACE_USER_ID,
        email: undefined,
      },
    },
    error: null,
  });

  return client;
}
