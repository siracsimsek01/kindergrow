import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function GrowthLoading() {
  return <PageSkeleton cards={4} charts={2} tables={1} />;
}
