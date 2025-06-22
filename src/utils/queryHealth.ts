import fetch from "node-fetch";

export async function queryHealth(port: string): Promise<{ status: string } | null> {
  try {
    const response = await fetch(`http://localhost:${port}/health`);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as { status: string };
  } catch {
    return null;
  }
}
