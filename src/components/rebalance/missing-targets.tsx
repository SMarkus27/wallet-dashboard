import { TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { MissingTarget } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { groupMissingTargets } from "@/lib/portfolio/rebalance";

export function MissingTargets({ missing }: { missing: MissingTarget[] }) {
  if (missing.length === 0) return null;

  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>Metas sem ativo em carteira</AlertTitle>
      <AlertDescription className="flex flex-col gap-1">
        <span>
          Estas metas não receberam nada porque não há posição para comprar. O
          aporte só as alcança depois que existir ao menos um ativo ali.
        </span>
        {groupMissingTargets(missing).map((group) => (
          <span key={group.dimension} className="text-xs">
            <span className="font-medium">{group.label}:</span>{" "}
            {group.targets
              .map(
                (target) =>
                  `${target.label} (${formatPercent(target.target_percentage)})`,
              )
              .join(", ")}
          </span>
        ))}
      </AlertDescription>
    </Alert>
  );
}
