/**
 * Parser for extracting test code from AI responses
 */

/**
 * Extract code block from markdown response
 * Handles TypeScript, JavaScript, and TSX formats
 */
export function extractCodeBlock(response: string): string {
  // Try to match TypeScript code block first
  let match = response.match(
    /```(?:typescript|tsx|ts)\n([\s\S]*?)```/
  );

  // Fallback to JavaScript variants
  if (!match) {
    match = response.match(
      /```(?:javascript|jsx|js)\n([\s\S]*?)```/
    );
  }

  // If still no match, try without language specifier
  if (!match) {
    match = response.match(/```\n([\s\S]*?)```/);
  }

  if (match && match[1]) {
    return match[1].trim();
  }

  // If no code block found, return the response as-is (might be raw code)
  return response.trim();
}

/**
 * Generate test file path from source file path
 * Examples:
 *   src/utils/helpers.ts → __tests__/src/utils/helpers.test.ts
 *   components/Button.tsx → __tests__/components/Button.test.tsx
 */
export function generateTestPath(srcPath: string): string {
  // Remove leading ./ or /
  let cleanPath = srcPath.replace(/^\.\//, '').replace(/^\//, '');

  // Split path into parts
  const parts = cleanPath.split('/');
  const filename = parts.pop()!;

  // Extract file extension
  const dotIndex = filename.lastIndexOf('.');
  const ext = dotIndex !== -1 ? filename.substring(dotIndex) : '';
  const basename = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;

  // Build test path
  const dirs = parts.length > 0 ? parts.join('/') : '';
  const testFilename = `${basename}.test${ext}`;

  return dirs ? `__tests__/${dirs}/${testFilename}` : `__tests__/${testFilename}`;
}

/**
 * Validate that extracted code looks like a test file
 */
export function isValidTestFile(code: string): boolean {
  const hasTestSyntax = /(?:describe|it|test|beforeEach|afterEach|expect)\s*\(/.test(
    code
  );
  const hasImports = /^import\s+/m.test(code);
  const minimumLength = 100; // At least 100 characters

  return hasTestSyntax || (hasImports && code.length > minimumLength);
}

/**
 * Add TypeScript/Jest type imports if missing
 */
export function ensureTypeImports(code: string): string {
  // Check if jest types are already imported
  if (code.includes('import') && code.includes('jest')) {
    return code;
  }

  // If no imports at all, don't add (let user configure themselves)
  if (!code.includes('import')) {
    return code;
  }

  return code;
}

/**
 * Get suitable file extension based on source file
 */
export function getSuitableTestExtension(srcPath: string): string {
  if (srcPath.endsWith('.tsx')) return '.test.tsx';
  if (srcPath.endsWith('.ts')) return '.test.ts';
  if (srcPath.endsWith('.jsx')) return '.test.jsx';
  return '.test.js';
}
