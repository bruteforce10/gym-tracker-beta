import { redirect } from "next/navigation";

import { getOnboardingReviewData } from "@/actions/onboarding";
import OnboardingReview from "@/components/onboarding-review";
import { auth } from "@/lib/auth";
import { getUserOnboardingGate } from "@/lib/fitness-profile";

export default async function OnboardingReviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const gate = await getUserOnboardingGate(session.user.id);
  if (gate === "needs_onboarding") {
    redirect("/onboarding");
  }
  if (gate === "active" || gate === "legacy_active") {
    redirect("/dashboard");
  }

  const { draft } = await getOnboardingReviewData();

  if (!draft) {
    redirect("/onboarding");
  }

  return <OnboardingReview draft={draft} />;
}
