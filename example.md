# Auto-commit CLI Tool Usage Example

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Link globally (optional):
```bash
npm link
```

## Usage

### 1. Configure the tool
```bash
auto-commit config
```

This will guide you through:
- Selecting an LLM provider (OpenAI, Anthropic, Google, DeepSeek, Qwen, Ollama)
- Entering API key (if required)
- Choosing a model from available options

Configuration is saved to `~/.auto-commit/config.yml`

### 2. Generate and commit changes
```bash
# Stage your changes first
git add .

# Run auto-commit to generate and apply commit message
auto-commit
```

The tool will:
- Analyze staged changes
- Generate a Conventional Commits format message using AI
- Ask for confirmation before committing
- Execute the git commit

## Example Workflow

```bash
# Make some changes to your code
echo "console.log('Hello World');" > hello.js

# Stage the changes
git add hello.js

# Use auto-commit to generate and apply commit message
auto-commit
```

The tool will generate something like:
```
feat: add hello world script

Add simple JavaScript file that logs hello world message to console.
```

## Supported Providers

- **OpenAI**: GPT-4, GPT-3.5-turbo, etc. ✅ *Dynamic model list*
- **Anthropic**: Claude 3/4 models ✅ *Dynamic model list*
- **Google**: Gemini 1.5/2.0/2.5 models ✅ *Dynamic model list*
- **DeepSeek**: DeepSeek Chat, DeepSeek Coder ✅ *Dynamic model list*
- **Qwen**: Qwen Turbo, Plus, Max 📋 *Predefined list*
- **Ollama**: Local models (no API key required) ✅ *Dynamic model list*

✅ = Models are fetched dynamically from API  
📋 = Uses predefined model list

## Configuration File

Located at `~/.auto-commit/config.yml`:
```yaml
provider: openai
apiKey: your-api-key-here
model: gpt-4
```