import { test, expect, describe } from "vitest";
import fs from "fs/promises";
import path from "path";

async function readFile(relative: string) {
  return await fs.readFile(path.resolve(__dirname, relative), "utf-8");
}

function includesLast(file: string, test: string) {
  return file.lastIndexOf(test) > 0;
}

describe("Rollup config", () => {
  const disabledNoImport = readFile("./dist/disabled-no-import.js");
  const disabledNoImportTS = readFile("./dist/disabled-no-import-ts.js");

  const disabledWithPragma = readFile("./dist/disabled-with-pragma.js");
  const disabledWithPragmaTS = readFile("./dist/disabled-with-pragma-ts.js");

  const working = readFile("./dist/working.js");
  const workingTS = readFile("./dist/working-ts.js");

  test("won't transform when not imported", async () => {
    const [js, ts] = await Promise.all([disabledNoImport, disabledNoImportTS]);
    expect(includesLast(js, "createElement(slot.default, null)")).toBe(true);
    expect(
      includesLast(
        js,
        "/* slot transformation skipped by unplugin-transform-react-slots */",
      ),
    ).toBe(true);

    expect(includesLast(ts, "createElement(slot.default, null)")).toBe(true);
    expect(
      includesLast(
        ts,
        "/* slot transformation skipped by unplugin-transform-react-slots */",
      ),
    ).toBe(true);
  });

  test("won't transform when disabled with pragma", async () => {
    const [js, ts] = await Promise.all([
      disabledWithPragma,
      disabledWithPragmaTS,
    ]);
    expect(includesLast(js, "createElement(slot.default, null)")).toBe(true);
    expect(
      includesLast(
        js,
        "/* slot transformation skipped by unplugin-transform-react-slots */",
      ),
    ).toBe(true);

    expect(includesLast(ts, "createElement(slot.default, null)")).toBe(true);
    expect(
      includesLast(
        ts,
        "/* slot transformation skipped by unplugin-transform-react-slots */",
      ),
    ).toBe(true);
  });

  test("transforms slot elements to functions", async () => {
    const [js, ts] = await Promise.all([working, workingTS]);
    expect(
      includesLast(
        js,
        `slot.default( /*#__PURE__*/React3.createElement("default-content-wrapper", null));`,
      ),
    ).toBe(true);
    expect(
      includesLast(
        js,
        "/* slot transformation done by unplugin-transform-react-slots */",
      ),
    ).toBe(true);

    expect(
      includesLast(
        ts,
        `slot.default(React.createElement("default-content-wrapper", null)); `,
      ),
    ).toBe(true);
    expect(
      includesLast(
        ts,
        "/* slot transformation done by unplugin-transform-react-slots */",
      ),
    ).toBe(true);
  });
});
