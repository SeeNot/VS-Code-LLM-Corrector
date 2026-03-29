import * as vscode from "vscode";
import path from "path";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const CONFIG_SECTION = "corrector";
const CONFIG_LOG_RESPONSES = "logResponses";

export function getResponseLogPathForFile(fileFsPath: string): string {
  const parsed = path.parse(fileFsPath);
  return path.join(parsed.dir, `${parsed.name}${parsed.ext}.log`);
}

export async function appendLlmResponseLog(
  fileFsPath: string,
  label: string,
  text: string
): Promise<void> {
  const enabled = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<boolean>(CONFIG_LOG_RESPONSES, true);
  if (!enabled) {
    return;
  }

  const logPath = getResponseLogPathForFile(fileFsPath);
  const uri = vscode.Uri.file(logPath);
  const section = `\n\n--- ${new Date().toISOString()} ${label} ---\n\n${text}`;
  let previous = "";
  try {
    previous = decoder.decode(await vscode.workspace.fs.readFile(uri));
  } catch {
    // no log file yet
  }
  await vscode.workspace.fs.writeFile(uri, encoder.encode(previous + section));
}
