import fetch from "node-fetch";
import { showHUD } from "@raycast/api";

export default async function Command() {
  try {
    const response = await fetch("http://localhost:1235/kill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    await showHUD(result.message);
  } catch (error: any) {
    await showHUD("Failed to kill server: " + error.message);
  }
}
