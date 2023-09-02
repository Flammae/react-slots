import { pluginTester } from "babel-plugin-tester";
import plugin from "../src/index";
import path from "path";

pluginTester({
	plugin,
	fixtures: path.join(__dirname, "fixtures"),
	fixtureOutputExt: ".mjs",
	babelOptions: {
		parserOpts: { strictMode: true },
	},
});
