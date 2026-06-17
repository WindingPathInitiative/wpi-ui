// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
	production: false,
	cognito: {
		region: 'us-east-1',
		userPoolId: 'us-east-1_EW8ym2TET',
		clientId: '7jb1m6g5em511a0f61ji84s0dq',
		idp_endpoint: '',
		identity_endpoint: '',
		sts_endpoint: '',
		setCookie: true,
		cookieDomain: '',
		cookieSecure: false
	},
	hub: {
		url: '/api/hub/v1/'
	}
};
