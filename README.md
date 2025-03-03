# README

## Development

    npm run dev

    curl -N -X POST http://localhost:1235/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{"model": "google-gemini-2.0-flash", "stream": true, "messages": [{"role": "user", "content": "Who is the president?"}]}'

    curl http://localhost:1235/v1/models | jq .

    curl -X POST http://localhost:1235/kill

### Aider

Bootstrap with raycast AI chat window

    OPENAI_API_BASE=http://localhost:1234/v1 aider --copy-paste --model openai/mistral-small-24b-instruct-2501

Eating your own dogfood - use OpenAI server

    OPENAI_API_BASE=http://localhost:1235/v1 aider --model openai/together-deepseek-ai/DeepSeek-R1
    OPENAI_API_BASE=http://localhost:1235/v1 aider --model openai/openai_o1-o3-mini
    OPENAI_API_BASE=http://localhost:1235/v1 aider --watch-files --model openai/anthropic-claude-sonnet

Add stuff to aider

    /read-only README.md
    /add src/*.tsx src/*.ts package.json
    https://developers.raycast.com/api-reference/menu-bar-commands



## Goal

Create a Raycast Extension that provides an OpenAI compatible API server
- internally calls AI.ask (https://developers.raycast.com/api-reference/ai#ai.ask) to.. . It's a no-view command.
- Port is configurable in the extension preferences: https://developers.raycast.com/api-reference/preferences
