import type { ChatCompletionResponse, ChatCompletionsPayload } from "./types.ts"

import { copilot } from "../../../services/api-instance"

export const chatCompletions = (payload: ChatCompletionsPayload) =>
  copilot<ChatCompletionResponse>("/chat/completions", {
    method: "POST",
    body: {
      ...payload,
      stream: false,
    },
  })
