import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getOnboardingPageData } from "@/actions/onboarding";
import OnboardingFlow from "@/components/onboarding-flow";
import { auth } from "@/lib/auth";
import { getUserOnboardingGate } from "@/lib/fitness-profile";

export const metadata: Metadata = {
  title: "Onboarding - Grynx",
  description:
    "Set up your Grynx training profile so your workout plan matches your goals.",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const gate = await getUserOnboardingGate(session.user.id);
  if (gate === "active" || gate === "legacy_active") {
    redirect("/dashboard");
  }

  const data = await getOnboardingPageData();

  return <OnboardingFlow defaultAnswers={data.defaultAnswers} />;
}
