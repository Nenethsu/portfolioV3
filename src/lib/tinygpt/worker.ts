/// Runs Tiny GPT off the main thread so typing, scrolling and GSAP stay smooth while it writes.
import { TinyGpt, sample, type Manifest, type TinyGptConfig } from "./engine";

export type WorkerRequest =
  | { type: "load"; baseUrl: string }
  | {
      type: "generate";
      id: number;
      prompt: string;
      length: number;
      temperature: number;
      topK: number;
    }
  | { type: "stop" };

export type ModelInfo = { params: number; bytes: number; config: TinyGptConfig };

export type WorkerResponse =
  | { type: "progress"; loaded: number; total: number }
  | ({ type: "ready" } & ModelInfo)
  | { type: "missing" }
  | { type: "error"; message: string }
  | { type: "text"; id: number; text: string }
  | {
      type: "done";
      id: number;
      chars: number;
      ms: number;
      reason: "length" | "end" | "stopped";
    };

const post = (message: WorkerResponse) => self.postMessage(message);

let model: TinyGpt | null = null;
let running = 0; // id of the generation allowed to continue; 0 stops it

/** The site's catch-all redirect answers a missing file with index.html, so check it's really JSON. */
const fetchManifest = async (baseUrl: string) => {
  const res = await fetch(`${baseUrl}model.json`);
  if (!res.ok) return null;
  try {
    return (await res.json()) as Manifest;
  } catch {
    return null;
  }
};

const load = async (baseUrl: string) => {
  const manifest = await fetchManifest(baseUrl);
  if (!manifest) return post({ type: "missing" });

  const res = await fetch(`${baseUrl}model.bin`);
  if (!res.ok || !res.body) throw new Error("Couldn't download model.bin");
  const bytes = new Uint8Array(manifest.bytes);
  const reader = res.body.getReader();
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (loaded + value.length > bytes.length)
      throw new Error("model.bin is bigger than model.json says");
    bytes.set(value, loaded);
    loaded += value.length;
    post({ type: "progress", loaded, total: bytes.length });
  }
  if (loaded !== bytes.length)
    throw new Error("model.bin download was cut short");

  model = new TinyGpt(manifest, bytes.buffer);
  post({
    type: "ready",
    params: manifest.params,
    bytes: manifest.bytes,
    config: manifest.config,
  });
};

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

const generate = async (
  request: Extract<WorkerRequest, { type: "generate" }>,
) => {
  if (!model) return;
  const gpt = model;
  const { id } = request;
  running = id;
  const start = performance.now();
  gpt.reset();

  // Training put an end-of-story mark before every story, so starting with it means "new story".
  const prompt = gpt.encode(request.prompt).slice(-gpt.config.block_size / 2);
  const ids = [gpt.eos, ...prompt];
  for (const t of ids.slice(0, -1)) gpt.step(t);

  let token = ids[ids.length - 1];
  let chars = 0;
  let pending = "";
  let reason: "length" | "end" | "stopped" = "length";
  while (chars < request.length) {
    token = sample(gpt.step(token), request.temperature, request.topK);
    if (token === gpt.eos) {
      reason = "end";
      break;
    }
    pending += gpt.decode(token);
    chars++;
    // Hand text over in small pieces and let "stop" messages in between.
    if (pending.length >= 3) {
      post({ type: "text", id, text: pending });
      pending = "";
      await nextTick();
      if (running !== id) {
        reason = "stopped";
        break;
      }
    }
  }
  if (pending) post({ type: "text", id, text: pending });
  if (running === id) running = 0;
  post({ type: "done", id, chars, ms: performance.now() - start, reason });
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  const fail = (error: unknown) =>
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  if (message.type === "load") load(message.baseUrl).catch(fail);
  else if (message.type === "generate") generate(message).catch(fail);
  else running = 0;
};
