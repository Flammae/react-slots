let _rawCode: string;

export default {
	get() {
		return _rawCode;
	},

	set(rawCode: string) {
		return (_rawCode = rawCode);
	},
};
