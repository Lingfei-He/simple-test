// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {SimpleTestProvider, treeViewSetting} from './tree';
import { currentPanels } from 'vscode-wizard/lib/pageImpl';
const fs = require('fs');
const path = require('path');

import { ExtensionContext, languages, commands, Disposable, workspace, window } from 'vscode';
import { CodelensProvider, CodelensProvider2 } from './codelen';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
let rootPath: string|null = null;
let provider: SimpleTestProvider|null = null;
let treeView: vscode.TreeView<vscode.TreeItem>|null = null;

function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "simple-test" is now active!');
	const workDir = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;

	rootPath= path.join(workDir, '.simple-tests');
	if(fs.existsSync(rootPath) && fs.statSync(rootPath).isDirectory()){
		
	}
	else{
		fs.mkdirSync(rootPath);
	}
	// console.log(rootPath)
	provider = new SimpleTestProvider(rootPath);
	treeView = vscode.window.createTreeView('simpleTest', {treeDataProvider: provider});
	treeViewSetting();

	// vscode.window.registerTreeDataProvider('simpleTest', provider);
	vscode.commands.registerCommand('simpleTest.refresh', provider.refresh, provider);
	vscode.commands.registerCommand('simpleTest.add', provider.addUnit, provider);
	vscode.commands.registerCommand('simpleTest.addParamGroup', provider.addParamGroup, provider);
	vscode.commands.registerCommand('simpleTest.delete', provider.delete);
	vscode.commands.registerCommand('simpleTest.navigateSource', provider.navigateSource);
	vscode.commands.registerCommand('simpleTest.run', provider.run, provider);

	// const codelensProvider2 = new CodelensProvider2();
	const codelensProvider = new CodelensProvider();
	

	languages.registerCodeLensProvider("*", codelensProvider);
	// languages.registerCodeLensProvider("*", codelensProvider2);

	commands.registerCommand("simpleTest.enableCodeLens", () => {
		workspace.getConfiguration("codelens-sample").update("enableCodeLens", true, true);
	});

	commands.registerCommand("simpleTest.disableCodeLens", () => {
		workspace.getConfiguration("codelens-sample").update("enableCodeLens", false, true);
	});

	// commands.registerCommand("simpleTest.codelensAction", (args: any) => {
	// 	window.showInformationMessage(`CodeLens action clicked with args=${args}`);
	// });
	
	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// inspectPythonCallables('D:/documents/AcademicDocuments/other/pytest-output/simple-test/re/python/_inspect.py')

	// let disposable = vscode.commands.registerCommand('simple-test.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from simple test!');
	// });

	// context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}
export {
	activate,
	deactivate,
	rootPath,
	treeView,
	provider
};
