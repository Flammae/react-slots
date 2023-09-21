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
	const disabledNoImport = readFile("./dist/disabled-no-import.js");
	const disabledNoImportTS = readFile("./dist/disabled-no-import-ts.js");

	const disabledWithPragma = readFile("./dist/disabled-with-pragma.js");
	const disabledWithPragmaTS = readFile("./dist/disabled-with-pragma-ts.js");

	const working = readFile("./dist/working.js");
	const workingTS = readFile("./dist/working-ts.js");

	test("won't transform when not imported", async () => {
		const [js, ts] = await Promise.all([disabledNoImport, disabledNoImportTS]);
		expect(includesLast(js, "React.createElement(slot.default, null)")).toBe(
			true
		);
		expect(includesLast(ts, "React.createElement(slot.default, null)")).toBe(
			true
		);
	});
	test("won't transform when disabled with pragma", async () => {
		const [js, ts] = await Promise.all([
			disabledWithPragma,
			disabledWithPragmaTS,
		]);
		expect(includesLast(js, "React.createElement(slot.default, null)")).toBe(
			true
		);
		expect(includesLast(ts, "React.createElement(slot.default, null)")).toBe(
			true
		);
	});
	test("transforms slot elements to functions", async () => {
		const [js, ts] = await Promise.all([working, workingTS]);
		expect(includesLast(js, "slot.default(null)")).toBe(true);
		expect(includesLast(ts, "slot.default(null)")).toBe(true);
	});
});
