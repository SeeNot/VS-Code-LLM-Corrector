import { tool } from "@openrouter/sdk";
import { OpenRouter } from "@openrouter/sdk";
import * as vscode from "vscode";
import z from "zod";

const MODEL = 'arcee-ai/trinity-large-preview:free';
const PROJECT_PATH = vscode.workspace.workspaceFolders;

export async function sendPromt(promt: string) {

  const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API
  });

  const response = client.callModel({
    model: MODEL,
    input: promt,
    tools: [getEditTool()],
    instructions: "Use the tools available to make edits to the users given file",
  });

  return response.getText();
}

function getEditTool() {
  const editTool = tool({
    name: 'edit_file',
    description: 'Edit the file. Can overwrite or search and replace text.',
    inputSchema: z.object({
      operation: z.enum(['write', 'replace']).describe('The type of edit to perform'),
      content: z.string().describe(
        `Use "write" to create a brand new file. Use "replace" to change existing content of 
        file you have to specify old content that you want to relpace and the new content`
      ),
      oldContent: z.string().optional().describe('Only required for "replace" operation. The text to be replaced.'),
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
      const encoder = new TextEncoder;
      console.log(operation);


      if (!filePath) {
        return { success: false, message: 'User canceled' };
      }

      try {
        if (operation === 'write') {
          // Completely overwrites the file
          await vscode.workspace.fs.writeFile(filePath, encoder.encode(content));
          return { success: true, message: `Successfully overwrote ${filePath}` };
        }

        else if (operation === 'replace') {

          if (!oldContent) {
            throw new Error('No old content given when using replace');
          }

          const fileContent = document.getText();

          const startIndex = fileContent.indexOf(oldContent);

          if (startIndex === -1) {
            throw new Error('The old content was given not found');
          }

          const startPos = document.positionAt(startIndex);
          const endPos = document.positionAt(startIndex + oldContent.length);
          const range = new vscode.Range(startPos, endPos);

          editor.edit(editBuilder => {
            editBuilder.replace(range, content);
          })

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
