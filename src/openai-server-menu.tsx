import { MenuBarExtra, showToast, Toast, getPreferenceValues, AI, launchCommand, LaunchType } from "@raycast/api";
import { useState, useEffect } from "react";
import http from "http";

interface Preferences {
  port: string;
}

interface ServerStatus {
  running: boolean;
  port?: number;
}

export default function Command() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ running: false });
  const preferences = getPreferenceValues<Preferences>();
  const port = Number(preferences.port) || 1235;

  useEffect(() => {
    checkServerStatus();
  }, []);

  async function checkServerStatus() {
    try {
      const response = await fetch(`http://localhost:${port}/kill`, {
        method: "HEAD",
        timeout: 500,
      });
      setServerStatus({ running: response.ok, port });
    } catch (error) {
      setServerStatus({ running: false, port });
    }
  }

  async function startServer() {
    try {
      await launchCommand({ name: "start-openai-server", type: LaunchType.Background });
      await showToast({ style: Toast.Style.Success, title: "Server starting..." });
      setTimeout(checkServerStatus, 2000);
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Failed to start server" });
    }
  }

  async function stopServer() {
    try {
      await launchCommand({ name: "kill-openai-server", type: LaunchType.Background });
      await showToast({ style: Toast.Style.Success, title: "Server stopped" });
      setServerStatus({ running: false, port });
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Failed to stop server" });
    }
  }

  return (
    <MenuBarExtra
      icon={serverStatus.running ? "raycast-connected.png" : "raycast-disconnected.png"}
      tooltip={`OpenAI Server - ${serverStatus.running ? "Running" : "Stopped"}`}
    >
      <MenuBarExtra.Section title="Server Status">
        <MenuBarExtra.Item
          title={`Port: ${port}`}
          subtitle={serverStatus.running ? "● Running" : "○ Stopped"}
          onAction={checkServerStatus}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Controls">
        {serverStatus.running ? (
          <MenuBarExtra.Item title="Stop Server" onAction={stopServer} />
        ) : (
          <MenuBarExtra.Item title="Start Server" onAction={startServer} />
        )}
        <MenuBarExtra.Section title="Refresh">
          <MenuBarExtra.Item
            title="Refresh Status"
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={checkServerStatus}
          />
        </MenuBarExtra.Section>
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
