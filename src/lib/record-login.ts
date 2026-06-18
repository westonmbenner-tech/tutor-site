import {
  NOTIFICATION_BASELINE_COOKIE,
  SESSION_LOGIN_COOKIE,
} from "@/lib/login-history";

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
  setCookie: CookieSetter
): Promise<void> {
  if (cookieStore.get(SESSION_LOGIN_COOKIE)?.value) {
    return;
  }

  const { data: previousLogin, error } = await supabase.rpc("record_user_login");

  if (error) {
    console.error("Failed to record login:", error.message);
    return;
  }

  setCookie.set(SESSION_LOGIN_COOKIE, "1", {
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  setCookie.set(NOTIFICATION_BASELINE_COOKIE, previousLogin ?? "", {
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
  clear(NOTIFICATION_BASELINE_COOKIE);
}
