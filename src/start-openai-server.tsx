import { getPreferenceValues, showToast, Toast, AI } from "@raycast/api";
import http from "http";
import { queryHealth } from "./utils/queryHealth";

interface Preferences {
  port: string;
  apiKey: string;
}

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { port, apiKey } = preferences;
  const portNumber = Number(port);

  if (Number.isNaN(portNumber)) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Invalid Port",
      message: "The port is invalid. Please set a valid number in the preferences.",
    });
    return;
  }

  if (!apiKey || apiKey.trim() === "") {
    await showToast({
      style: Toast.Style.Failure,
      title: "API Key is required",
      message: "Please set a valid API key in the preferences.",
    });
    return;
  }

  // Check if server is already running using /health endpoint
  const health = await queryHealth(port);
  if (health && health.status === "running") {
    await showToast({
      style: Toast.Style.Failure,
      title: "Server already running",
      message: `A server is already running on port ${port}.`,
    });
    return;
  }

  // Start an HTTP server
  const server = http.createServer(async (req, res) => {
    // Check API Key header, exclude /kill and /health endpoints from this check
    if (!(req.method === "POST" && req.url === "/kill") && !(req.method === "GET" && req.url === "/health")) {
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }));
        return;
      }
      const token = authHeader.substring("Bearer ".length);
      if (token !== apiKey) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized: API key mismatch" }));
        return;
      }
    }

    if (req.method === "POST" && req.url === "/kill") {
      // Send response first, then close server
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Server has been shut down." }));

      // Close server after response is sent
      setTimeout(() => {
        server.close();
      }, 100);
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      // Health endpoint providing server status for monitoring
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "running" }));
      return;
    }

    if (req.method === "GET" && req.url === "/v1/models") {
      const models = Object.values(AI.Model).map((modelName, index) => {
        return { id: index.toString(), name: modelName };
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(models));
      return;
    }

    // Existing endpoint for chat completions.
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Endpoint not found" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const requestData = JSON.parse(body);
        const model = requestData.model || "OpenAI_GPT4o-mini";
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
        const answer = AI.ask(prompt, { model: AI.Model[model as keyof typeof AI.Model] });

        if (streamMode) {
          // Streaming response: set headers for SSE.
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          });

          answer.on("data", (data: Buffer | string) => {
            res.write(
              "data: " +
                JSON.stringify({
                  id: "chatcmpl-xyz",
                  object: "chat.completion",
                  model: model,
                  created: Math.floor(Date.now() / 1000),
                  choices: [{ delta: { content: data.toString() } }],
                }) +
                "\n\n",
            );
          });

          answer
            .then(() => {
              res.write(
                "data: " +
                  JSON.stringify({
                    id: "chatcmpl-xyz",
                    object: "chat.completion",
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{ delta: { content: "" } }],
                    finish_reason: "stop",
                  }) +
                  "\n\n",
              );
              res.write("data: [DONE]\n\n");
              res.end();
            })
            .catch((err: unknown) => {
              res.write(
                "data: " + JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) + "\n\n",
              );
              res.end();
            });
        } else {
          // Non-streaming mode: await the full response and send it as JSON.
          const result = await answer;
          const responseBody = {
            id: "chatcmpl-xyz",
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: result,
                },
                finish_reason: "stop",
              },
            ],
            usage: {},
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(responseBody));
        }
      } catch (err: unknown) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
    });
  });

  server.listen(portNumber, () => {
    showToast({
      style: Toast.Style.Success,
      title: "Server started",
      message: `Server is running on port ${portNumber}`,
    });
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      showToast({
        style: Toast.Style.Failure,
        title: "Port in use",
        message: `Port ${portNumber} is already in use. Please choose another port.`,
      });
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Server error",
        message: err.message,
      });
    }
  });

  server.on("close", () => {
    console.log("Server has been shut down.");
  });

  // Keep the command alive to prevent the server from shutting down
  await new Promise(() => {});
}
