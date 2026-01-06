import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extender los matchers de jest-dom a vitest
expect.extend(matchers);
