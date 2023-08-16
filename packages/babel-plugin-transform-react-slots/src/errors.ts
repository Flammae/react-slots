import { types as t, type NodePath } from "@babel/core";
import { codeFrameColumns } from "@babel/code-frame";
import rawCodeStore from "./rawCodeStore";

export class UnsupportedSyntaxError extends Error {
	codeFrame: string;

	constructor(location: t.SourceLocation | null | undefined) {
		super();
		this.codeFrame = location
			? codeFrameColumns(rawCodeStore.get(), location)
			: "";
	}

	throw(message: string) {
		throw new Error(
			`${message}\n\n${this.codeFrame}. This restriction ensures slottable values remain unaltered until used as JSX elements. To prevent compilation for a specific file, add the comment \`disable-transform-react-slots\` at the file's top and use an alternative call signature for the slots.`
		);
	}
}

export class VarDeclarationError extends UnsupportedSyntaxError {
	kind: t.VariableDeclaration["kind"];

	constructor(
		kind: t.VariableDeclaration["kind"],
		location: t.SourceLocation | null | undefined
	) {
		super(location);
		this.kind = kind;
	}
}

export class UnsupportedMemberExpressionError extends UnsupportedSyntaxError {}

export class JSXNamespacedNameError extends UnsupportedSyntaxError {}
