import { cookies } from "next/headers";
import { ok } from "@/lib/utils";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("ps_token");
  return ok({ message: "Logged out" });
}
