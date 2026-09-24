import { Skeleton } from "@/components/ui/skeleton";

export default function ResumoLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
