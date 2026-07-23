module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['js', 'json', 'ts'],
	roots: ['<rootDir>/src'],
	testRegex: '.*\\.spec\\.ts$',
	collectCoverageFrom: ['src/auth/**/*.ts', 'src/projects/**/*.ts'],
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
};