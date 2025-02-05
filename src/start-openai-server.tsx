import { getPreferenceValues, showToast, Toast, AI } from "@raycast/api";
import http from "http";

interface Preferences {
  port: string;
}

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();
  console.log("Read preferences:", JSON.stringify(preferences));
  const { port } = preferences;
  console.log("Read port from preferences:", port);
  const portNumber = Number(port);
  if (Number.isNaN(portNumber)) {
    showToast({
      style: Toast.Style.Failure,
      title: "Invalid Port",
      message: "The port is invalid. Please set a valid number in the preferences."
    });
    return;
  }

  // Start an HTTP server
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Endpoint not found" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const requestData = JSON.parse(body);
        if (!requestData.messages || !Array.isArray(requestData.messages)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing or invalid 'messages' in request body" }));
          return;
        }

        const lastMessage = requestData.messages[requestData.messages.length - 1];
        const prompt = lastMessage.content;
        if (!prompt) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing 'content' in the last message" }));
          return;
        }

        // Determine whether streaming is enabled.
        const streamMode = requestData.stream === true;

        // Call AI.ask with the prompt.
        const answer = AI.ask(prompt);

        if (streamMode) {
          // Streaming response: set headers for SSE.
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          });

          answer.on("data", (data: Buffer | string) => {
            res.write("data: " + JSON.stringify({
              id: "chatcmpl-xyz",
              object: "chat.completion",
              created: Math.floor(Date.now() / 1000),
              choices: [{ delta: { content: data.toString() } }]
            }) + "\n\n");
          });

          answer.on("end", () => {
            res.write("data: " + JSON.stringify({
              id: "chatcmpl-xyz",
              object: "chat.completion",
              created: Math.floor(Date.now() / 1000),
              choices: [{ delta: { content: "" } }],
              finish_reason: "stop"
            }) + "\n\n");
            res.write("data: [DONE]\n\n");
            res.end();
          });

          answer.on("error", (err: any) => {
            res.write("data: " + JSON.stringify({ error: err.message }) + "\n\n");
            res.end();
          });
        } else {
          // Non-streaming mode: await the full response and send it as JSON.
          const result = await answer;
          const responseBody = {
            id: "chatcmpl-xyz",
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            choices: [{
              index: 0,
              message: {
                role: "assistant",
                content: result
              },
              finish_reason: "stop"
            }],
            usage: {}
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(responseBody));
        }
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });

  server.listen(portNumber, () => {
    console.log(`Server is listening on port ${portNumber}`);
  });

  // Listen for the 'close' event and print a message when the server shuts down.
  server.on("close", () => {
    console.log("Server has been shut down.");
  });

  await new Promise(() => {});
}
