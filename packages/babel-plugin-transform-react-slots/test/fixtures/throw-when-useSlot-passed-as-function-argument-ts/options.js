module.exports = {
	throws: true,
	babelOptions: {
		presets: [
			[
				"@babel/preset-env",
				{
					// Leave import syntax alone
					modules: false,
					targets: "maintained node versions",
				},
			],
			["@babel/preset-typescript", { allowDeclareFields: true }],
		],
	},
};
