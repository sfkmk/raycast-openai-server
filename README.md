# Raycast OpenAI Server

A Raycast Extension that provides a local OpenAI-compatible API server, allowing you to use Raycast AI with any application that supports OpenAI's API format.

## Overview

This extension creates a local HTTP server that acts as a relay between external applications and Raycast's built-in AI capabilities. It's perfect for integrating Raycast AI with development tools, editors, and other applications that expect an OpenAI-compatible API.

## Features

- **OpenAI API Compatible**: Full compatibility with OpenAI's chat completions API
- **Authentication Required**: API key authentication for all requests
- **Streaming Support**: Real-time streaming responses for chat completions
- **Health Monitoring**: Built-in health endpoint for status checking
- **Model Selection**: Access to all available Raycast AI models
- **Easy Management**: Simple start/stop commands with status feedback

## Setup

### 1. Install the Extension

Install this extension in Raycast.

### 2. Configure Preferences

Before first use, configure the required settings in Raycast preferences or use the defaults:

- **Server Port**: The port where the server will run
- **API Key**: A secure API key that applications must use to authenticate

Both fields are required and must be set before starting the server.

### 3. Start the Server

Run the "Start OpenAI Server" command in Raycast. You'll see a success notification when the server is running.

## Usage

### Basic API Calls

Once the server is running, you can make OpenAI-compatible API calls:

```bash
# Chat completion (non-streaming)
curl -X POST http://localhost:1235/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{
    "model": "google-gemini-2.0-flash",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'

# Chat completion (streaming)
curl -N -X POST http://localhost:1235/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{
    "model": "google-gemini-2.0-flash",
    "stream": true,
    "messages": [{"role": "user", "content": "Tell me a story"}]
  }'

# List available models
curl http://localhost:1235/v1/models \
  -H "Authorization: Bearer your-api-key-here" | jq .

# Check server health (no auth required)
curl http://localhost:1235/health
```

### Integration Examples

#### Aider (AI Coding Assistant)

Use Raycast AI as the backend for Aider:

```bash
# Basic usage
OPENAI_API_KEY=your-api-key-here OPENAI_API_BASE=http://localhost:1235/v1 aider

# With specific models
OPENAI_API_KEY=your-api-key-here OPENAI_API_BASE=http://localhost:1235/v1 aider --model openai/together-deepseek-ai/DeepSeek-R1

# Watch mode with file monitoring
OPENAI_API_KEY=your-api-key-here OPENAI_API_BASE=http://localhost:1235/v1 aider --watch-files --model openai/anthropic-claude-sonnet
```

#### Custom Applications

Any application that supports OpenAI's API can use this server. Just configure:
- Base URL: `http://localhost:1235/v1`
- API Key: Your configured key
- Models: Use `/v1/models` endpoint to discover available models

## API Endpoints

### Authentication Required

All API endpoints except `/health` require authentication via the `Authorization: Bearer <API_KEY>` header.

- `POST /v1/chat/completions` - Chat completions with streaming support
- `GET /v1/models` - List available AI models

### No Authentication Required

- `GET /health` - Server health status
- `POST /kill` - Shutdown server (internal use)

## Server Management

### Starting the Server

Use the "Start OpenAI Server" Raycast command. The server will:
- Check if another server is already running
- Validate your configuration
- Start listening on your configured port
- Show a success notification

### Stopping the Server

Use the "Kill OpenAI Server" Raycast command. The server will:
- Verify a server is running
- Gracefully shutdown
- Confirm successful shutdown

### Health Monitoring

Check server status anytime:

```bash
curl http://localhost:1235/health
# Returns: {"status": "running"}
```

## Development

### Running in Development

```bash
npm run dev
```

### Testing the Server

```bash
# Start the server via Raycast command, then test:

# Health check
curl http://localhost:1235/health

# Models list
curl http://localhost:1235/v1/models \
  -H "Authorization: Bearer your-api-key-here"

# Chat completion
curl -X POST http://localhost:1235/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{"model": "google-gemini-2.0-flash", "messages": [{"role": "user", "content": "Test message"}]}'
```

## Troubleshooting

### Server Won't Start

- Check if the port is already in use
- Ensure API key is configured in preferences
- Verify port number is valid

### Authentication Errors

- Ensure you're sending the `Authorization: Bearer <API_KEY>` header
- Verify the API key matches your configured value
- Check that you're not trying to authenticate on the `/health` endpoint

### Connection Refused

- Confirm the server is running with `curl http://localhost:1235/health`
- Check the configured port matches your requests
- Restart the server if needed

## License

MIT
