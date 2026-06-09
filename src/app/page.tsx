import { redirect } from "next/navigation";
import { getProfile, getSessionUser, roleHomePath } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile) redirect("/login");

  redirect(roleHomePath(profile.role));
}
