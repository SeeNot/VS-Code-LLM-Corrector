import { tool } from "@openrouter/sdk";
import { OpenRouter } from "@openrouter/sdk";
import * as vscode from "vscode";
import z from "zod";
import analystPrompt from "./promts/analyst";
import fixerPrompt from "./promts/fixer";
import critiquePrompt from "./promts/critique";

const MODEL = 'arcee-ai/trinity-large-preview:free';

const AGENT_ROLES = {
  ANALYST: "analyst",
  FIXER: "fixer",
  CRITIQUE: "critique",
} as const;

type AgentRole = typeof AGENT_ROLES[keyof typeof AGENT_ROLES];

const CRITIQUE_DECISIONS = {
  END: "END",
  RETRY: "RETRY",
} as const;

type CritiqueDecision = typeof CRITIQUE_DECISIONS[keyof typeof CRITIQUE_DECISIONS];

function getClient() {
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API
  });
}

function buildDiagnosticsString(diagnosis: vscode.Diagnostic[]) {
  return diagnosis.map(d => {
    const line = `Error start on line ${d.range.start} and ends on ${d.range.end}`;
    const severity = d.severity;
    return `${severity}: ${line} ${d.message}`;
  }).join("\n");
}

function getWorkspaceContextFromActiveEditor() {
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

function parseCritiqueDecision(text: string): { decision: CritiqueDecision; feedback: string } {
  const decisionMatch = text.match(/DECISION:\s*(END|RETRY)\b/i);
  const decision =
    (decisionMatch?.[1]?.toUpperCase() === CRITIQUE_DECISIONS.RETRY)
      ? CRITIQUE_DECISIONS.RETRY
      : CRITIQUE_DECISIONS.END;

  const feedbackMatch = text.match(/CRITIQUE_FEEDBACK:\s*([\s\S]*)/i);
  const feedback = feedbackMatch?.[1]?.trim() ?? "";

  return { decision, feedback };
}

function getToolsFor(role: AgentRole) {
  const edit = getEditTool();
  const read = getReadFileTool();
  const list = getListFilePathsTool();

  if (role === AGENT_ROLES.ANALYST || role === AGENT_ROLES.CRITIQUE) {
    return [read, list];
  }

  return [edit, read, list];
}

async function callAgent(params: {
  client: OpenRouter;
  role: AgentRole;
  input: string;
  instructions: string;
}) {
  const response = params.client.callModel({
    model: MODEL,
    input: params.input,
    tools: getToolsFor(params.role),
    instructions: params.instructions,
  });

  return response.getText();
}

export async function sendPromt(promt: string) {

  const client = getClient();
  return callAgent({
    client,
    role: AGENT_ROLES.FIXER,
    input: promt,
    instructions: "Use the tools available to make edits to the users given file",
  });
}

export async function runAgentFixLoop( numberOfTotalAttempts: number = 3) {
  const client = getClient();

  const initial = getWorkspaceContextFromActiveEditor();

  const analystInput = `${analystPrompt()}

  TARGET_FILE: ${initial.fileUrl}

  FILE_CONTENT:
  ${initial.fullText}

  STATIC_ANALYSIS_ERRORS:
  ${initial.errors || "(none)"}
  `;

  const planText = await callAgent({
    client,
    role: AGENT_ROLES.ANALYST,
    input: analystInput,
    instructions: "You are the Analyst. You can read files and list file paths. Do not edit files.",
  });

  let critiqueFeedback = "";

  for (let attempt = 1; attempt <= numberOfTotalAttempts; attempt += 1) {
    const ctx = getWorkspaceContextFromActiveEditor();

    const fixerInput = `${fixerPrompt()}

    ATTEMPT: ${attempt} / ${numberOfTotalAttempts}

    TARGET_FILE: ${ctx.fileUrl}

    ANALYST_PLAN:
    ${planText}

    CRITIQUE_FEEDBACK (if any):
    ${critiqueFeedback || "(none)"}

    CURRENT_FILE_CONTENT:
    ${ctx.fullText}

    CURRENT_STATIC_ANALYSIS_ERRORS:
    ${ctx.errors || "(none)"}
    `;

    const fixerText = await callAgent({
      client,
      role: AGENT_ROLES.FIXER,
      input: fixerInput,
      instructions: "You are the Fixer. Implement the plan using tools. Edit files as needed, then verify by reading.",
    });

    const afterFix = getWorkspaceContextFromActiveEditor();

    const critiqueInput = `${critiquePrompt()}

    ATTEMPT: ${attempt} / ${numberOfTotalAttempts}

    TARGET_FILE: ${afterFix.fileUrl}

    ANALYST_PLAN:
    ${planText}

    FIXER_OUTPUT:
    ${fixerText}

    CURRENT_FILE_CONTENT:
    ${afterFix.fullText}

    CURRENT_STATIC_ANALYSIS_ERRORS:
    ${afterFix.errors || "(none)"}
    `;

    const critiqueText = await callAgent({
      client,
      role: AGENT_ROLES.CRITIQUE,
      input: critiqueInput,
      instructions: "You are the Critique. Verify the result by reading files. Do not edit.",
    });

    const { decision, feedback } = parseCritiqueDecision(critiqueText);

    if (decision === CRITIQUE_DECISIONS.END) {
      return {
        planText,
        fixerText,
        critiqueText,
        attempts: attempt,
        decision,
      };
    }

    critiqueFeedback = feedback || critiqueText;
  }

  const finalCritique = await callAgent({
    client,
    role: AGENT_ROLES.CRITIQUE,
    input: `${critiquePrompt()}

FINAL_REVIEW:
The cycle hit the max attempt count (${numberOfTotalAttempts}). Provide the most important next steps if more work is required.
`,
    instructions: "You are the Critique. Provide final guidance only.",
  });

  return {
    planText,
    fixerText: "",
    critiqueText: finalCritique,
    attempts: numberOfTotalAttempts,
    decision: CRITIQUE_DECISIONS.RETRY,
  };
}

function getEditTool() {
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

function getReadFileTool() {

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

function getListFilePathsTool() {
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
