# Auto-Commit

> AI-powered git commit message generator with intelligent diff processing and multi-provider support

According to git staged content, AI summarizes changes and generates commit messages following Conventional Commits format. Supports multiple LLM providers including OpenAI, Anthropic, Google, DeepSeek, Qwen, and Ollama.

## ✨ Features

- 🤖 **Multi-LLM Support**: OpenAI, Anthropic, Google, DeepSeek, Qwen, Ollama
- 📊 **Intelligent Token Management**: Precise token counting with `@xenova/transformers`
- 🗜️ **Adaptive Diff Compression**: 4-layer strategy to handle large diffs
- 🎯 **Conventional Commits**: Generates properly formatted commit messages
- ⚡ **Dynamic Model Lists**: Fetches latest available models from APIs
- 🔄 **Smart Fallback**: Graceful degradation when token limits are exceeded

## 🚀 Installation

```bash
npm install -g @whiteriverbay/auto-commit
```

Or use directly with npx:
```bash
npx @whiteriverbay/auto-commit
```

## 📖 Usage

### Initial Setup

Configure your LLM provider and model:

```bash
auto-commit config
```

Interactive configuration process:
```
🔧 Auto-commit Configuration

? Select LLM Provider: › 
❯ OpenAI
  Anthropic (Claude)
  Google (Gemini)
  DeepSeek
  Qwen (通义千问)
  Ollama (Local)
  Exit

? Enter your OpenAI API key: ********
? Continue with configuration? Yes

Fetching available models...
? Select a model: ›
❯ gpt-4
  gpt-4-turbo  
  gpt-3.5-turbo
  Exit

✅ Configuration saved successfully!
Provider: OpenAI
Model: gpt-4
```

### Generate Commit Messages

Stage your changes and let AI generate the commit message:

```bash
# Stage your changes
git add .

# Generate and commit
auto-commit
```

## 🎬 Demo

### Basic Usage
```
$ auto-commit
🔍 Analyzing staged changes...
🤖 Generating commit message using AI...
Provider: google
Model: gemini-2.5-flash
Token limit: 50,000
Loading tokenizer: Xenova/gpt-4o
Compression level: full
Diff tokens: 1,245
✅ Generated commit message:
"feat(auth): add JWT token validation middleware"
? Do you want to commit with this message? Yes
📝 Committing changes...
✅ Successfully committed changes!
Commit message: "feat(auth): add JWT token validation middleware"
```

### Large Diff with Compression
```
$ auto-commit
🔍 Analyzing staged changes...
🤖 Generating commit message using AI...
Provider: openai
Model: gpt-4
Token limit: 4,096
Loading tokenizer: Xenova/gpt-4o
Compression level: smart
Diff tokens: 3,891
✅ Generated commit message:
"feat(dashboard): implement user analytics with charts and filters

- Add ChartComponent with D3.js integration
- Implement user filtering by date range
- Add export functionality for analytics data"
? Do you want to commit with this message? Yes
📝 Committing changes...
✅ Successfully committed changes!
```

### Extreme Compression for Very Large Changes
```
$ auto-commit
🔍 Analyzing staged changes...
🤖 Generating commit message using AI...
Provider: anthropic
Model: claude-3-5-sonnet-20241022
Token limit: 8,192
Loading tokenizer: Xenova/claude-tokenizer
Compression level: extreme
Diff tokens: 7,854
✅ Generated commit message:
"refactor: major codebase restructuring and dependency updates

Modified 47 files (+2,847 -1,923 lines)"
? Do you want to commit with this message? Yes
📝 Committing changes...
✅ Successfully committed changes!
```

### Error Handling
```
$ auto-commit
⚠️  No staged changes found.
Use `git add <files>` to stage files before running auto-commit.

$ auto-commit
❌ Error: Not a git repository
Please run this command in a git repository directory.
```

## 🛠️ Supported Providers

| Provider | Status | Models | Token Limit | Dynamic List |
|----------|--------|--------|-------------|--------------|
| **OpenAI** | ✅ Active | GPT-4, GPT-3.5-turbo, etc. | 4,096 | ✅ |
| **Anthropic** | ✅ Active | Claude 3/4 series | 8,192 | ✅ |
| **Google** | ✅ Active | Gemini 1.5/2.0/2.5 series | 50,000 | ✅ |
| **DeepSeek** | ✅ Active | DeepSeek Chat/Coder | 4,096 | ✅ |
| **Qwen** | ✅ Active | Qwen Turbo/Plus/Max | 4,096 | 📋 Fixed |
| **Ollama** | ✅ Active | Local models | 2,048 | ✅ |

✅ = Dynamic model fetching  
📋 = Predefined model list

## 🧠 Intelligent Compression

Auto-commit uses a 4-layer compression strategy to handle diffs of any size:

### 1. Full Level (Optimal)
```
File: src/components/UserProfile.tsx
Changes:
+import { useState, useEffect } from 'react';
+import { User } from '../types/User';
+
+export const UserProfile = ({ userId }: { userId: string }) => {
+  const [user, setUser] = useState<User | null>(null);
```

### 2. Smart Level (Key Changes)
```
File: src/components/UserProfile.tsx [core] (+45 -12)
Key changes:
  + import { useState, useEffect } from 'react'
  + export const UserProfile = ({ userId }: { userId: string })
  + const [user, setUser] = useState<User | null>(null)
```

### 3. Minimal Level (Summary)
```
Modified: 3 core files, 2 config files (+127 -89 lines)
```

### 4. Extreme Level (Stats Only)
```
Modified 8 files (+234 -156 lines)
```

## ⚙️ Configuration

Configuration is stored in `~/.auto-commit/config.yml`:

```yaml
provider: google
apiKey: your-api-key-here
model: gemini-2.5-flash
```

### Environment Variables

You can also set API keys via environment variables:
```bash
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key" 
export GOOGLE_GENERATIVE_AI_API_KEY="your-key"
```

## 🔧 Development

### Prerequisites
- Node.js 16+
- Git repository

### Local Development
```bash
# Clone the repository
git clone https://github.com/ethanzhrepo/auto-commit.git
cd auto-commit

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm run dev

# Or test built version
node dist/index.js
```

### Testing
```bash
# Create test changes
echo "console.log('test');" > test.js
git add test.js

# Test the tool
npm run dev
# or
node dist/index.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel AI SDK](https://ai-sdk.dev) - Unified AI provider interface
- [Transformers.js](https://huggingface.co/docs/transformers.js) - Client-side tokenization
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message specification

## 🐛 Troubleshooting

### Common Issues

**"No configuration found"**
```bash
auto-commit config
```

**"Invalid JSON response"**
- Usually resolved automatically with intelligent compression
- Try different model or provider if issues persist

**"Token limit exceeded"** 
- The tool automatically compresses diffs to fit token limits
- No action needed - compression happens transparently

**Model loading errors**
- Check your API key is valid
- Verify internet connection for model downloads
- Some models may take time to download on first use

### Getting Help

- 🐛 [Report Issues](https://github.com/ethanzhrepo/auto-commit/issues)
- 💬 [Discussions](https://github.com/ethanzhrepo/auto-commit/discussions)
- 📧 Support: GitHub Issues

---

<div align="center">
  <p>Made with ❤️ for developers who love clean commit messages</p>
</div>
