import { getWorkoutPlans, createDefaultPlans } from "@/actions/plans";
import PlanClient from "./plan-client";

export default async function PlanPage() {
  // Auto-create default plans if none exist
  await createDefaultPlans();
  const plans = await getWorkoutPlans();

  return <PlanClient plans={plans} />;
}
