import { Skeleton } from "@/components/ui/skeleton";

export default function GraficosLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-[30rem] rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
