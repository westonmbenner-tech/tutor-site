import { SESSION_LOGIN_COOKIE } from "@/lib/login-history";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
};

type CookieSetter = {
  set: (
    name: string,
    value: string,
    options?: {
      path?: string;
      maxAge?: number;
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
    }
  ) => void;
};

export async function recordLoginIfNeeded(
  supabase: { rpc: (fn: string) => PromiseLike<{ data: string | null; error: { message: string } | null }> },
  cookieStore: CookieStore,
  setCookie: CookieSetter,
  lastSignInAt?: string | null
): Promise<void> {
  if (!lastSignInAt) {
    return;
  }

  if (cookieStore.get(SESSION_LOGIN_COOKIE)?.value === lastSignInAt) {
    return;
  }

  const { error } = await supabase.rpc("record_user_login");

  if (error) {
    console.error("Failed to record login:", error.message);
    return;
  }

  setCookie.set(SESSION_LOGIN_COOKIE, lastSignInAt, {
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
  });
}

export function clearLoginSessionCookies(
  setCookie: CookieSetter & { delete?: (name: string) => void }
) {
  const clear = (name: string) => {
    if (setCookie.delete) {
      setCookie.delete(name);
      return;
    }

    setCookie.set(name, "", { path: "/", maxAge: 0 });
  };

  clear(SESSION_LOGIN_COOKIE);
  // Legacy cookie from earlier notification baseline approach.
  clear("tc_notif_baseline");
}
