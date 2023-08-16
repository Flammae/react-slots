import { types as t, type NodePath } from "@babel/core";
import {
	JSXNamespacedNameError,
	UnsupportedMemberExpressionError,
	VarDeclarationError,
} from "./errors";

/** A wildcard for PathToValue to match any property on an object */
export const ANY_PROPERTY = Symbol("AnyProperty");
/**
 * Array of strings representation of a member expression,
 * Where the leftmost item is the value and everything next to it
 * is a parent of the previous value:
 * @example a.b.c -> ["b", "a"]
 */
export type PathToValue = (string | symbol)[];

function isIdentifierWithName(
	node: t.Node | null | undefined,
	name: PathToValue[number]
): node is t.Identifier {
	return (
		t.isIdentifier(node) && (name === ANY_PROPERTY ? true : node.name === name)
	);
}

export function isJSXIdentifierWithName(
	node: t.Node | null | undefined,
	name: PathToValue[number]
): node is t.JSXIdentifier {
	return (
		t.isJSXIdentifier(node) &&
		(name === ANY_PROPERTY ? true : node.name === name)
	);
}

function isStringLiteralWithValue(
	node: t.Node | null | undefined,
	value: PathToValue[number]
): node is t.StringLiteral {
	return (
		t.isStringLiteral(node) &&
		(value === ANY_PROPERTY ? true : node.value === value)
	);
}

export function skipTS(
	nodePath: NodePath<t.Node> | null
): NodePath<t.Node> | null {
	if (nodePath === null) {
		return null;
	}

	if (
		t.isTSAsExpression(nodePath.node) ||
		t.isTSTypeAssertion(nodePath.node) ||
		t.isTSSatisfiesExpression(nodePath.node)
	) {
		return skipTS(nodePath.parentPath);
	}

	return nodePath;
}

/**
 * ** Mutates pathToValue array**
 *
 * If referenced identifier is an object in a Member expression,
 * check if this expression is accessing the value or an ancestor of the value.
 * If so, mutate pathToValue and return the parent node of the expression.
 * Empty array means the value is accessed.
 * If the expression is accessing a different path, null is returned.
 *
 * @throws {UnsupportedMemberExpressionError}
 *
 * @example ```ts
 * // z holds our value in x.y.z
 * getMemberExpressionParent(getX('let declaration = x.y'), ['z', 'y'])); // return: VariableDeclarator, path: ['z']
 * getMemberExpressionParent(getX('let declaration = x.y.z'), ['z', 'y'])); // return: VariableDeclarator, path: []
 * ```
 */
export function goThroughMemberExpression(
	identifier: NodePath<t.Node>,
	pathToValue: PathToValue
): NodePath<t.Node> | null {
	let parent = skipTS(identifier.parentPath);
	let child = skipTS(identifier);

	if (parent === null) {
		return null;
	}

	while (t.isMemberExpression(parent.node)) {
		const name = pathToValue.at(-1);

		if (name === undefined) {
			// Member expression is trying to access a value deeper than specified in pathToValue
			return null;
		}

		if (
			(!parent.node.computed &&
				isIdentifierWithName(parent.node.property, name)) ||
			(parent.node.computed &&
				isStringLiteralWithValue(parent.node.property, name))
		) {
			pathToValue.pop();
			child = parent;
			parent = skipTS(parent.parentPath)!;
		} else if (
			(!parent.node.computed && t.isIdentifier(parent.node.property)) ||
			t.isStringLiteral(parent.node.property)
		) {
			// It's still a type of property that does not break our logic, but the paths have diverged
			return null;
		} else {
			// computed property / Expression
			// eg: ReactSlots[useSlot] or ReactSlots["use" + "Slot"]
			throw new UnsupportedMemberExpressionError(parent.node.loc);
		}
	}

	return child;
}

/**
 * **Mutates the pathToValue array**.
 *
 * Get which identifiers in the object pattern hold the value (if any).
 * If no identifiers, return empty array.
 */
function getValuesFromObjectPattern(
	objectPattern: NodePath<t.ObjectPattern>,
	pathToValue: PathToValue,
	identifiers: Map<NodePath<t.Identifier>, PathToValue>
): void {
	for (let prop of objectPattern.get("properties")) {
		if (t.isRestElement(prop.node)) {
			const identifier = prop.get("argument") as NodePath<t.Identifier>;
			identifiers.set(identifier, pathToValue.slice());
			break;
		}

		if (
			pathToValue.length > 0 &&
			t.isObjectProperty(prop.node) &&
			isIdentifierWithName(prop.node.key, pathToValue.at(-1)!)
		) {
			const name = pathToValue.pop();

			if (t.isIdentifier(prop.node.value)) {
				identifiers.set(
					prop.get("value") as NodePath<t.Identifier>,
					pathToValue.slice()
				);
				if (name === ANY_PROPERTY) {
					pathToValue.push(name);
					continue;
				}
				break;
			}

			if (t.isObjectPattern(prop.node.value)) {
				getValuesFromObjectPattern(
					prop.get("value") as NodePath<t.ObjectPattern>,
					pathToValue,
					identifiers
				);

				if (name === ANY_PROPERTY) {
					pathToValue.push(name);
					continue;
				}
				break;
			}
		}
	}
}

/**
 * **Mutates the pathToValue array**.
 *
 * Get values from variable declarator.
 * Supports direct assignment and object destructuring.
 * Returned map holds a new pathToValue for every specific identifier.
 * pathToValue that was passed as an argument will be the same as pathToValue
 * for the last (rightmost) identifier
 *
 * @throws {VarDeclarationError}
 */
export function getValuesFromVarDeclarator(
	varDeclarator: NodePath<t.VariableDeclarator>,
	pathToValue: PathToValue
): Map<NodePath<t.Identifier>, PathToValue> {
	const identifiers = new Map<NodePath<t.Identifier>, PathToValue>();

	const varDeclaration = varDeclarator.parent as t.VariableDeclaration;
	if (!["const", "let"].includes(varDeclaration.kind)) {
		throw new VarDeclarationError(varDeclaration.kind, varDeclaration.loc);
	}

	if (t.isIdentifier(varDeclarator.node.id)) {
		identifiers.set(
			varDeclarator.get("id") as NodePath<t.Identifier>,
			pathToValue.slice()
		);
	} else if (t.isObjectPattern(varDeclarator.node.id)) {
		getValuesFromObjectPattern(
			varDeclarator.get("id") as NodePath<t.ObjectPattern>,
			pathToValue,
			identifiers
		);
	}

	// Array expression is currently unsupported. Silently ignore
	return identifiers;
}

/**
 * ** Modifies pathToSlottable array **
 *
 * Validates wether the expression accesses slottable node in a jsx element.
 * If so, returns the parent of the expression, otherwise null;
 */
export function getJSXElement(
	path: NodePath<t.JSXIdentifier>,
	pathToSlottable: PathToValue
): NodePath<t.JSXElement> | null {
	let parent = path.parentPath;

	while (t.isJSXMemberExpression(parent.node)) {
		const name = pathToSlottable.at(-1);

		if (name === undefined) {
			// JSX member expression is trying to access some value deeper than specified in pathToSlottable
			return null;
		}

		if (!isJSXIdentifierWithName(parent.node.property, name)) {
			return null;
		}

		pathToSlottable.pop();
		parent = parent.parentPath!;
	}

	if (pathToSlottable.length > 0) {
		// JSX element is ancestor of the slottable node
		return null;
	}

	if (t.isJSXClosingElement(parent.node)) {
		return null;
	}

	return parent.parentPath as NodePath<t.JSXElement>;
}

/** @throws {JSXNamespacedNameError} */
export function jsxNameToCallee(
	el: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName
): t.MemberExpression | t.Identifier {
	if (t.isJSXIdentifier(el)) {
		return t.identifier(el.name);
	}

	if (t.isJSXNamespacedName(el)) {
		// Doesn't check JSXNamespacedName because those aren't available in react and slots can't be namespaced
		throw new JSXNamespacedNameError(el.loc);
	}

	return t.memberExpression(
		jsxNameToCallee(el.object as any),
		t.identifier(el.property.name),
		false
	);
}
