import * as vscode from 'vscode';
import path from 'path';
import dotenv from 'dotenv';
import { runAgentFixLoop } from './openRouter/agent';

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand('corrector.fixFile', async () => {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No file is open');
      return;
    }

    const envPath = path.resolve(context.extensionPath, '.env');
    dotenv.config({ path: envPath });

    vscode.window.showInformationMessage('Connecting to LLM and scanning the file');
    const result = await runAgentFixLoop();
    console.log(result);

    vscode.window.showInformationMessage('Correcting has been complete');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }
