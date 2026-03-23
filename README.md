# jest-gen 🧪

AI-powered Jest test generator using **DeepWiki**. Automatically generate comprehensive Jest test files for your JavaScript/TypeScript projects powered by AI.

## Features

✨ **AI-Powered** — Uses DeepWiki's RAG to understand your codebase  
🎯 **Smart Mocking** — Automatically mocks external dependencies  
📝 **Good Test Quality** — Edge cases, error handling, realistic tests  
⚡ **CLI-First** — Terminal-based workflow, zero web UI overhead  
🔌 **Provider Flexible** — Works with Google, OpenAI, Anthropic, and more  
🌍 **Multilingual** — Supports test comments in multiple languages  

## Prerequisites

- **Node.js** 18+ 
- **DeepWiki** running locally (see [setup](#setup))
- A source code repository to test

## Installation

```bash
# Clone or download this repository
cd jest-gen

# Install dependencies
npm install

# Optional: Build for production
npm run build
```

## Setup: Running DeepWiki

jest-gen communicates with a running DeepWiki instance. Start it first:

```bash
# In your deepwiki-open directory
git clone https://github.com/AsyncFuncAI/deepwiki-open.git
cd deepwiki-open

# Start with Docker Compose
docker compose up -d

# Or run the Python backend directly
cd api
python main.py  # Starts on http://localhost:8000
```

Jest-gen will try to connect to `http://localhost:3000` by default (the front-end proxy).

## Quick Start

### 1. Basic Usage

```bash
# Generate tests for a repository
jest-gen AsyncFuncAI deepwiki-open

# This will:
# 1. Find all .ts/.tsx files in src/**
# 2. Send them to DeepWiki for AI analysis
# 3. Write test files to __tests__/ directory
```

### 2. Custom File Pattern

```bash
# Test only specific files
jest-gen AsyncFuncAI deepwiki-open "src/utils/**/*.ts"
jest-gen MyOrg my-repo "components/**/*.tsx"

# Or use multiple patterns
jest-gen MyOrg my-repo "src/**/{services,hooks}/*.ts"
```

### 3. Choose AI Provider

```bash
# Use OpenAI (requires OPENAI_API_KEY in DeepWiki config)
jest-gen AsyncFuncAI deepwiki-open --provider openai --model gpt-4

# Use Anthropic
jest-gen AsyncFuncAI deepwiki-open --provider anthropic

# Use local Ollama
jest-gen AsyncFuncAI deepwiki-open --provider ollama
```

### 4. Multilingual Comments

```bash
# Generate tests with Spanish comments
jest-gen AsyncFuncAI deepwiki-open --language es

# Or French
jest-gen AsyncFuncAI deepwiki-open --language fr
```

### 5. Dry Run (Preview)

```bash
# See what would be generated without writing files
jest-gen AsyncFuncAI deepwiki-open --dry-run
```

### 6. Custom Output Directory

```bash
# Write tests to a specific directory
jest-gen AsyncFuncAI deepwiki-open --output ./tests/__generated__
```

## Environment Variables

```bash
# DeepWiki server URL
export DEEPWIKI_URL=http://localhost:3000

# API key for authenticated access (optional)
export DEEPWIKI_API_KEY=your_api_key_here

# Request timeout in milliseconds
export DEEPWIKI_TIMEOUT=120000

# Logging level
export LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR
```

## Examples

### Example 1: Generate tests for React components

```bash
jest-gen my-org my-app "src/components/**/*.tsx" \
  --provider openai \
  --model gpt-4 \
  --language en
```

**What this does:**
- Finds all `.tsx` files in `src/components/`
- Analyzes them using GPT-4 via OpenAI
- Generates Jest tests for each component
- Writes to `__tests__/components/` directory

### Example 2: Generate tests for utilities with custom output

```bash
jest-gen my-org my-app "src/utils/**/*.ts" \
  --output "./coverage/tests" \
  --provider google
```

### Example 3: Preview before generating (dry run)

```bash
jest-gen my-org my-app "src/services/*.ts" --dry-run

# Shows what would be generated, doesn't write files
# Useful for verifying patterns before running for real
```

## Generated Test Structure

```
__tests__/
├── utils/
│   ├── helpers.test.ts          ← From src/utils/helpers.ts
│   └── validators.test.ts       ← From src/utils/validators.ts
├── components/
│   └── Button.test.tsx          ← From src/components/Button.tsx
└── services/
    └── api.test.ts              ← From src/services/api.ts
```

## What Gets Generated

Each test file includes:

- ✅ **Unit tests** for all exported functions/classes
- ✅ **Mocked dependencies** (external APIs, file system, etc.)
- ✅ **Edge case tests** (null values, edge conditions)
- ✅ **Error handling tests** (try/catch scenarios)
- ✅ **Realistic test data** (not placeholder stubs)
- ✅ **Clear test names** following Jest conventions
- ✅ **Setup/teardown** with `beforeEach`/`afterEach`
- ✅ **Comments in your language** (English, Spanish, French, etc.)

Example generated test:

```typescript
// __tests__/utils/validateEmail.test.ts
import { validateEmail } from '../../src/utils/validateEmail';

describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should return false for invalid email format', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('should handle edge cases like empty strings', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

## Running Generated Tests

```bash
# Install Jest if you haven't already
npm install --save-dev jest ts-jest @types/jest

# Run all tests
npx jest

# Run tests in watch mode
npx jest --watch

# Check coverage
npx jest --coverage
```

## Configuration

### jest.config.js

Make sure your `jest.config.js` covers the test files:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
};
```

### TypeScript

Ensure your `tsconfig.json` includes Jest types:

```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

## Troubleshooting

### "Cannot reach DeepWiki"

```bash
# Check if DeepWiki is running
curl http://localhost:3000/health

# If not running, start it
cd ../deepwiki-open
docker compose up -d
```

### "Generated code does not appear to be a valid test file"

Add `--skip-validation` to bypass this check:

```bash
jest-gen AsyncFuncAI deepwiki-open --skip-validation
```

### "API error: 401 Unauthorized"

If you set an API key in DeepWiki:

```bash
export DEEPWIKI_API_KEY=your_key
jest-gen AsyncFuncAI deepwiki-open
```

### Tests timeout

Increase the timeout:

```bash
export DEEPWIKI_TIMEOUT=180000  # 3 minutes
jest-gen AsyncFuncAI deepwiki-open
```

## How It Works

1. **File Discovery** — CLI finds all source files matching your pattern
2. **DeepWiki Analysis** — Each file is sent to DeepWiki with the test generation prompt
3. **AI Generation** — DeepWiki's AI generates comprehensive Jest tests
4. **Code Extraction** — jest-gen extracts the test code from the AI response
5. **Validation** — Tests are validated to ensure they're syntactically correct
6. **File Writing** — Test files are written to the `__tests__/` directory
7. **Ready to Run** — Run `npx jest` to execute the generated tests

## Performance Notes

- **First run** may take longer (5-10 minutes for 10+ files) as the AI analyzes each file
- **Parallel processing** is not yet implemented; files are processed sequentially to avoid rate limits
- **Caching** is not implemented; running again will regenerate all tests

For large test suites, consider running jest-gen in batches:

```bash
jest-gen AsyncFuncAI deepwiki-open "src/utils/*.ts"    # Utils
jest-gen AsyncFuncAI deepwiki-open "src/services/*.ts" # Services
jest-gen AsyncFuncAI deepwiki-open "src/components/*.tsx" # Components
```

## API Usage

You can also use jest-gen as a library:

```typescript
import {
  generateTestsViaDeepWiki,
  checkDeepWikiHealth,
} from './lib/deepwiki';
import { extractCodeBlock, generateTestPath } from './lib/parser';

// Check health
const isHealthy = await checkDeepWikiHealth();

// Generate a test
const response = await generateTestsViaDeepWiki({
  owner: 'myorg',
  repo: 'myrepo',
  filePath: 'src/utils/helper.ts',
  fileContent: '// source code here',
  provider: 'google',
});

// Parse result
const testCode = extractCodeBlock(response);
const testPath = generateTestPath('src/utils/helper.ts');
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with live reload
npm run dev

# Build for production
npm run build

# Run the built version
node dist/cli.js AsyncFuncAI deepwiki-open
```

## License

MIT — See LICENSE file

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Open an issue on GitHub
- Contact the AsyncFuncAI team

---

**Made with ❤️ by AsyncFuncAI**
