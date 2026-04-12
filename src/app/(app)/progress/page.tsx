import { getProgressDashboardData } from "@/actions/progress";
import ProgressReportView from "@/components/progress-report-view";

export default async function ProgressPage() {
  const data = await getProgressDashboardData();

  return <ProgressReportView data={data} />;
}
