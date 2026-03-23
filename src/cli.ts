#!/usr/bin/env node

/**
 * jest-gen CLI: AI-powered Jest test generator using DeepWiki
 * 
 * Usage:
 *   jest-gen <owner> <repo> [glob-pattern] [options]
 * 
 * Examples:
 *   jest-gen AsyncFuncAI deepwiki-open
 *   jest-gen AsyncFuncAI deepwiki-open "src/**\/*.ts"
 *   jest-gen AsyncFuncAI deepwiki-open "src/**\/*.ts" --provider openai --language en
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import {
  generateTestsViaDeepWiki,
  checkDeepWikiHealth,
  getDeepWikiBaseUrl,
  type GenerateTestsOptions,
} from './lib/deepwiki.js';
import {
  extractCodeBlock,
  generateTestPath,
  isValidTestFile,
  ensureTypeImports,
} from './lib/parser.js';
import { logger } from './lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CliOptions {
  owner: string;
  repo: string;
  pattern: string;
  provider: string;
  model?: string;
  language: string;
  dryRun: boolean;
  skipValidation: boolean;
  outputDir?: string;
}

function parseArguments(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    printUsage();
    process.exit(1);
  }

  const owner = args[0];
  const repo = args[1];
  let pattern = args[2] || 'src/**/*.{ts,tsx}';

  let provider = 'google';
  let model: string | undefined;
  let language = 'en';
  let dryRun = false;
  let skipValidation = false;
  let outputDir: string | undefined;

  // Parse flags
  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--provider' && args[i + 1]) {
      provider = args[++i];
    } else if (arg === '--model' && args[i + 1]) {
      model = args[++i];
    } else if (arg === '--language' && args[i + 1]) {
      language = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      outputDir = args[++i];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--skip-validation') {
      skipValidation = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return {
    owner,
    repo,
    pattern,
    provider,
    model,
    language,
    dryRun,
    skipValidation,
    outputDir,
  };
}

function printUsage() {
  console.log(`
${'\x1b[1m'}jest-gen${'\x1b[0m'} - AI-powered Jest test generator

${'\x1b[1m'}Usage:${'\x1b[0m'}
  jest-gen <owner> <repo> [glob-pattern] [options]

${'\x1b[1m'}Arguments:${'\x1b[0m'}
  owner                Repository owner (e.g., AsyncFuncAI)
  repo                 Repository name (e.g., deepwiki-open)
  glob-pattern         File pattern to match (default: src/**/*.{ts,tsx})

${'\x1b[1m'}Options:${'\x1b[0m'}
  --provider <name>    AI provider: google, openai, anthropic (default: google)
  --model <name>       Specific model to use
  --language <lang>    Language for comments: en, es, fr, etc. (default: en)
  --output <dir>       Output directory for test files (default: __tests__)
  --dry-run            Show what would be generated without writing files
  --skip-validation    Skip validation of generated test files
  --help, -h           Show this help message

${'\x1b[1m'}Environment Variables:${'\x1b[0m'}
  DEEPWIKI_URL         DeepWiki server URL (default: http://localhost:3000)
  DEEPWIKI_API_KEY     API key for DeepWiki (optional)
  DEEPWIKI_TIMEOUT     Request timeout in ms (default: 120000)
  LOG_LEVEL            Logging level: DEBUG, INFO, WARN, ERROR (default: INFO)

${'\x1b[1m'}Examples:${'\x1b[0m'}
  # Generate tests for TypeScript files
  jest-gen AsyncFuncAI deepwiki-open "src/**/*.ts"

  # Use OpenAI provider
  jest-gen MyOrg my-repo --provider openai --model gpt-4

  # Dry run to preview what would be generated
  jest-gen AsyncFuncAI deepwiki-open --dry-run

  # Spanish comments
  jest-gen AsyncFuncAI deepwiki-open --language es
`);
}

async function findFilesToTest(pattern: string): Promise<string[]> {
  const files = await glob(pattern, {
    ignore: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
    ],
  });

  return files.filter(f => f && f.trim().length > 0);
}

async function generateTestForFile(
  filePath: string,
  options: CliOptions
): Promise<{ success: boolean; testPath?: string; error?: string }> {
  try {
    // Read source file
    const fileContent = readFileSync(filePath, 'utf-8');

    logger.debug(`Generating test for ${filePath}...`);

    // Generate test via DeepWiki
    const aiResponse = await generateTestsViaDeepWiki({
      owner: options.owner,
      repo: options.repo,
      filePath,
      fileContent,
      language: options.language,
      provider: options.provider,
      model: options.model,
    });

    // Extract code from response
    const testCode = extractCodeBlock(aiResponse);

    // Validate test file (unless skipped)
    if (!options.skipValidation && !isValidTestFile(testCode)) {
      return {
        success: false,
        error: 'Generated code does not appear to be a valid test file',
      };
    }

    // Add type imports if needed
    const enhancedCode = ensureTypeImports(testCode);

    // Determine output path
    const testPath = generateTestPath(filePath);
    const outputPath = options.outputDir
      ? resolve(options.outputDir, testPath.replace('__tests__/', ''))
      : resolve(testPath);

    if (!options.dryRun) {
      // Create directories
      mkdirSync(dirname(outputPath), { recursive: true });

      // Write test file
      writeFileSync(outputPath, enhancedCode + '\n', 'utf-8');
    }

    return { success: true, testPath: options.dryRun ? testPath : outputPath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const options = parseArguments();

  logger.header('🧪 Jest Test Generator');
  logger.info(`DeepWiki Server: ${getDeepWikiBaseUrl()}`);
  logger.info(`Provider: ${options.provider}${options.model ? ` (${options.model})` : ''}`);
  logger.info(`Language: ${options.language}`);

  // Check DeepWiki health
  logger.info('Checking DeepWiki connection...');
  const isHealthy = await checkDeepWikiHealth();
  if (!isHealthy) {
    logger.error(`Cannot reach DeepWiki at ${getDeepWikiBaseUrl()}`);
    logger.error('Make sure DeepWiki is running: docker compose up');
    process.exit(1);
  }
  logger.success('DeepWiki is healthy');

  // Find files
  logger.info(`\nSearching for files matching: ${options.pattern}`);
  const files = await findFilesToTest(options.pattern);

  if (files.length === 0) {
    logger.warn('No files found matching pattern');
    process.exit(0);
  }

  logger.success(`Found ${files.length} file(s) to generate tests for`);

  if (options.dryRun) {
    logger.warn('DRY RUN - No files will be written');
  }

  // Generate tests
  logger.header(`Generating Tests (${options.dryRun ? 'DRY RUN' : 'LIVE'})`);

  let successCount = 0;
  let failureCount = 0;
  const results: Array<{ file: string; result: { success: boolean; testPath?: string; error?: string } }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;

    logger.info(`${progress} Processing: ${file}`);

    const result = await generateTestForFile(file, options);
    results.push({ file, result });

    if (result.success) {
      logger.success(`${progress} ✓ ${result.testPath || 'Generated'}`);
      successCount++;
    } else {
      logger.error(`${progress} ✗ ${result.error}`);
      failureCount++;
    }

    // Add small delay to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary
  logger.header('Summary');
  logger.success(`Successful: ${successCount}`);
  if (failureCount > 0) {
    logger.warn(`Failed: ${failureCount}`);
  }

  if (options.dryRun) {
    logger.info('Use jest-gen without --dry-run to actually write files');
  } else {
    logger.info('Run `npx jest` to execute the generated tests');
  }

  process.exit(failureCount > 0 ? 1 : 0);
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
