import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function TemperatureLoading() {
  return <PageSkeleton cards={3} charts={2} tables={1} />;
}
