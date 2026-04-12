import { getProgressHistoryData } from "@/actions/progress";
import ProgressHistoryView from "@/components/progress-history-view";

export default async function ProgressHistoryPage() {
  const data = await getProgressHistoryData();

  return <ProgressHistoryView data={data} />;
}
