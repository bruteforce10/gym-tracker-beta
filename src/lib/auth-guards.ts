import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function getViewerContext() {
  const session = await auth();

  return {
    userId: session?.user?.id ?? null,
    role: session?.user?.role ?? "user",
    isAdmin: session?.user?.role === "admin",
  };
}

export async function requireUserId() {
  const viewer = await getViewerContext();
  if (!viewer.userId) {
    throw new Error("Unauthorized");
  }
  return viewer.userId;
}

export async function requireAdmin() {
  const viewer = await getViewerContext();
  if (!viewer.isAdmin) {
    redirect("/dashboard");
  }
  return viewer;
}
