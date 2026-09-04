import {
  buildOpenAINonStreamingResponse,
  buildOpenAIStreamingResponse,
} from "../workbuddy/form.js";

export async function adaptProtocolFormResponse(
  response: Response,
  protocol: "openai" | "anthropic" | undefined,
  stream: boolean,
): Promise<Response> {
  if (protocol !== "openai") return response;

  let model = "unknown";
  let args = "";
  for (const line of (await response.text()).split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const event = JSON.parse(line.slice(6)) as Record<string, any>;
    if (event.type === "message_start") model = event.message?.model ?? model;
    if (event.type === "content_block_delta") args += event.delta?.partial_json ?? "";
  }
  if (!args) throw new Error("Claude Code session form has no arguments");

  const created = Math.floor(Date.now() / 1000);
  const id = `cc-session-init-${Date.now()}`;
  const toolCallId = `call_cc_session_init_${Date.now()}`;
  return stream
    ? buildOpenAIStreamingResponse(id, created, model, toolCallId, args)
    : buildOpenAINonStreamingResponse(id, created, model, toolCallId, args);
}
