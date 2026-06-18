import { createClient } from "@/lib/supabase/server";
import { clearLoginSessionCookies } from "@/lib/record-login";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  clearLoginSessionCookies({
    set: (name, value, options) => {
      cookieStore.set(name, value, options);
    },
    delete: (name) => {
      cookieStore.delete(name);
    },
  });

  redirect("/");
}
