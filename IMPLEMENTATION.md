# jest-gen Implementation Guide

## Overview

**jest-gen** is an AI-powered Jest test generator that creates comprehensive test files by analyzing your source code through DeepWiki. It's a standalone CLI tool that communicates with a running DeepWiki instance.

```
┌─────────────────────────────────────────────────────────────┐
│                    jest-gen (This Tool)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CLI Interface                                        │   │
│  │ - File discovery (glob patterns)                     │   │
│  │ - User interface (progress, messages)                │   │
│  │ - File I/O (reading source, writing tests)           │   │
│  └──────────────────────────────────────────────────────┘   │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ DeepWiki API Client (HTTP)                          │   │
│  │ - Sends code + instruction to DeepWiki              │   │
│  │ - Receives AI-generated test code (streaming)        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP REST/Streaming
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DeepWiki (Separate Service)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Next.js Frontend (proxy to backend)                  │   │
│  │ Flask/FastAPI Backend                               │   │
│  │ - RAG pipeline (repo understanding)                  │   │
│  │ - AI model integration (Google, OpenAI, etc.)        │   │
│  │ - Streaming response                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
jest-gen/
├── src/
│   ├── cli.ts                 # Main CLI entry point (800+ lines)
│   └── lib/
│       ├── deepwiki.ts        # DeepWiki API client (~100 lines)
│       ├── parser.ts          # Code block extraction & validation (~150 lines)
│       └── logger.ts          # Colored logger (~100 lines)
├── README.md                  # Full documentation
├── CONFIGURATION.md           # Setup & workflows guide
├── EXAMPLES.md                # Sample generated tests
├── IMPLEMENTATION.md          # This file
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── quick-start.sh             # Quick start script
└── .gitignore                 # Git ignore patterns
```

## Core Components

### 1. CLI (`src/cli.ts`)

**Purpose**: Main entry point, orchestrates the entire flow.

**Key Functions**:
- `parseArguments()` - Parse command-line flags
- `findFilesToTest(pattern)` - Glob files matching the pattern
- `generateTestForFile()` - Process a single file (read → send to DeepWiki → parse → write)
- `main()` - Orchestrate all steps with progress reporting

**Flow**:
```
main()
  ├─ parseArguments()              # Parse CLI flags
  ├─ checkDeepWikiHealth()         # Verify DeepWiki is running
  ├─ findFilesToTest(pattern)      # Find source files to test
  └─ For each file:
      └─ generateTestForFile()
          ├─ readFileSync()         # Read source code
          ├─ generateTestsViaDeepWiki()  # AI generation
          ├─ extractCodeBlock()     # Parse response
          ├─ isValidTestFile()      # Validate
          └─ writeFileSync()        # Write __tests__/ file
```

### 2. DeepWiki Client (`src/lib/deepwiki.ts`)

**Purpose**: HTTP communication with DeepWiki server.

**Key Functions**:
- `generateTestsViaDeepWiki(options)` - Main function
  - Builds the test generation prompt
  - Sends HTTP POST to `/api/chat/stream`
  - Reads streaming response
  - Returns full AI-generated test code

- `checkDeepWikiHealth()` - Verify DeepWiki is running
- `getDeepWikiBaseUrl()` - Get configured server URL

**Environment Variables**:
- `DEEPWIKI_URL` - Server URL (default: `http://localhost:3000`)
- `DEEPWIKI_API_KEY` - Optional API key
- `DEEPWIKI_TIMEOUT` - Request timeout (default: 120s)

**Prompt Structure**:
```typescript
const prompt = `
You are an expert JavaScript/TypeScript testing engineer...
[Task description]
Generate comprehensive Jest test file for:
${fileContents}
[Output format requirements]
`;
```

### 3. Parser (`src/lib/parser.ts`)

**Purpose**: Extract and validate test code from AI responses.

**Key Functions**:
- `extractCodeBlock(response)` - Regex to find ````typescript ... ```` block
- `generateTestPath(srcPath)` - Convert `src/utils/helper.ts` → `__tests__/utils/helper.test.ts`
- `isValidTestFile(code)` - Check if code contains Jest syntax (describe, it, expect)
- `ensureTypeImports(code)` - Add TypeScript/Jest types if missing
- `getSuitableTestExtension(srcPath)` - Determine `.test.ts` or `.test.tsx`

**Validation Regex**:
```typescript
hasTestSyntax = /(?:describe|it|test|beforeEach|afterEach|expect)\s*\(/.test(code)
```

### 4. Logger (`src/lib/logger.ts`)

**Purpose**: Colored, level-aware logging.

**Methods**:
- `logger.debug()` - Detailed debug info
- `logger.info()` - General information
- `logger.success()` - Success messages (green ✓)
- `logger.warn()` - Warnings (yellow)
- `logger.error()` - Errors (red)
- `logger.header()` - Section headers

**Colors**:
```
Debug:   Dim gray
Info:    Blue
Success: Green checkmark
Warn:    Yellow
Error:   Red
```

## Data Flow

### Example: Generate test for `src/utils/helpers.ts`

```
1. USER INPUT
   $ jest-gen AsyncFuncAI deepwiki-open "src/utils/*.ts"

2. CLI PARSING
   args = {
     owner: "AsyncFuncAI",
     repo: "deepwiki-open",
     pattern: "src/utils/*.ts",
     provider: "google",
     ...
   }

3. FILE DISCOVERY
   files = glob.sync("src/utils/*.ts")
   // → ["src/utils/helpers.ts", "src/utils/validators.ts", ...]

4. FOR EACH FILE
   4a. READ SOURCE
       fileContent = readFileSync("src/utils/helpers.ts")
       // Export function validateEmail(email: string): boolean { ... }

   4b. BUILD PROMPT
       prompt = `You are an expert...
       Generate Jest tests for:
       ${fileContent}
       Use TypeScript...`

   4c. SEND TO DEEPWIKI (HTTP POST)
       response = await fetch("http://localhost:3000/api/chat/stream", {
         body: JSON.stringify({ messages: [{ role: "user", content: prompt }] })
       })
       // DeepWiki receives prompt
       // → Analyzes repository context via RAG
       // → Calls Google/OpenAI/Anthropic API
       // → Streams back Jest test code

   4d. PARSE RESPONSE
       code = extractCodeBlock(response)
       // Regex: /```typescript\n([\s\S]*?)```/

   4e. VALIDATE
       isValid = isValidTestFile(code)
       // Check: contains describe/it/expect, has imports

   4f. GENERATE OUTPUT PATH
       outPath = generateTestPath("src/utils/helpers.ts")
       // → "__tests__/src/utils/helpers.test.ts"

   4g. WRITE FILE
       mkdirSync("__tests__/src/utils")
       writeFileSync("__tests__/src/utils/helpers.test.ts", code)

5. OUTPUT
   ✓ [1/2] Processing: src/utils/helpers.ts
   ✓ [1/2] ✓ __tests__/src/utils/helpers.test.ts
   ✓ [2/2] Processing: src/utils/validators.ts
   ✓ [2/2] ✓ __tests__/src/utils/validators.test.ts
   
   Summary:
   Successful: 2
   Run `npx jest` to execute the generated tests
```

## Integration with DeepWiki

jest-gen **uses DeepWiki as a service** for AI capabilities:

```typescript
// jest-gen sends this:
POST /api/chat/stream HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Generate Jest tests for: [source code] ..."
    }
  ],
  "provider": "google",
  "model": undefined
}

// DeepWiki responds with streaming chunks:
// Chunk 1: "```typescript\n"
// Chunk 2: "import { foo } from '../src';\n"
// Chunk 3: "describe('foo', () => {\n"
// ... more chunks ...
// Last chunk: "});\n```"
```

## Configuration & Extensibility

### Adding a New Provider

1. Update prompt in `deepwiki.ts` if provider-specific syntax needed
2. Set `DEEPWIKI_URL` and configure provider in DeepWiki itself
3. jest-gen just passes the provider name to DeepWiki

### Customizing Test Generation

Edit the `JEST_TEST_GENERATION_PROMPT` in `src/lib/deepwiki.ts`:

```typescript
const testGenerationPrompt = `
You are an expert...
[Customize requirements here]
Include:
  - Arrange/Act/Assert pattern
  - Specific mocking strategy
  - Coverage targets
  - Custom naming conventions
`;
```

### Adding Validation Rules

Edit `isValidTestFile()` in `src/lib/parser.ts`:

```typescript
export function isValidTestFile(code: string): boolean {
  // Add more specific checks
  const hasArrangeActAssert = /(?:arrange|act|assert|setup|when|then)/i.test(code);
  const hasMocks = /jest\.mock|jest\.spyOn|vi\.mock/.test(code);
  // ... more checks
  return hasTestSyntax && (hasArrangeActAssert || hasMocks);
}
```

## Error Handling

### Scenario 1: DeepWiki not running
```
Error: Cannot reach DeepWiki at http://localhost:3000. Make sure it's running.
Solution: Start DeepWiki first, then retry
```

### Scenario 2: Invalid test generated
```
Error: Generated code does not appear to be a valid test file
Solution: Use --skip-validation to override, or adjust prompt
```

### Scenario 3: API key required
```
Error: DeepWiki API error: 401 Unauthorized
Solution: Set DEEPWIKI_API_KEY environment variable
```

### Scenario 4: Timeout
```
Error: Timeout after 120000ms
Solution: Increase DEEPWIKI_TIMEOUT or use smaller file batches
```

## Testing jest-gen itself

```bash
# Test the CLI help
npm run dev -- --help

# Test file parsing
npm run dev -- AsyncFuncAI deepwiki-open --dry-run

# Test with custom provider
npm run dev -- AsyncFuncAI deepwiki-open --provider openai --model gpt-4

# Build for production
npm run build
node dist/cli.js --help
```

## Performance Characteristics

| Aspect | Details |
|--------|---------|
| **Sequential processing** | Files processed one at a time to avoid rate limiting |
| **Typical file gen time** | 30-60 seconds per file (depends on size & complexity) |
| **Network usage** | Streaming responses (no buffering entire response) |
| **Disk I/O** | Only writes to `__tests__/` directory |
| **Memory** | ~50MB typical (stores one file at a time) |
| **Parallelization** | Can be added in future if needed |

## Future Enhancements

1. **Parallel processing** - Process multiple files concurrently
2. **Caching** - Skip regenerating unchanged files
3. **Test coverage analysis** - Report coverage $$
4. **Test quality scoring** - Rate generated tests
5. **Web UI** - Visual interface for test generation
6. **IDE integration** - VS Code extension
7. **Config file** - `.jest-gen.json` for project-level config
8. **Git integration** - Auto-generate tests for changed files
9. **Test framework options** - Vitest, Mocha, Chai support
10. **Language-specific** - Java, Python, Go test generation

## Architecture Benefits

| Benefit | Reason |
|---------|--------|
| **Separation of concerns** | jest-gen focuses on file I/O + UX, DeepWiki handles AI |
| **Dependency reuse** | Doesn't duplicate DeepWiki's RAG/model integration |
| **Easy to distribute** | Small, standalone npm package |
| **Zero breaking changes** | DeepWiki can be updated independently |
| **Flexible deployment** | Can run on CI/CD, local machine, etc. |
| **Language agnostic** | Uses HTTP (could port to Python, Go, etc.) |

---

**Created**: March 2026  
**Version**: 0.1.0  
**Status**: Production-ready MVP
