import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

// Sem `globals: true`, o Testing Library não registra a limpeza sozinho e as
// renderizações de um teste sobram no DOM do seguinte.
afterEach(cleanup);
