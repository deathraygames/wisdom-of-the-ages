/* eslint-disable quotes, quote-props */
const isWindows = (process.platform === 'win32');
const linebreakStyle = isWindows ? 'windows' : 'unix';

module.exports = {
	"env": {
		"browser": true,
		// "jest/globals": true,
		// "es6": true
	},
	"extends": "airbnb-base",
	// "plugins": ["jest"],
	"globals": {
		// "Atomics": "readonly",
		// "SharedArrayBuffer": "readonly"
	},
	"ignorePatterns": [
		"scripts/libs/*",
		"little-engine-esm-build.all.js",
	],
	"parserOptions": {
		"ecmaVersion": 2018,
		"sourceType": "module",
	},
	"rules": {
		"indent": ["error", "tab"],
		"no-tabs": ["warn", { allowIndentationTabs: true }],
		"linebreak-style": ["error", linebreakStyle],
		"import/extensions": ["warn", "always"],
		"no-console": ["warn", { allow: ["warn", "error"] }],
		"max-lines": ["error", { "max": 999, "skipComments": true }],
		"object-curly-newline": ["warn", { multiline: true, minProperties: 10 }],
		"no-plusplus": ["off"],
		"no-floating-decimal": ["off"],
		"default-param-last": ["warn"],
	},
};
