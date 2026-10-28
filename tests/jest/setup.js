import { TextDecoder, TextEncoder } from "util";

process.on("unhandledRejection", (error) => {
  throw error;
});

// jsdom does not expose these, though every browser and Node do. The audio
// reader's SentencePiece tokenizer needs them for UTF-8 byte fallback.
if (typeof global.TextEncoder === "undefined") global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === "undefined") global.TextDecoder = TextDecoder;
