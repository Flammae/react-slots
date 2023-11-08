import { test, expect, describe } from "vitest";
import fs from "fs/promises";
import path from "path";

async function readFile(relative: string) {
  return await fs.readFile(path.resolve(__dirname, relative), "utf-8");
}

function includesLast(file: string, test: string) {
  return file.lastIndexOf(test) > 0;
}

describe("Esbuild config", () => {
  const disabledNoImport = readFile("./dist/disabled-no-import.mjs");
  const disabledNoImportTS = readFile("./dist/disabled-no-import-ts.mjs");

  const disabledWithPragma = readFile("./dist/disabled-with-pragma.mjs");
  const disabledWithPragmaTS = readFile("./dist/disabled-with-pragma-ts.mjs");

  const working = readFile("./dist/working.mjs");
  const workingTS = readFile("./dist/working-ts.mjs");

  test("won't transform when not imported", async () => {
    const [js, ts] = await Promise.all([disabledNoImport, disabledNoImportTS]);
    expect(includesLast(js, "createElement(slot.default, null)")).toBe(true);
    expect(includesLast(ts, "createElement(slot.default, null)")).toBe(true);
  });
  test("won't transform when disabled with pragma", async () => {
    const [js, ts] = await Promise.all([
      disabledWithPragma,
      disabledWithPragmaTS,
    ]);
    expect(includesLast(js, "createElement(slot.default, null)")).toBe(true);
    expect(includesLast(ts, "createElement(slot.default, null)")).toBe(true);
  });
  test("transforms slot elements to functions", async () => {
    const [js, ts] = await Promise.all([working, workingTS]);
    expect(
      includesLast(
        js,
        'slot.default(/* @__PURE__ */ reactExports.createElement("default-content-wrapper", null));',
      ),
    ).toBe(true);
    expect(
      includesLast(
        ts,
        'slot.default(/* @__PURE__ */ React.createElement("default-content-wrapper", null));',
      ),
    ).toBe(true);
  });
});
