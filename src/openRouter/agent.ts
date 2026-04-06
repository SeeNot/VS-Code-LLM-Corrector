import { OpenRouter } from "@openrouter/sdk";
import analystPrompt from "../promts/analyst";
import fixerPrompt from "../promts/fixer";
import critiquePrompt from "../promts/critique";
import { getWorkspaceContextFromActiveEditor } from "../vscodeUtils";
import { AGENT_ROLES, AgentRole, CRITIQUE_DECISIONS, CritiqueDecision, MODEL } from "../types";
import { appendLlmResponseLog } from "../responseLog";
import { getEditTool, getReadFileTool, getListFilePathsTool } from "./tools";

function getClient() {
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API
  });
}

function parseCritiqueDecision(text: string): { decision: CritiqueDecision; feedback: string } {
  const decisionMatch = text.match(/<decision>\s*(END|RETRY)\s*<\/decision>/i);
  const decision =
    (decisionMatch?.[1]?.toUpperCase() === CRITIQUE_DECISIONS.RETRY)
      ? CRITIQUE_DECISIONS.RETRY
      : CRITIQUE_DECISIONS.END;

  const feedbackMatch = text.match(/<feedback>([\s\S]*?)<\/feedback>/i);
  const feedback = feedbackMatch?.[1]?.trim() ?? "";

  return { decision, feedback };
}

function getToolsFor(role: AgentRole) {
  const edit = getEditTool;
  const read = getReadFileTool;
  const list = getListFilePathsTool;

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

export async function runAgentFixLoop(numberOfTotalAttempts: number = 3, userInstructions: string = "") {
  const client = getClient();

  const initial = getWorkspaceContextFromActiveEditor();
  const logFileFsPath = initial.fileFsPath;

  const analystInput = `${analystPrompt()}

  USER_INSTRUCTIONS:
  ${userInstructions?.trim() ? userInstructions.trim() : "(none)"}

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
  await appendLlmResponseLog(logFileFsPath, AGENT_ROLES.ANALYST, planText);

  let critiqueFeedback = "";

  for (let attempt = 1; attempt <= numberOfTotalAttempts; attempt += 1) {
    const ctx = getWorkspaceContextFromActiveEditor();

    const fixerInput = `${fixerPrompt()}

    ATTEMPT: ${attempt} / ${numberOfTotalAttempts}

    USER_INSTRUCTIONS:
    ${userInstructions?.trim() ? userInstructions.trim() : "(none)"}

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
    await appendLlmResponseLog(
      logFileFsPath,
      `${AGENT_ROLES.FIXER} ${attempt}/${numberOfTotalAttempts}`,
      fixerText
    );

    const afterFix = getWorkspaceContextFromActiveEditor();

    const critiqueInput = `${critiquePrompt()}

    ATTEMPT: ${attempt} / ${numberOfTotalAttempts}

    USER_INSTRUCTIONS:
    ${userInstructions?.trim() ? userInstructions.trim() : "(none)"}

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
    await appendLlmResponseLog(
      logFileFsPath,
      `${AGENT_ROLES.CRITIQUE} ${attempt}/${numberOfTotalAttempts}`,
      critiqueText
    );

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
  await appendLlmResponseLog(logFileFsPath, `${AGENT_ROLES.CRITIQUE} final`, finalCritique);

  return {
    planText,
    fixerText: "",
    critiqueText: finalCritique,
    attempts: numberOfTotalAttempts,
    decision: CRITIQUE_DECISIONS.RETRY,
  };
}
