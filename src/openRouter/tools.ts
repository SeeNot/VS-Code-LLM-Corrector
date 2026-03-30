import { tool } from "@openrouter/sdk";
import * as vscode from "vscode";
import z from "zod";
import { buildDiagnosticsString } from "../vscodeUtils";

export const getEditTool = tool({
  name: 'edit_file',
  description: 'Edit the file. Can overwrite or search and replace text.',
  inputSchema: z.object({
    operation: z.enum(['write', 'replace']).describe('The type of edit to perform'),
    fileUrl: z.string().optional().describe(
      'A vscode file URL (e.g. "file:///c:/path/to/file.ts") or an absolute path. ' +
      'If omitted, the currently active editor file will be edited. Access is restricted to files inside the current workspace.'
    ),
    content: z.string().describe(
      'Use "write" only to create a brand new file or overwrite entirely. Use "replace" to change existing content of ' +
      'file you have to specify old content that you want to replace and the new content.'
    ),
    oldContent: z.string().optional().describe(
      'Only required for "replace" operation. The text to be replaced. It needs to be exactly the same, ' +
      'or it will fail to find the place you want to replace.'
    ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  execute: async ({ operation, fileUrl, content, oldContent }) => {
    try {
      const { uri: targetUri, error } = resolveTargetUri(fileUrl);
      
      if (error || !targetUri) {
        return { success: false, message: error || "No target file found" };
      }

      let document: vscode.TextDocument | undefined;

      try {
        document = await vscode.workspace.openTextDocument(targetUri);
      } catch (err) {
        // For "write", allow creating a new file if it doesn't exist yet.
        if (operation === 'write') {
          const encoder = new TextEncoder();
          await vscode.workspace.fs.writeFile(targetUri, encoder.encode(content));
          return { success: true, message: `Successfully created and wrote to ${targetUri.toString()}` };
        } else {
          throw err; // Replace requires an existing file
        }
      }

      // Use WorkspaceEdit to apply changes without changing the user's active UI tab
      const edit = new vscode.WorkspaceEdit();

      if (operation === 'write') {
        const lastLine = Math.max(0, document.lineCount - 1);
        const fullRange = new vscode.Range(
          new vscode.Position(0, 0),
          document.lineAt(lastLine).rangeIncludingLineBreak.end
        );

        edit.replace(targetUri, fullRange, content);

        const ok = await vscode.workspace.applyEdit(edit);
        if (!ok) {
          throw new Error("Editor refused to apply write edit");
        } 

        await document.save();
        return { success: true, message: `Successfully overwrote ${targetUri.toString()}` };
      }

      if (operation === 'replace') {
        if (!oldContent) {
          throw new Error('No old content given when using replace');
        }

        const fileContent = document.getText();
        // Escape special regex characters in the LLM's oldContent
        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let escapedOld = escapeRegExp(oldContent.trim());

        // Replace all whitespace blocks in the escaped string with a regex that matches ANY whitespace (newlines, tabs, spaces)
        const whitespaceAgnosticRegexStr = escapedOld.replace(/\\s+|\\n|\\t|\s+/g, '\\s+');
        const regex = new RegExp(whitespaceAgnosticRegexStr);
        const match = fileContent.match(regex);

        if (!match || match.index === undefined) {
            throw new Error("The old content was not found. Please check your snippet or use read_file to get the exact text.");
        }

        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        edit.replace(targetUri, range, content);

        const ok = await vscode.workspace.applyEdit(edit);
        if (!ok) {
          throw new Error("Editor refused to apply replace edit");
        } 

        await document.save();
        return { success: true, message: `Successfully replaced text in ${targetUri.toString()}` };
      }

      return { success: false, message: "Invalid operation" };
    } catch (error) {
      return { success: false, message: `Error editing file: ${(error as Error).message}` };
    }
  },
});

export const getReadFileTool = tool({
  name: 'read_file',
  description: 'Read the content of a file (within the current VS Code workspace only). If fileUrl is omitted, reads the currently active editor file.',
  inputSchema: z.object({
    fileUrl: z.string().optional().describe(
      'A vscode file URL (e.g. "file:///c:/path/to/file.ts") or an absolute path. Access is restricted to files inside the current workspace.'
    ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    fileContent: z.string(),
  }),
  execute: async ({ fileUrl }) => {
    try {
      const { uri: targetUri, error } = resolveTargetUri(fileUrl);
      
      if (error || !targetUri) {
        return { success: false, message: error || 'No target file found', fileContent: '' };
      }

      const document = await vscode.workspace.openTextDocument(targetUri);
      let fileContent = document.getText();

      const diagnosis = vscode.languages.getDiagnostics(document.uri);
      const errorsString = buildDiagnosticsString(diagnosis);

      if (errorsString) {
        fileContent += "\n\nStatic analysis errors:\n" + errorsString;
      }

      return { success: true, message: ``, fileContent };
    } catch (error) {
       return { success: false, message: `Error reading file: ${(error as Error).message}`, fileContent: '' };
    }
  }
});

export const getListFilePathsTool = tool({
  name: 'list_file_paths',
  description: 'List file URLs from the workspace matching a glob pattern. Use this to discover candidate files before calling read_file.',
  inputSchema: z.object({
    globPattern: z.string().optional().describe('Glob pattern, e.g. "**/*.ts"'),
    maxResults: z.number().int().positive().optional().describe('Maximum number of results to return'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    filePaths: z.array(z.string()),
  }),
  execute: async ({ globPattern, maxResults }) => {
    try {
      // Keep the default narrow to avoid scanning the whole workspace unintentionally.
      const include = globPattern ?? '**/*.{ts,tsx,js,jsx}';
      const exclude = '**/node_modules/**';

      const uris = await vscode.workspace.findFiles(include, exclude, maxResults ?? 50);
      return {
        success: true,
        message: '',
        filePaths: uris.map(u => u.toString()),
      };
    } catch (error) {
      return {
        success: false,
        message: `Error listing files: ${(error as Error).message}`,
        filePaths: [],
      };
    }
  }
});

function isFileUriInWorkspace(uri: vscode.Uri): boolean {
  if (uri.scheme !== 'file') {
    return false;
  } 
  return vscode.workspace.getWorkspaceFolder(uri) !== undefined;
}

function resolveTargetUri(fileUrl?: string): { uri?: vscode.Uri; error?: string } {
  let uri: vscode.Uri;

  if (fileUrl) {
    uri = fileUrl.startsWith('file:') ? vscode.Uri.parse(fileUrl) : vscode.Uri.file(fileUrl);
  } else {
    const active = vscode.window.activeTextEditor;
    if (!active) {
      return { error: 'No active editor found. Exit.'};
    }
    uri = active.document.uri;
  }

  if (!isFileUriInWorkspace(uri)) {
    return { error: `Refusing to access outside the workspace: ${uri.toString()}` };
  }

  return { uri };
}
