/**
 * Chat message fixtures derived from real captures (AGENTS.md: capture before mock).
 *
 * Sources (read-only, never edit):
 * - C-04 first turn:  tests/fixtures/captures/2026-10-21/chat-first-turn-phone-1-return.endpoint.json
 * - C-05 follow-up:   tests/fixtures/captures/2026-10-21/chat-follow-up-phone-1-return.endpoint.json
 *
 * The assistant messages are built from the captured raw SSE text with
 * `readUIMessageStream` (the same reducer `useChat` uses). Controlled variations
 * (withLabel, withInput, withOutput, withoutOutput, asStreaming) only change the
 * captured set_decision part into another real state or label.
 */
import type { UIMessageChunk } from "ai";
import { readUIMessageStream } from "ai";
import type { DecisionLabel } from "../../../lib/case/constants";
import type {
  CaseUIMessage,
  SetDecisionInput,
  SetDecisionOutput,
  SetDecisionPart,
} from "../../../lib/case/messages";
import { isSetDecisionPart } from "../../../lib/case/messages";
import firstTurnCapture from "../captures/2026-10-21/chat-first-turn-phone-1-return.endpoint.json";
import followUpCapture from "../captures/2026-10-21/chat-follow-up-phone-1-return.endpoint.json";

type CapturedEndpoint = {
  request: { body: { messages: unknown[] } };
  response: { body: { raw: string } };
};

const firstCapture = firstTurnCapture as unknown as CapturedEndpoint;
const followCapture = followUpCapture as unknown as CapturedEndpoint;

/** Parses verbatim SSE text (`data: {...}` events separated by blank lines). */
function parseSseChunks(raw: string): UIMessageChunk[] {
  const chunks: UIMessageChunk[] = [];
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const payload = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim())
      .join("");
    if (payload === "" || payload === "[DONE]") {
      continue;
    }
    chunks.push(JSON.parse(payload) as UIMessageChunk);
  }
  return chunks;
}

async function assistantFromRawSse(raw: string): Promise<CaseUIMessage> {
  const chunks = parseSseChunks(raw);
  const stream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  let last: CaseUIMessage | undefined;
  for await (const message of readUIMessageStream<CaseUIMessage>({ stream })) {
    last = message;
  }
  if (!last) {
    throw new Error("captured stream produced no message");
  }
  return last;
}

/** Hidden case submission as sent by the client in the captured first-turn request. */
const hiddenSubmission = firstCapture.request.body.messages[0] as CaseUIMessage;

/** Message id of the assistant reply as sent back in the captured follow-up request. */
const CAPTURED_ASSISTANT_ID = (
  followCapture.request.body.messages[1] as { id: string }
).id;

const firstAssistantBase = await assistantFromRawSse(
  firstCapture.response.body.raw
);
const assistantFirst: CaseUIMessage = {
  ...firstAssistantBase,
  id: CAPTURED_ASSISTANT_ID,
};

/** Follow-up user message as sent in the captured follow-up request. */
const userFollowUp = followCapture.request.body.messages[2] as CaseUIMessage;

const assistantFollowUp: CaseUIMessage = await assistantFromRawSse(
  followCapture.response.body.raw
);

/** [hidden case submission, assistant first reply] — what useChat holds after the first turn. */
export const firstTurnMessages: CaseUIMessage[] = [
  hiddenSubmission,
  assistantFirst,
];

/** Full history after the captured follow-up turn. */
export const followUpMessages: CaseUIMessage[] = [
  ...firstTurnMessages,
  userFollowUp,
  assistantFollowUp,
];

type MessagePart = CaseUIMessage["parts"][number];

/** Label recorded by the captured first-turn set_decision call. */
export const capturedFirstLabel: DecisionLabel = (() => {
  const part = assistantFirst.parts.find(isSetDecisionPart);
  const label = part?.input?.label;
  if (!label) {
    throw new Error("captured first turn has no set_decision label");
  }
  return label;
})();

function mapSetDecisionPart(
  message: CaseUIMessage,
  transform: (part: SetDecisionPart) => MessagePart
): CaseUIMessage {
  return {
    ...message,
    parts: message.parts.map((part) =>
      isSetDecisionPart(part) ? transform(part) : part
    ),
  };
}

/** Controlled variation: same captured part, input.label replaced. */
export function withLabel(
  message: CaseUIMessage,
  label: DecisionLabel
): CaseUIMessage {
  return mapSetDecisionPart(message, (part) => ({
    ...part,
    input: { ...(part.input as SetDecisionInput), label },
  }));
}

/** Controlled variation: input fields replaced (e.g. greeting/changeReason for update shapes). */
export function withInput(
  message: CaseUIMessage,
  patch: Partial<SetDecisionInput>
): CaseUIMessage {
  return mapSetDecisionPart(message, (part) => ({
    ...part,
    input: { ...(part.input as SetDecisionInput), ...patch },
  }));
}

/** Controlled variation: output replaced (e.g. recorded=false, previousLabel set). */
export function withOutput(
  message: CaseUIMessage,
  output: SetDecisionOutput
): CaseUIMessage {
  return mapSetDecisionPart(message, (part) => {
    if (part.state !== "output-available") {
      return part;
    }
    return { ...part, output };
  });
}

/** Controlled variation: tool part in `input-available` (input known, output not yet). */
export function withoutOutput(message: CaseUIMessage): CaseUIMessage {
  return mapSetDecisionPart(
    message,
    (part) =>
      ({
        input: part.input,
        state: "input-available",
        toolCallId: part.toolCallId,
        type: part.type,
      }) as SetDecisionPart
  );
}

/** Controlled variation: tool part in `input-streaming` (input still arriving). */
export function asStreaming(message: CaseUIMessage): CaseUIMessage {
  return mapSetDecisionPart(
    message,
    (part) =>
      ({
        input: part.input,
        state: "input-streaming",
        toolCallId: part.toolCallId,
        type: part.type,
      }) as SetDecisionPart
  );
}
