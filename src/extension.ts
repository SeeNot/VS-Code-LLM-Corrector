import * as vscode from 'vscode';
import { sendPromt } from './openRouter';
import path from 'path';
import dotenv from 'dotenv';
import reviewPromt from './promts/default';

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand('corrector.fixFile', async () => {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No file is open');
      return;
    }

    const envPath = path.resolve(context.extensionPath, '.env');
    dotenv.config({ path: envPath });

    const document = editor.document;
    const diagnosis = vscode.languages.getDiagnostics(document.uri);
    const errors = diagnosis.map(d => {
      const line = `Error start on line ${d.range.start} and ends on ${d.range.end}`;
      const severity = d.severity;

      return `${severity}: ${line} ${d.message}`;
    });

    const fullText = document.getText();
    const promt = reviewPromt() + fullText + errors;
    console.log(promt);

    vscode.window.showInformationMessage('Connecting to LLM and scanning the file');
    const answer = await sendPromt(promt);
    console.log(answer);

    vscode.window.showInformationMessage('Correcting has been complete');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }
