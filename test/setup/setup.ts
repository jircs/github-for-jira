import nock from "nock";
import env from "../../src/config/env";
import "./matchers/to-have-sent-metrics";
import "./matchers/nock";
import "./matchers/to-promise";
import statsd from "../../src/config/statsd";
import { sequelize } from "../../src/models/sequelize";
import InstallationTokenCache from "../../src/github/client/installation-token-cache";
import AppTokenHolder from "../../src/github/client/app-token-holder";

resetEnvVars();

function resetEnvVars() {
	// Assign defaults to process.env, but don't override existing values if they
	// are already set in the environment.
	process.env = {
		...process.env,
		...env
	};
}

declare global {
	let jiraHost: string;
	let jiraNock: nock.Scope;
	let githubNock: nock.Scope;
	let gheNock: nock.Scope;
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		interface Global {
			jiraHost: string;
			jiraNock: nock.Scope;
			githubNock: nock.Scope;
			gheNock: nock.Scope;
		}
	}
}

beforeEach(() => {
	resetEnvVars();
	global.jiraHost = process.env.ATLASSIAN_URL || "";
	global.jiraNock = nock(global.jiraHost);
	global.githubNock = nock("https://api.github.com");
	global.gheNock = nock("http://github.mydomain.com");
});

// Checks to make sure there's no extra HTTP mocks waiting
// Needs to be in it's own aftereach so that the expect doesn't stop it from cleaning up afterwards
afterEach(() => {
	try {
		// eslint-disable-next-line jest/no-standalone-expect
		expect(nock).toBeDone();
	} finally {
		InstallationTokenCache.getInstance().clear(); // Clear Installation token cache
		AppTokenHolder.getInstance().clear(); // Clear App token cache
		nock.cleanAll(); // removes HTTP mocks
		jest.resetAllMocks(); // Removes jest mocks
	}
});

afterAll(async () => {
	// TODO: probably missing things like redis and other things that need to close down
	// Close connection when tests are done
	await sequelize.close();
	// stop only if setup did run. If using jest --watch and no tests are matched
	// we need to not execute the require() because it will fail
	// TODO: fix wrong typing for statsd
	statsd.close(() => undefined);
});
