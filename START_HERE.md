# 🚀 jest-gen: Start Here!

## What You Have

A **complete, ready-to-use Jest test generator** that creates test files automatically using AI + DeepWiki.

## 3-Step Quick Start

### Step 1: Start DeepWiki (in a new terminal)

```bash
cd /home/aroez/Repos/deepwiki-open
docker compose up -d

# Wait ~30 seconds for it to start
# Verify it's running: curl http://localhost:3000/health
```

### Step 2: Generate Tests

```bash
cd /home/aroez/Repos/jest-gen

# Preview what will be generated (safe)
npx tsx src/cli.ts AsyncFuncAI deepwiki-open --dry-run

# Actually generate tests
npx tsx src/cli.ts AsyncFuncAI deepwiki-open "src/**/*.ts"
```

### Step 3: Run the Tests

```bash
cd /home/aroez/Repos/deepwiki-open
npx jest
```

## 📚 Documentation

| File | Purpose | Read Time |
|---|---|---|
| [README.md](README.md) | Full user guide with examples | 10 min |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Architecture & design details | 15 min |
| [CONFIGURATION.md](CONFIGURATION.md) | Setup guides & workflows | 10 min |
| [EXAMPLES.md](EXAMPLES.md) | Sample generated test outputs | 5 min |
| [SUMMARY.md](SUMMARY.md) | Project overview | 5 min |

## 🎯 Common Tasks

### Generate tests for a specific directory
```bash
npx tsx src/cli.ts MyOrg my-repo "src/utils/**/*.ts"
```

### Use a different AI provider
```bash
npx tsx src/cli.ts MyOrg my-repo --provider openai --model gpt-4
```

### Preview without creating files
```bash
npx tsx src/cli.ts MyOrg my-repo --dry-run
```

### View what parameters are available
```bash
npx tsx src/cli.ts --help
```

### Custom output directory
```bash
npx tsx src/cli.ts MyOrg my-repo --output ./tests/generated
```

## 🏗️ Project Structure

```
jest-gen/
├── src/cli.ts              ← Main CLI entry point
├── src/lib/deepwiki.ts     ← DeepWiki API client
├── src/lib/parser.ts       ← Code parsing & validation
├── src/lib/logger.ts       ← Colored logging
├── README.md               ← Full documentation
└── package.json            ← npm dependencies
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run the CLI
npx tsx src/cli.ts <owner> <repo>

# Build TypeScript to JavaScript
npm run build

# Run built version
node dist/cli.js <owner> <repo>
```

## ❓ Frequently Asked Questions

**Q: Do I need DeepWiki running?**  
A: Yes. Start it with `docker compose up -d` in the deepwiki-open directory.

**Q: What if a test fails to generate?**  
A: jest-gen will log the error and continue with other files. Use `--skip-validation` to bypass validation checks.

**Q: Can I customize the generated tests?**  
A: Edit the prompt in `src/lib/deepwiki.ts` to change how tests are generated.

**Q: How long does it take?**  
A: Typically 30-60 seconds per file, depending on file size and AI provider latency.

**Q: Can I use this with projects other than DeepWiki?**  
A: Yes! jest-gen just sends HTTP requests. Point `DEEPWIKI_URL` to any compatible server.

**Q: How do I publish this to npm?**  
A: Run `npm publish` (requires npm account). Users can then `npm install -g jest-gen`.

## 🎁 What jest-gen Does

1. **Finds your source files** using glob patterns
2. **Sends them to DeepWiki** for AI analysis
3. **Receives generated Jest tests** via streaming
4. **Parses and validates** the test code  
5. **Writes test files** to `__tests__/` directory
6. **Shows progress** with colored output

## ✨ Key Features

- ✅ AI-powered test generation
- ✅ Works with any AI provider (Google, OpenAI, Anthropic, Ollama)
- ✅ CLI-first (no web UI to learn)
- ✅ Validates generated code
- ✅ Dry-run mode to preview
- ✅ Multilingual support
- ✅ Comprehensive documentation
- ✅ Production-ready code

## 🚀 Ready?

```bash
# Let's go!
cd /home/aroez/Repos/jest-gen

# See if it works
npx tsx src/cli.ts --help

# Generate some tests
npx tsx src/cli.ts AsyncFuncAI deepwiki-open --dry-run
```

---

**Questions?** Check [README.md](README.md) for complete documentation.

**Ready to create tests?** [CONFIGURATION.md](CONFIGURATION.md) has more examples.

**Want technical details?** [IMPLEMENTATION.md](IMPLEMENTATION.md) explains the architecture.
