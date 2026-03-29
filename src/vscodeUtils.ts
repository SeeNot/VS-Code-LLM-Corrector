import * as vscode from "vscode";

export function buildDiagnosticsString(diagnosis: vscode.Diagnostic[]) {
    return diagnosis.map(d => {
      const line = `Error start on line ${d.range.start} and ends on ${d.range.end}`;
      const severity = d.severity;
      return `${severity}: ${line} ${d.message}`;
    }).join("\n");
}


export function getWorkspaceContextFromActiveEditor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("No active editor");
    }
  
    const document = editor.document;
    const fullText = document.getText();
  
    const diagnosis = vscode.languages.getDiagnostics(document.uri);
    const errors = buildDiagnosticsString(diagnosis);
  
    return {
      fileUrl: document.uri.toString(),
      fullText,
      errors
    };
}
 