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

    const extraInstructions = await vscode.window.showInputBox({
      title: "Corrector: extra instructions (optional)",
      prompt: "Add any context or constraints for the AI (optional)",
      placeHolder: "e.g. 'Only fix type errors; do not change behavior' or 'Prefer minimal diff'",
      ignoreFocusOut: true,
    });

    const envPath = path.resolve(context.extensionPath, '.env');
    dotenv.config({ path: envPath });

    vscode.window.showInformationMessage('Connecting to LLM and scanning the file');
    await runAgentFixLoop(3, extraInstructions ?? "");

    vscode.window.showInformationMessage('Correcting has been complete');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }
