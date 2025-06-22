import { showToast, Toast, getPreferenceValues } from "@raycast/api";
import { queryHealth } from "./utils/queryHealth";
import fetch from "node-fetch";

interface Preferences {
  port: string;
}

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const port = preferences.port || "1235";

    // Check health before kill
    const beforeHealth = await queryHealth(port);
    if (!beforeHealth || beforeHealth.status !== "running") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Server is not running",
        message: `No running server detected on port ${port}.`,
      });
      return;
    }

    const response = await fetch(`http://localhost:${port}/kill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to stop server",
        message: `Status code: ${response.status}`,
      });
      return;
    }

    // Wait until health indicates server stopped (max 5s)
    const start = Date.now();
    let serverStopped = false;
    while (!serverStopped && Date.now() - start < 5000) {
      const afterHealth = await queryHealth(port);
      if (!afterHealth || afterHealth.status !== "running") {
        serverStopped = true;
      } else {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Server stopped",
      message: "Server has been stopped successfully.",
    });
  } catch (error: unknown) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to kill server",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
