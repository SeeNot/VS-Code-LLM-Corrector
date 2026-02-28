import { tool } from "@openrouter/sdk";
import { OpenRouter } from "@openrouter/sdk";
import * as vscode from "vscode";
import z from "zod";
import fs from 'fs';

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
    description: 'Edit the file. Can overwrite, append or search and replace text.',
    inputSchema: z.object({
      operation: z.enum(['write', 'append', 'replace']).describe('The type of edit to perform'),
      content: z.string().describe('The text to write or append. For "replace", this is the new text.'),
      oldContent: z.string().optional().describe('Only required for "replace" operation. The text to be replaced.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),

    // 3. The logic handles the different operations
    execute: async ({ operation, content, oldContent }) => {
      try {
        const filePath = vscode.window.activeTextEditor?.document.uri.fsPath;

        console.log(operation);


        if (!filePath) {
          return { success: false, message: 'User canceled' };
        }

        if (operation === 'write') {
          // Completely overwrites the file
          await fs.promises.writeFile(filePath, content, 'utf-8');
          return { success: true, message: `Successfully overwrote ${filePath}` };
        }

        else if (operation === 'append') {
          // Adds text to the end of the file
          await fs.promises.appendFile(filePath, `\n${content}`, 'utf-8');
          return { success: true, message: `Successfully appended to ${filePath}` };
        }

        else if (operation === 'replace') {
          // Reads the file, replaces specific text, and saves it back
          if (!oldContent) {
            throw new Error('oldContent is required for replace operation');
          }
          const currentData = fs.readFileSync(filePath, 'utf-8');
          if (!currentData.includes(oldContent)) {
            console.log("failed");

            return { success: false, message: `Could not find the text to replace in ${filePath}` };
          }
          const newData = currentData.replace(oldContent, content);
          try {
            fs.writeFileSync(filePath, newData, 'utf-8');
          } catch (e) {
            console.log(e);
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
