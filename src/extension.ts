// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { sendPromt } from './openRouter';
import path from 'path';
import dotenv from 'dotenv';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand('corrector.helloWorld', async () => {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No file is open');
      return;
    }

    const envPath = path.resolve(context.extensionPath, '.env');
    dotenv.config({ path: envPath });

    const document = editor.document;

    const fullText = document.getText();
    const language = document.languageId;

    const promt = "What is happening in this code:\n" + fullText;

    vscode.window.showInformationMessage('Connecting to LLM and scanning the file');
    const answer = await sendPromt(promt);
    console.log(answer);

    vscode.window.showInformationMessage('Correcting has been complete');
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
