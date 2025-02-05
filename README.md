# README

## Development

    OPENAI_API_BASE=http://localhost:1234/v1 aider --copy-paste --watch-files --model openai/mistral-small-24b-instruct-2501

    curl -N -X POST http://localhost:1235/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{"stream": true, "messages": [{"role": "user", "content": "Why is the president?"}]}'

    curl -X POST http://localhost:1235/kill


## Goal

Create a Raycast Extension that provides an OpenAI compatible API server
- internally calls AI.ask (https://developers.raycast.com/api-reference/ai#ai.ask) to.. . It's a no-view command.
- Port is configurable in the extension preferences: https://developers.raycast.com/api-reference/preferences