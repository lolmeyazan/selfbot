/**
 * Terminal Logger Utility
 * 
 * This utility allows other components to log messages to the Terminal
 * by writing to localStorage, which the Terminal component already reads from.
 */

type LineLevel = "info" | "success" | "warning" | "error" | "muted";

const TERMINAL_LINES_KEY = "boty_terminal_lines_v1";

interface TerminalLine {
  id: number;
  level: LineLevel;
  text: string;
}

let lineIdRef = 1;

function getNextId(): number {
  const current = lineIdRef;
  lineIdRef += 1;
  return current;
}

/**
 * Append a log line to the terminal
 * @param text - The message to log
 * @param level - The severity level (info, success, warning, error, muted)
 */
export function logToTerminal(text: string, level: LineLevel = "info"): void {
  try {
    // Get existing lines from localStorage
    const raw = localStorage.getItem(TERMINAL_LINES_KEY);
    let existingLines: TerminalLine[] = [];
    
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TerminalLine[];
        if (Array.isArray(parsed)) {
          existingLines = parsed;
          // Update lineIdRef to avoid conflicts
          if (existingLines.length > 0) {
            lineIdRef = Math.max(...existingLines.map(l => l.id)) + 1;
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Add new line
    const newLine: TerminalLine = {
      id: getNextId(),
      text,
      level
    };

    // Keep only last 600 lines (same as Terminal)
    const updatedLines = [...existingLines, newLine].slice(-600);
    
    // Save back to localStorage
    localStorage.setItem(TERMINAL_LINES_KEY, JSON.stringify(updatedLines));
  } catch {
    // Fallback to console if localStorage is not available
    console.log(`[Terminal] ${text}`);
  }
}

/**
 * Convenience methods for common log levels
 */
export const terminalLogger = {
  info: (text: string) => logToTerminal(text, "info"),
  success: (text: string) => logToTerminal(text, "success"),
  warning: (text: string) => logToTerminal(text, "warning"),
  error: (text: string) => logToTerminal(text, "error"),
  muted: (text: string) => logToTerminal(text, "muted"),
};
