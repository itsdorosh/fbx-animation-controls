import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	{
		files: ['src/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				console: 'readonly',
				document: 'readonly',
				window: 'readonly',
				HTMLElement: 'readonly',
				Element: 'readonly',
				Date: 'readonly',
				parseInt: 'readonly',
				parseFloat: 'readonly',
				isNaN: 'readonly',
			},
		},
		rules: {
			...prettierConfig.rules,
			'no-unused-vars': 'warn',
			'no-console': 'off',
		},
	},
	{
		files: ['src/**/*.test.js', 'src/__tests__/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				console: 'readonly',
				document: 'readonly',
				window: 'readonly',
				HTMLElement: 'readonly',
				Element: 'readonly',
				Date: 'readonly',
				parseInt: 'readonly',
				parseFloat: 'readonly',
				isNaN: 'readonly',
				// Jest globals
				describe: 'readonly',
				test: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
				jest: 'readonly',
			},
		},
		rules: {
			...prettierConfig.rules,
			'no-unused-vars': 'warn',
			'no-console': 'off',
		},
	},
	{
		files: ['jest.setup.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				console: 'readonly',
				document: 'readonly',
				window: 'readonly',
				global: 'readonly',
				jest: 'readonly',
			},
		},
		rules: {
			...prettierConfig.rules,
			'no-unused-vars': 'off',
			'no-console': 'off',
			'no-undef': 'off',
		},
	},
];
