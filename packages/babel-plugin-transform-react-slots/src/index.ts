import { types as t, type NodePath } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import {
	type PathToValue,
	goThroughMemberExpression,
	getValuesFromVarDeclarator,
	getJSXElement,
	ANY_PROPERTY,
	jsxNameToCallee,
	skipTS,
} from "./utils";
import { default as syntaxJSX } from "@babel/plugin-syntax-jsx";
import rawCodeStore from "./rawCodeStore";
import {
	UnsupportedMemberExpressionError,
	UnsupportedSyntaxError,
	VarDeclarationError,
} from "./errors";

// TODO: move constants to a shared package
const LIB_SOURCE = "@beqa/react-slots";
const IMPORTED_NODE = "useSlot";
const SLOT_OBJECT_NAME = "slot";
const DISABLED_REGEX = /\s*disable-transform-react-slots\s*/;

function isDisabled(
	comments: (t.CommentLine | t.CommentBlock)[] | null | undefined,
	programBody: t.Statement[]
) {
	if (!comments) {
		return false;
	}

	let currentIndex = 0;

	while (
		comments[currentIndex] &&
		comments[currentIndex]!.start !== undefined &&
		programBody[0] &&
		programBody[0].start !== undefined &&
		comments[currentIndex]!.start! < programBody[0].start!
	) {
		if (DISABLED_REGEX.test(comments[currentIndex]!.value)) {
			return true;
		}
	}

	if (
		(comments[currentIndex] && comments[currentIndex]!.start === undefined) ||
		(programBody[0] && programBody[0].start !== undefined)
	) {
		throw new Error(
			"Could not read comments for @beqa/react-slots while looking for a `disable-transform-react-slots` pragma. Please open a new issue on our Github repo."
		);
	}

	return false;
}

/** Find all useSlot imports (It's possible for the lib to be imported multiple times) */
function findImports(
	path: NodePath<t.Program>
): [t.ImportSpecifier[], t.ImportNamespaceSpecifier[]] {
	const importNodes = path.node.body.filter((node) => {
		return t.isImportDeclaration(node) && node.source.value === LIB_SOURCE;
	}) as t.ImportDeclaration[];

	let imports = [];
	let namespaceImports = [];

	for (let node of importNodes) {
		for (let specifier of node.specifiers) {
			if (t.isImportNamespaceSpecifier(specifier)) {
				namespaceImports.push(specifier);
			} else if (
				t.isImportSpecifier(specifier) &&
				(specifier.imported as any).name === IMPORTED_NODE
			) {
				imports.push(specifier);
			}
		}
	}

	return [imports, namespaceImports];
}

/**
 * Find all useSlot or alias call expressions.
 * Will mutate callExpressions array to include new references
 **/
function findCallExpressions(
	referencePaths: NodePath<t.Node>[],
	pathToUseSlot: PathToValue = [],
	callExpressions: NodePath<t.CallExpression>[]
) {
	for (const ref of referencePaths) {
		const path = pathToUseSlot.slice();

		let nodePath;

		try {
			nodePath = goThroughMemberExpression(ref, path);
		} catch (err) {
			if (err instanceof UnsupportedMemberExpressionError) {
				err.throw(
					`Unsupported syntax: Member expression accessing a \`useSlot\` value can only use dot notation or bracket notation (iff the value is a string literal). Allowed syntax is: \`ReactSlots.useSlot\` or \`ReactSlots["useSlot"]\`.`
				);
			}
			throw err;
		}

		if (nodePath === null) {
			continue;
		}

		let parentPath = skipTS(nodePath.parentPath)!;

		if (t.isExpressionStatement(parentPath.node)) {
			continue;
		}

		// TODO: also allow object variable declarations `let x = {a: {b: useSlot}}`

		if (
			t.isCallExpression(parentPath.node) &&
			skipTS(parentPath.get("callee") as NodePath<t.Node>)?.node ===
				nodePath.node
		) {
			if (path.length !== 0) {
				// Call expression on an ancestor of useSlot
				new UnsupportedSyntaxError(parentPath.node.loc).throw(
					"Unsupported syntax: Object that holds the nested `useSlot` value was used as a function. Did you mean to do " +
						"`" +
						rawCodeStore
							.get()
							.slice(
								parentPath.node.callee.start || 0,
								parentPath.node.callee.end || 0
							) +
						"." +
						path.reverse().join(".") +
						"()" +
						"`?"
				);
			}

			callExpressions.push(parentPath as NodePath<t.CallExpression>);
		} else if (t.isVariableDeclarator(parentPath.node)) {
			try {
				const newIdentifiers = getValuesFromVarDeclarator(
					parentPath as NodePath<t.VariableDeclarator>,
					path
				);

				if (newIdentifiers.size) {
					for (const [newIdentifier, newPath] of newIdentifiers) {
						findCallExpressions(
							newIdentifier.scope.bindings[newIdentifier.node.name]!
								.referencePaths,
							newPath,
							callExpressions
						);
					}
				}
			} catch (err) {
				if (err instanceof VarDeclarationError) {
					err.throw(
						"Unsupported syntax: You must only use `let` or `const` variable declarations with `useSlot`, instead encountered " +
							err.kind +
							"."
					);
				}
				throw err;
			}
		} else {
			// error
			new UnsupportedSyntaxError(parentPath.node.loc).throw(
				"Unsupported syntax: `useSlot` or an object holding a nested `useSlot` value used inside " +
					parentPath.node.type +
					"."
			);
		}
	}
}

function findJSXElements(
	referencePaths: NodePath<t.Node>[],
	pathToSlottable: PathToValue, // [ANY_Property, "slot"]
	jsxElements: NodePath<t.JSXElement>[]
) {
	for (let ref of referencePaths) {
		const path = pathToSlottable.slice();

		if (t.isJSXIdentifier(ref.node)) {
			const jsxElement = getJSXElement(ref as NodePath<t.JSXIdentifier>, path);
			if (jsxElement) {
				jsxElements.push(jsxElement);
			}
		} else {
			let nodePath;
			try {
				nodePath = goThroughMemberExpression(ref, path);
			} catch (err) {
				if (err instanceof UnsupportedMemberExpressionError) {
					err.throw(
						'Unsupported syntax: Member expression accessing a slottable node can only use dot notation or bracket notation (iff the value is a string literal). eg: `useSlot().slot.default` or `useSlot()["slot"].default`.'
					);
				}
			}

			if (nodePath === null || nodePath === undefined) {
				continue;
			}

			let parentPath = skipTS(nodePath.parentPath)!;

			if (
				t.isCallExpression(parentPath.node) &&
				path.length === 0 &&
				skipTS(parentPath.get("callee") as NodePath<t.Node>)?.node ===
					nodePath.node
			) {
				// Using the call signature of slot element
				continue;
			}

			if (t.isExpressionStatement(parentPath.node)) {
				// eg: ReactSlots.useSlot(); or slot.default; (no assignment) hurts no one
				continue;
			}

			if (t.isVariableDeclarator(parentPath.node)) {
				try {
					const newIdentifiers = getValuesFromVarDeclarator(
						parentPath as NodePath<t.VariableDeclarator>,
						path
					);
					if (newIdentifiers.size) {
						for (const [newIdentifier, newPath] of newIdentifiers) {
							const { scope, node } = newIdentifier;
							findJSXElements(
								scope.bindings[node.name]!.referencePaths,
								newPath,
								jsxElements
							);
						}
					}
				} catch (err) {
					if (err instanceof VarDeclarationError) {
						err.throw(
							"Unsupported syntax: You must only use `let` or `const` variable declarations for slottable elements, instead encountered " +
								err.kind
						);
					}
					throw err;
				}
			} else {
				new UnsupportedSyntaxError(parentPath.node.loc).throw(
					"Unsupported syntax: A slottable element or an object holding a nested slottable element used inside " +
						parentPath.node.type
				);
			}
		}
	}
}

function transformJSXElements(element: NodePath<t.JSXElement>) {
	const defaultContent = element.node.children;
	const props = element.node.openingElement.attributes.map((attr) => {
		if (t.isJSXSpreadAttribute(attr)) {
			return t.spreadElement(attr.argument);
		}
		attr.value;

		return t.objectProperty(
			t.isJSXNamespacedName(attr.name)
				? t.identifier(`${attr.name.namespace}:${attr.name.name}`)
				: t.identifier(attr.name.name),
			// I don't think attr.value can ever be JSXEmptyExpression or
			// attr.value.expression can be undefined
			// but it's there in ts declarations so we are handling it.
			t.isJSXExpressionContainer(attr.value)
				? t.isJSXEmptyExpression(attr.value.expression)
					? t.identifier("undefined")
					: attr.value.expression
				: attr.value === null || attr.value === undefined
				? t.booleanLiteral(true)
				: attr.value
		);
	});

	const callExpression = t.callExpression(
		jsxNameToCallee(element.node.openingElement.name),
		[
			defaultContent.length
				? t.jSXFragment(
						t.jSXOpeningFragment(),
						t.jSXClosingFragment(),
						defaultContent
				  )
				: t.nullLiteral(),
			(props.length && t.objectExpression(props)) as t.ObjectExpression,
		].filter(Boolean)
	);

	element.replaceWith(
		t.isJSXElement(element.parent) || t.isJSXFragment(element.parent)
			? t.inherits(t.jSXExpressionContainer(callExpression), element.node)
			: t.inherits(callExpression, element.node)
	);
}

type State<BabelState> = BabelState & {
	jsxElements: Set<t.JSXElement>;
};

export default declare((api) => {
	api.assertVersion(7);

	return {
		name: "transform-react-slots",
		inherits: syntaxJSX,
		pre(file) {
			rawCodeStore.set(file.code);
		},
		post(file) {
			rawCodeStore.set("");
		},
		visitor: {
			Program: {
				enter(path, _state) {
					if (isDisabled(_state.file.ast.comments, path.node.body)) {
						return;
					}

					const [imports, namespaceImports] = findImports(path);
					// TODO: disallow var declarations

					// Exit early if no useSlot imports
					if (!imports.length && !namespaceImports.length) {
						return;
					}

					const callExpressions: NodePath<t.CallExpression>[] = [];

					for (const importNode of imports) {
						findCallExpressions(
							path.scope.bindings[importNode.local.name]!.referencePaths,
							[],
							callExpressions
						);
					}
					for (const importNode of namespaceImports) {
						findCallExpressions(
							path.scope.bindings[importNode.local.name]!.referencePaths,
							[IMPORTED_NODE],
							callExpressions
						);
					}
					const jsxElements: NodePath<t.JSXElement>[] = [];

					findJSXElements(
						callExpressions,
						[ANY_PROPERTY, SLOT_OBJECT_NAME],
						jsxElements
					);

					const state: State<typeof _state> = _state as any;

					state.jsxElements = new Set(jsxElements.map((path) => path.node));

					// transformJSXElements(jsxElements);
				},
			},
			JSXElement: {
				enter(path, _state) {
					const state: State<typeof _state> = _state as any;

					if (state.jsxElements.has(path.node)) {
						state.jsxElements.delete(path.node);
						transformJSXElements(path);
					}
				},
			},
		},
	};
});
