import { tool } from "@openrouter/sdk";
import * as vscode from "vscode";
import z from "zod";
import { buildDiagnosticsString } from "../vscodeUtils";

export function getEditTool() {
    const editTool = tool({
      name: 'edit_file',
      description: 'Edit the file. Can overwrite or search and replace text.',
      inputSchema: z.object({
        operation: z.enum(['write', 'replace']).describe('The type of edit to perform'),
        content: z.string().describe(
          `Use "write" only to create a brand new file. Use "replace" to change existing content of 
          file you have to specify old content that you want to replace and the new content`
        ),
        oldContent: z.string().optional().describe(
          `Only required for "replace" operation. The text to be replaced. It needs to be exactly the same,
          or it will fail to find the place you want to replace`
        ),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
  
      // 3. The logic handles the different operations
      execute: async ({ operation, content, oldContent }) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return { success: false, message: `editor object does not exist. Exit.` };
        }
  
        const document = editor.document;
        const filePath = document.uri;
        console.log(operation);
  
        console.log(content);
        if (!filePath) {
          return { success: false, message: 'User canceled' };
        }
  
        try {
          if (operation === 'write') {
            const lastLine = Math.max(0, document.lineCount - 1);
            const fullRange = new vscode.Range(
              new vscode.Position(0, 0),
              document.lineAt(lastLine).rangeIncludingLineBreak.end
            );
  
            const ok = await editor.edit(editBuilder => {
              editBuilder.replace(fullRange, content);
            });
  
            if (!ok) {
              throw new Error("Editor refused to apply write edit");
            }
  
            return { success: true, message: `Successfully overwrote ${filePath}` };
          }
  
          else if (operation === 'replace') {
  
            if (!oldContent) {
              throw new Error('No old content given when using replace');
            }
  
            const fileContent = document.getText();
  
            const startIndex = fileContent.indexOf(oldContent);
  
            if (startIndex === -1) {
              throw new Error('The old content that was given was not found');
            }
  
            const startPos = document.positionAt(startIndex);
            const endPos = document.positionAt(startIndex + oldContent.length);
            const range = new vscode.Range(startPos, endPos);
  
            const ok = await editor.edit(editBuilder => {
              editBuilder.replace(range, content);
            });
  
            if (!ok) {
              throw new Error("Editor refused to apply replace edit");
            }
  
            return { success: true, message: `Successfully replaced text in ${filePath}` };
          }
  
          return { success: false, message: 'Invalid operation' };
  
        } catch (error) {
          console.log(error);
  
          return { success: false, message: `Error editing file: ${(error as Error).message}` };
        }
      },
    });
  
    return editTool;
  }
  
  export function getReadFileTool() {
  
    const readTool = tool({
      name: 'read_file',
      description: 'Read the content of a file. If fileUrl is omitted, reads the currently active editor file.',
      inputSchema: z.object({
        fileUrl: z.string().optional().describe(
          `A vscode file URL (e.g. "file:///c:/path/to/file.ts") or an absolute path (e.g. "C:\\path\\to\\file.ts")`
        ),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
        fileContent: z.string(),
      }),
      execute: async ({ fileUrl }) => {
        let document: vscode.TextDocument | undefined;
  
        if (fileUrl) {
          const uri = fileUrl.startsWith('file:') ? vscode.Uri.parse(fileUrl) : vscode.Uri.file(fileUrl);
          document = await vscode.workspace.openTextDocument(uri);
        } else {
          document = vscode.window.activeTextEditor?.document;
        }
  
        if (!document) {
          return { success: false, message: 'No target file found', fileContent: '' };
        }
  
        let fileContent = document.getText();
  
        const diagnosis = vscode.languages.getDiagnostics(document.uri);
        const errorsString = buildDiagnosticsString(diagnosis);
  
        if (errorsString) {
          fileContent += "\n\nStatic analysis errors:\n" + errorsString;
        }
  
        return { success: true, message: ``, fileContent: fileContent };
      }
    });
  
  
    return readTool;
  }
  
  export function getListFilePathsTool() {
    return tool({
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
  }
  