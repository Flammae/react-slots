import babel from "@babel/core";
import {
	ANY_PROPERTY,
	getJSXElement,
	goThroughMemberExpression,
	getValuesFromVarDeclarator,
} from "../src/utils";
import plugin from "../src";

describe("goThroughMemberExpression", () => {
	test("returns the first member expression when directly accessing the value; `pathToValue` becomes empty", () => {
		const ast = babel.parse(`let x = a.b.c`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				let pathToA: any;

				path.traverse({
					Identifier(path) {
						if (path.node.name === "a") {
							pathToA = path;
						}
					},
				});

				const pathToValue = ["c", "b"];
				const parent = goThroughMemberExpression(pathToA, pathToValue) as any;
				expect(parent.node.property.name).toBe("c");
				expect(pathToValue).toEqual([]);
			},
		});
	});

	test("`pathToValue` holds remaining property names when the expression is accessing an ancestor of the value", () => {
		const ast = babel.parse(`let x = a.b.c`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				let pathToA: any;

				path.traverse({
					Identifier(path) {
						if (path.node.name === "a") {
							pathToA = path;
						}
					},
				});

				const pathToValue = ["d", "c", "b"];
				const parent = goThroughMemberExpression(pathToA, pathToValue);
				expect(pathToValue).toEqual(["d"]);
			},
		});
	});

	test("returns null when the expression goes deeper than specified; `pathToValue` becomes empty", () => {
		const ast = babel.parse(`let x = a.b.c.d`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				let pathToA: any;

				path.traverse({
					Identifier(path) {
						if (path.node.name === "a") {
							pathToA = path;
						}
					},
				});

				const pathToValue = ["c", "b"];
				const parent = goThroughMemberExpression(pathToA, pathToValue);
				expect(parent).toBeNull();
				expect(pathToValue).toEqual([]);
			},
		});
	});

	test("returns null when path is different than specified. The array holds remaining property names from the moment the paths diverged", () => {
		const ast = babel.parse(`let x = a.b.x.y`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				let pathToA: any;

				path.traverse({
					Identifier(path) {
						if (path.node.name === "a") {
							pathToA = path;
						}
					},
				});

				const pathToValue = ["d", "c", "b"];
				const parent = goThroughMemberExpression(pathToA, pathToValue);
				expect(parent).toBeNull();
				expect(pathToValue).toEqual(["d", "c"]);
			},
		});
	});

	test("accepts call expression nodes as arguments", () => {
		const ast = babel.parse(`let x = a().b.c`)!;
		babel.traverse(ast, {
			CallExpression(path) {
				const pathToValue = ["c", "b"];
				const parent = goThroughMemberExpression(path, pathToValue) as any;
				expect(babel.types.isVariableDeclarator(parent?.parent)).toBe(true);
				expect(pathToValue).toEqual([]);
			},
		});
	});

	test("accepts string literal property paths", () => {
		const ast = babel.parse(`let x = a["b"].c`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				let pathToA: any;

				path.traverse({
					Identifier(path) {
						if (path.node.name === "a") {
							pathToA = path;
						}
					},
				});

				const pathToValue = ["c", "b"];
				const parent = goThroughMemberExpression(pathToA, pathToValue);
				expect(babel.types.isVariableDeclarator(parent?.parent)).toBe(true);
				expect(pathToValue).toEqual([]);
			},
		});
	});

	test("can match ANY_PROPERTY wildcard", () => {
		const ast = babel.parse(`let x = a.b.c.d`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				let pathToA: any;

				path.traverse({
					Identifier(path) {
						if (path.node.name === "a") {
							pathToA = path;
						}
					},
				});

				const pathToValue = ["e", ANY_PROPERTY, "c", ANY_PROPERTY];
				const parent = goThroughMemberExpression(pathToA, pathToValue);
				expect(babel.types.isVariableDeclarator(parent?.parent)).toBe(true);
				expect(pathToValue).toEqual(["e"]);
			},
		});
	});
});

describe("getValueFromVarDeclarator", () => {
	test("returns the identifier from the object pattern that holds the value", () => {
		const ast = babel.parse(`let { a: {b}, c } = literally.anything`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				const pathToValue = ["b", "a"];
				for (const [identifier, newPathToValue] of getValuesFromVarDeclarator(
					path,
					pathToValue
				)) {
					expect(identifier.node.name).toBe("b");
					expect(newPathToValue).toEqual([]);
					expect(pathToValue).toEqual([]);
				}
			},
		});
	});

	test("returns the identifier from the object pattern that's the ancestor of the value when pathToValue is longer", () => {
		const ast = babel.parse(`let { a, ...c } = [literally.anything]`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				const pathToValue = ["b", "a"];
				for (const [identifier, newPathToValue] of getValuesFromVarDeclarator(
					path,
					pathToValue
				)) {
					expect(identifier.node.name).toBe("a");
					expect(newPathToValue).toEqual(["b"]);
					expect(pathToValue).toEqual(["b"]);
				}
			},
		});
	});

	test("returns the rest operator identifier when destructured properties don't match the path", () => {
		const ast = babel.parse(
			`let { a, b: {c, ...rest2}, ...rest1 } = [literallyAnything]`
		)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				const pathToValue = ["e", "d", "b"];

				for (const [identifier, newPathToValue] of getValuesFromVarDeclarator(
					path,
					pathToValue
				)) {
					expect(identifier.node.name).toBe("rest2");
					expect(newPathToValue).toEqual(["e", "d"]);
					expect(pathToValue).toEqual(["e", "d"]);
				}
			},
		});
	});

	test("returns the identifier with the new name", () => {
		const ast = babel.parse(`let { a, b: c } = ['literally.anything']`)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				const pathToValue = ["d", "b"];

				for (const [identifier, newPathToValue] of getValuesFromVarDeclarator(
					path,
					pathToValue
				)) {
					expect(identifier.node.name).toBe("c");
					expect(newPathToValue).toEqual(["d"]);
					expect(pathToValue).toEqual(["d"]);
				}
			},
		});
	});

	test("returns empty map when the paths have diverged", () => {
		const ast = babel.parse(
			`let { a: { b: { d } } } = ['literally.anything']`
		)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				const pathToValue = ["c", "b", "a"];

				const identifiers = getValuesFromVarDeclarator(path, pathToValue);
				expect(identifiers).toEqual(new Map());
				expect(pathToValue).toEqual(["c"]);
			},
		});
	});

	test("returns multiple identifiers when ANY_PROPERTY is used and can match multiple values", () => {
		const ast = babel.parse(
			`let { a: {b, c, d: e, ...rest} } = ['literally.anything']`
		)!;
		babel.traverse(ast, {
			VariableDeclarator(path) {
				const pathToValue = [ANY_PROPERTY, "a"];

				const identifiers = getValuesFromVarDeclarator(path, pathToValue);

				let iterator = identifiers.entries();
				let currentEntry = iterator.next().value;

				expect(currentEntry[0].node.name).toBe("b");
				expect(currentEntry[1]).toEqual([]);
				currentEntry = iterator.next().value;
				expect(currentEntry[0].node.name).toBe("c");
				expect(currentEntry[1]).toEqual([]);
				currentEntry = iterator.next().value;
				expect(currentEntry[0].node.name).toBe("e");
				expect(currentEntry[1]).toEqual([]);
				currentEntry = iterator.next().value;
				expect(currentEntry[0].node.name).toBe("rest");
				expect(currentEntry[1]).toEqual([ANY_PROPERTY]);
				expect(iterator.next().done).toBe(true);
			},
		});
	});
});

describe("getJSXElement", () => {
	test("returns JSXElement when pathToSlottable exactly matches jsx element name", () => {
		const ast = babel.parse(
			`
			<a.b.c>children</a.b.c>;
			<d.e />;
			<f></f>;
		`,
			{ plugins: ["@babel/syntax-jsx"] }
		)!;

		babel.traverse(ast, {
			JSXOpeningElement(path) {
				path.traverse({
					JSXIdentifier(path) {
						switch (path.node.name) {
							case "a": {
								let pathToSlottable = ["c", "b"];
								let el = getJSXElement(path, pathToSlottable);
								expect(babel.types.isJSXElement(el!.node)).toBe(true);
								expect(pathToSlottable).toEqual([]);
								break;
							}
							case "d": {
								let pathToSlottable = [ANY_PROPERTY];
								let el = getJSXElement(path, pathToSlottable);
								expect(babel.types.isJSXElement(el!.node)).toBe(true);
								expect(pathToSlottable).toEqual([]);
								break;
							}
							case "f": {
								let pathToSlottable: any = [];
								let el = getJSXElement(path, pathToSlottable);
								expect(babel.types.isJSXElement(el!.node)).toBe(true);
								expect(pathToSlottable).toEqual([]);
								break;
							}
						}
					},
				});
			},
		});
	});

	test("returns null when performing a match on jSXClosingElement", () => {
		const ast = babel.parse(`<a.b.c>children</a.b.c>;`, {
			plugins: ["@babel/syntax-jsx"],
		})!;
		babel.traverse(ast, {
			JSXClosingElement(path) {
				path.traverse({
					JSXIdentifier(path) {
						if (path.node.name === "a") {
							let pathToSlottable = ["c", "b"];
							let el = getJSXElement(path, pathToSlottable);
							expect(el).toBeNull();
							expect(pathToSlottable).toEqual([]);
						}
					},
				});
			},
		});
	});

	test("returns null when JSXMemberExpression goes deeper than specified in pathToSlottable", () => {
		const ast = babel.parse(`<a.b.c.d>children</a.b.c.d>;`, {
			plugins: ["@babel/syntax-jsx"],
		})!;
		babel.traverse(ast, {
			JSXOpeningElement(path) {
				path.traverse({
					JSXIdentifier(path) {
						if (path.node.name === "a") {
							let pathToSlottable = ["c", "b"];
							let el = getJSXElement(path, pathToSlottable);
							expect(el).toBeNull();
							expect(pathToSlottable).toEqual([]);
						}
					},
				});
			},
		});
	});

	test("returns null when JSXMemberExpression doesn't match pathToSlottable", () => {
		const ast = babel.parse(`<a.b.c>children</a.b.c>;`, {
			plugins: ["@babel/syntax-jsx"],
		})!;
		babel.traverse(ast, {
			JSXOpeningElement(path) {
				path.traverse({
					JSXIdentifier(path) {
						if (path.node.name === "a") {
							let pathToSlottable = ["d", "e", "f"];
							let el = getJSXElement(path, pathToSlottable);
							expect(el).toBeNull();
							expect(pathToSlottable).toEqual(["d", "e", "f"]);
						}
					},
				});
			},
		});
	});

	test("returns null when JSXMemberExpression ends earlier than specified in pathToSlottable", () => {
		const ast = babel.parse(`<a.b>children</a.b>;`, {
			plugins: ["@babel/syntax-jsx"],
		})!;
		babel.traverse(ast, {
			JSXOpeningElement(path) {
				path.traverse({
					JSXIdentifier(path) {
						if (path.node.name === "a") {
							let pathToSlottable = ["c", "b"];
							let el = getJSXElement(path, pathToSlottable);
							expect(el).toBeNull();
							expect(pathToSlottable).toEqual(["c"]);
						}
					},
				});
			},
		});
	});
});

// test.only("test", () => {
// 	const code = babel.transformSync(
// 		`import * as A from "@beqa/react-slots"; x(A.useSlot);`,
// 		{
// 			plugins: [plugin],
// 		}
// 	);
// });
