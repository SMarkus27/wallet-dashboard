import { describe, expect, it } from "vitest";

import type { MissingTarget, RebalanceGroup } from "@/lib/api/types";
import {
  amountOf,
  distanceToTarget,
  groupMissingTargets,
  toGroupRows,
} from "@/lib/portfolio/rebalance";

function group(overrides: Partial<RebalanceGroup> = {}): RebalanceGroup {
  return {
    name: "STOCKS",
    label: "Ações",
    asset_type: "STOCKS",
    target_percentage: "50",
    current_value: "1000",
    current_percentage: "40",
    amount: "500",
    projected_value: "1500",
    projected_percentage: "45",
    ...overrides,
  };
}

describe("amountOf", () => {
  it.each(["", " ", "0", "-10", "abc"])(
    "refuses %j instead of asking the API for it",
    (value) => {
      // A rota exige `amount > 0`: mandar qualquer um destes volta 422 e a
      // tela mostraria erro por culpa própria.
      expect(amountOf(value)).toBeNull();
    },
  );

  it("accepts a comma as the decimal separator", () => {
    // O teclado brasileiro produz vírgula, e `Number("1500,50")` é NaN.
    expect(amountOf("1500,50")).toBe(1500.5);
  });

  it("keeps a plain amount as it is", () => {
    expect(amountOf("5000")).toBe(5000);
  });
});

describe("toGroupRows", () => {
  it("puts whoever receives the most on top", () => {
    const rows = toGroupRows([
      group({ name: "FII", label: "FII", amount: "100" }),
      group({ name: "STOCKS", label: "Ações", amount: "900" }),
    ]);

    expect(rows.map((row) => row.label)).toEqual(["Ações", "FII"]);
  });

  it("measures how far the share moved", () => {
    const [row] = toGroupRows([
      group({ current_percentage: "40", projected_percentage: "45" }),
    ]);

    expect(row?.moved).toBe(5);
  });
});

describe("distanceToTarget", () => {
  it("is negative when the contribution closes the gap", () => {
    const [row] = toGroupRows([
      group({ target_percentage: "50", current_percentage: "40", projected_percentage: "45" }),
    ]);

    expect(row && distanceToTarget(row)).toBeLessThan(0);
  });

  it("is positive when the contribution overshoots the target", () => {
    const [row] = toGroupRows([
      group({ target_percentage: "50", current_percentage: "48", projected_percentage: "60" }),
    ]);

    expect(row && distanceToTarget(row)).toBeGreaterThan(0);
  });
});

describe("groupMissingTargets", () => {
  it("separates classes from sectors", () => {
    const missing: MissingTarget[] = [
      {
        dimension: "ASSET_TYPE",
        name: "FII",
        label: "FII",
        asset_type: "FII",
        target_percentage: "30",
      },
      {
        dimension: "SECTOR",
        name: "LOGISTICS",
        label: "Logística",
        asset_type: "FII",
        target_percentage: "10",
      },
    ];

    const groups = groupMissingTargets(missing);

    expect(groups.map((item) => item.dimension)).toEqual([
      "ASSET_TYPE",
      "SECTOR",
    ]);
    expect(groups[0]?.label).toBe("Classe");
  });

  it("returns nothing when every target has an asset", () => {
    expect(groupMissingTargets([])).toEqual([]);
  });
});
