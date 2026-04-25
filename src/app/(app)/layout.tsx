import { auth } from "@/lib/auth";
import { getUserOnboardingGate } from "@/lib/fitness-profile";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import AppShell from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const gate = await getUserOnboardingGate(session.user.id);
  if (gate === "needs_onboarding") {
    redirect("/onboarding");
  }
  if (gate === "draft_generated") {
    redirect("/onboarding/review");
  }

  return (
    <SessionProvider session={session} basePath="/api/auth">
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
