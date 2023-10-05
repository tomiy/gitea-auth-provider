// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GiteaAuthenticationProvider } from './authProvider';
import 'isomorphic-fetch';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gitea-auth-provider" is now active!');

	// Register our authentication provider. NOTE: this will register the provider globally which means that
	// any other extension can use this provider via the `getSession` API.
	// NOTE: when implementing an auth provider, don't forget to register an activation event for that provider
	// in your package.json file: "onAuthenticationRequest:GiteaPAT"
	context.subscriptions.push(vscode.authentication.registerAuthenticationProvider(
		GiteaAuthenticationProvider.id,
		'Gitea',
		new GiteaAuthenticationProvider(context.secrets),
	));

	let disposable = vscode.commands.registerCommand('gitea-auth-provider.login', async () => {
		// Get our PAT session.
		const session = await vscode.authentication.getSession(GiteaAuthenticationProvider.id, [], { createIfNone: true });

		try {
			let giteaConf = vscode.workspace.getConfiguration('gitea');

			let giteaURL = giteaConf.get('url');

			if(!giteaURL) {
				giteaURL = await vscode.window.showInputBox({
					ignoreFocusOut: true,
					placeHolder: 'Gitea base URL',
					prompt: 'Enter the Gitea URL to test api connection.'
				});

				giteaConf.update('url', giteaURL);
			}

			// Note: this example doesn't do any validation of the token beyond making sure it's not empty.
			if (!giteaURL) {
				throw new Error('Gitea URL is required');
			}

			// Make a request to the Gitea API.
			const req = await fetch(`${giteaURL}/api/v1/user`, {
				headers: {
					authorization: `token ${session.accessToken}`,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					'content-type': 'application/json',
				},
			});
			if (!req.ok) {
				throw new Error(req.statusText);
			}
			const res = await req.json() as { login: string };
			vscode.window.showInformationMessage(`Hello ${res.login}`);
		} catch (e: any) {
			throw e;
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
