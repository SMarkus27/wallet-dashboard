import { Skeleton } from "@/components/ui/skeleton";

export default function IrpfLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-52 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
