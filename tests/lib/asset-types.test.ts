import { describe, expect, it } from "vitest";

import { ASSET_TYPES, assetTypeLabel, assetTypeQueryValue } from "@/lib/api/types";

describe("assetTypeLabel", () => {
  it("resolves both the enum name and the value the API sends", () => {
    expect(assetTypeLabel("STOCKS")).toBe("Ações");
    expect(assetTypeLabel("AÇÃO")).toBe("Ações");
  });

  it("labels every declared type", () => {
    for (const type of ASSET_TYPES) {
      expect(assetTypeLabel(type.value)).toBe(type.label);
    }
  });

  it("falls back rather than showing nothing", () => {
    expect(assetTypeLabel("DESCONHECIDO", "Outro")).toBe("Outro");
    expect(assetTypeLabel("DESCONHECIDO")).toBe("DESCONHECIDO");
  });
});

describe("assetTypeQueryValue", () => {
  it("turns an enum name into the value the API expects", () => {
    expect(assetTypeQueryValue("FII")).toBe("FII");
    expect(assetTypeQueryValue("INCOME_FIXED")).toBe("RENDA FIXA");
  });

  it("returns nothing for an unknown key", () => {
    expect(assetTypeQueryValue("NADA")).toBeUndefined();
  });
});
