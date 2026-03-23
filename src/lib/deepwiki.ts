/**
 * DeepWiki API client for test generation
 * Communicates with a running DeepWiki instance to generate tests
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateTestsOptions {
  owner: string;
  repo: string;
  filePath: string;
  fileContent: string;
  language?: string;
  provider?: string;
  model?: string;
}

const DEEPWIKI_BASE = process.env.DEEPWIKI_URL || "http://localhost:3000";
const DEEPWIKI_API_KEY = process.env.DEEPWIKI_API_KEY || "";
const DEEPWIKI_TIMEOUT = parseInt(process.env.DEEPWIKI_TIMEOUT || "120000", 10);

export async function generateTestsViaDeepWiki(
  options: GenerateTestsOptions,
): Promise<string> {
  const {
    owner,
    repo,
    filePath,
    fileContent,
    language = "en",
    provider = "google",
    model = undefined,
  } = options;

  const testGenerationPrompt = `You are an expert JavaScript/TypeScript testing engineer specializing in Jest.
You are analyzing the repository: ${owner}/${repo}

Your task is to generate a comprehensive, production-ready Jest test file for the following source file.

The tests should:
1. Cover all exported functions, classes, and components
2. Include unit tests with proper mocking of dependencies
3. Test edge cases, error handling, and boundary conditions
4. Use descriptive test names following: "should [expected behavior] when [condition]"
5. Include proper imports and Jest configuration
6. Use beforeEach/afterEach for setup/teardown where appropriate
7. Mock external dependencies (API calls, file system, etc.)
8. Aim for high code coverage (80%+ if possible)
9. Be realistic and executable (no placeholder tests)

Source file to test:
File: ${filePath}
\`\`\`
${fileContent}
\`\`\`

IMPORTANT: 
- Respond ONLY with the test file code inside a single TypeScript code block
- Do NOT include explanations or comments outside the code block
- The code block must start with \`\`\`typescript and end with \`\`\`
- Use TypeScript for the test file
- Import from the actual file path (not mocked)
- Make realistic tests that would actually run
`;

  const requestBody: Record<string, unknown> = {
    repo_url: `https://github.com/${owner}/${repo}`,
    messages: [
      {
        role: "user",
        content: testGenerationPrompt,
      },
    ] as ChatMessage[],
    provider,
  };

  if (model) {
    requestBody.model = model;
  }

  try {
    const response = await fetch(`${DEEPWIKI_BASE}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(DEEPWIKI_API_KEY && {
          Authorization: `Bearer ${DEEPWIKI_API_KEY}`,
        }),
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(DEEPWIKI_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(
        `DeepWiki API error: ${response.status} ${response.statusText}`,
      );
    }

    // Handle streaming response
    let fullResponse = "";

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
      }
    } else {
      // Fallback for non-streaming response
      fullResponse = await response.text();
    }

    return fullResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Cannot reach DeepWiki at ${DEEPWIKI_BASE}. Make sure it's running.`,
      );
    }
    throw error;
  }
}

export async function checkDeepWikiHealth(): Promise<boolean> {
  const probes: Array<{ path: string; method: "GET" | "OPTIONS" }> = [
    { path: "/health", method: "GET" },
    // DeepWiki UI deployments may not expose /health but do expose the chat API.
    { path: "/api/chat/stream", method: "OPTIONS" },
    { path: "/api/chat/stream", method: "GET" },
  ];

  for (const probe of probes) {
    try {
      const response = await fetch(`${DEEPWIKI_BASE}${probe.path}`, {
        method: probe.method,
        signal: AbortSignal.timeout(5000),
      });

      // A non-404 response means the server is reachable and route likely exists.
      if (
        response.ok ||
        (response.status >= 400 &&
          response.status < 500 &&
          response.status !== 404)
      ) {
        return true;
      }
    } catch {
      // Continue probing other endpoints before deciding it's down.
    }
  }

  return false;
}

export function getDeepWikiBaseUrl(): string {
  return DEEPWIKI_BASE;
}
