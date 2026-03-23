/**
 * Simple logger utility
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLogLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
const minLogLevel = LogLevel[currentLogLevel as keyof typeof LogLevel] ?? LogLevel.INFO;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function shouldLog(level: LogLevel): boolean {
  return level >= minLogLevel;
}

export const logger = {
  debug: (message: string, ...meta: unknown[]) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.log(`${colors.dim}[DEBUG]${colors.reset}`, message, ...meta);
    }
  },

  info: (message: string, ...meta: unknown[]) => {
    if (shouldLog(LogLevel.INFO)) {
      console.log(`${colors.blue}[INFO]${colors.reset}`, message, ...meta);
    }
  },

  success: (message: string, ...meta: unknown[]) => {
    if (shouldLog(LogLevel.INFO)) {
      console.log(`${colors.green}✓${colors.reset}`, message, ...meta);
    }
  },

  warn: (message: string, ...meta: unknown[]) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(`${colors.yellow}[WARN]${colors.reset}`, message, ...meta);
    }
  },

  error: (message: string, ...meta: unknown[]) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(`${colors.red}[ERROR]${colors.reset}`, message, ...meta);
    }
  },

  header: (message: string) => {
    if (shouldLog(LogLevel.INFO)) {
      console.log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
    }
  },
};
