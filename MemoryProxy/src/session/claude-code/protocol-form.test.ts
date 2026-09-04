import { describe, expect, it } from "vitest";
import { getLastUserMessageText } from "./cleaner.js";
import { buildFormResponse } from "./form.js";
import { adaptProtocolFormResponse } from "./protocol-form.js";

const formData = {
  teams: [],
  stage: "asset_confirm" as const,
  stream: false,
  modelId: "deepseek",
};

describe("Claude Code protocol form", () => {
  it("converts the form to OpenAI chat completions", async () => {
    const response = await adaptProtocolFormResponse(
      buildFormResponse(formData),
      "openai",
      false,
    );
    const body = await response.json() as any;

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.object).toBe("chat.completion");
    expect(body.choices[0].message.tool_calls[0].function.name).toBe("AskUserQuestion");
  });

  it("keeps Anthropic SSE unchanged", async () => {
    const original = buildFormResponse(formData);
    const response = await adaptProtocolFormResponse(original, "anthropic", false);

    expect(response).toBe(original);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });

  it("reads OpenAI tool result answers", () => {
    const text = JSON.stringify({ answers: { confirm: "是，关联团队资产" } });
    expect(getLastUserMessageText([
      { role: "user", content: "original" },
      { role: "tool", content: text },
    ])).toBe(text);
  });
});
