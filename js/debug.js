/**
 * debug.js
 * Centralized debugging and logging utility for Financial GPS
 *
 * Usage:
 *   Debug.log('message')           - General log
 *   Debug.info('message')          - Info level
 *   Debug.warn('message')          - Warning level
 *   Debug.error('message')         - Error level
 *   Debug.group('name')            - Start a collapsed group
 *   Debug.groupEnd()               - End group
 *   Debug.table(data)              - Display data as table
 *   Debug.time('label')            - Start timer
 *   Debug.timeEnd('label')         - End timer and show duration
 *
 * Console Commands:
 *   Debug.enable()                 - Enable all logging
 *   Debug.disable()                - Disable all logging
 *   Debug.setLevel('warn')         - Set minimum level (log, info, warn, error)
 *   Debug.status()                 - Show current debug status
 *   Debug.history()                - Show recent log history
 */

const Debug = (function() {
  // Configuration
  let enabled = true; // Set to false for production
  let minLevel = 'log'; // Minimum level to display: log, info, warn, error
  const levels = { log: 0, info: 1, warn: 2, error: 3 };

  // Store recent logs for history
  const logHistory = [];
  const maxHistory = 100;

  // Styling for console output
  const styles = {
    prefix: 'color: #d4af37; font-weight: bold;',
    log: 'color: #e0e0e0;',
    info: 'color: #60a5fa;',
    warn: 'color: #fbbf24;',
    error: 'color: #ef4444; font-weight: bold;',
    success: 'color: #22c55e;',
    state: 'color: #a855f7;',
    event: 'color: #06b6d4;',
    render: 'color: #ec4899;',
    data: 'color: #84cc16;'
  };

  // Prefix for all logs
  const PREFIX = '[Financial GPS]';

  /**
   * Core logging function
   */
  function log(level, category, message, ...args) {
    if (!enabled) return;
    if (levels[level] < levels[minLevel]) return;

    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, level, category, message, args };

    // Store in history
    logHistory.push(entry);
    if (logHistory.length > maxHistory) logHistory.shift();

    // Format output
    const categoryTag = category ? `[${category}]` : '';
    const style = styles[category] || styles[level] || styles.log;

    // Output to console
    const consoleMethod = console[level] || console.log;
    consoleMethod(
      `%c${PREFIX}%c ${categoryTag} ${message}`,
      styles.prefix,
      style,
      ...args
    );
  }

  return {
    // Basic logging methods
    log: (message, ...args) => log('log', null, message, ...args),
    info: (message, ...args) => log('info', 'info', message, ...args),
    warn: (message, ...args) => log('warn', 'warn', message, ...args),
    error: (message, ...args) => log('error', 'error', message, ...args),

    // Categorized logging
    state: (message, ...args) => log('log', 'state', message, ...args),
    event: (message, ...args) => log('log', 'event', message, ...args),
    render: (message, ...args) => log('log', 'render', message, ...args),
    data: (message, ...args) => log('log', 'data', message, ...args),
    success: (message, ...args) => log('info', 'success', message, ...args),

    // Grouped logging
    group: (label) => {
      if (!enabled) return;
      console.groupCollapsed(`%c${PREFIX}%c ${label}`, styles.prefix, styles.info);
    },
    groupEnd: () => {
      if (!enabled) return;
      console.groupEnd();
    },

    // Table display
    table: (data, columns) => {
      if (!enabled) return;
      console.table(data, columns);
    },

    // Performance timing
    time: (label) => {
      if (!enabled) return;
      console.time(`${PREFIX} ${label}`);
    },
    timeEnd: (label) => {
      if (!enabled) return;
      console.timeEnd(`${PREFIX} ${label}`);
    },

    // Debug control methods (always available)
    enable: () => {
      enabled = true;
      console.log(`%c${PREFIX}%c Debugging ENABLED`, styles.prefix, styles.success);
    },
    disable: () => {
      console.log(`%c${PREFIX}%c Debugging DISABLED`, styles.prefix, styles.warn);
      enabled = false;
    },
    setLevel: (level) => {
      if (levels[level] !== undefined) {
        minLevel = level;
        console.log(`%c${PREFIX}%c Log level set to: ${level}`, styles.prefix, styles.info);
      } else {
        console.log(`%c${PREFIX}%c Invalid level. Use: log, info, warn, error`, styles.prefix, styles.error);
      }
    },
    status: () => {
      console.log(`%c${PREFIX}%c Debug Status:`, styles.prefix, styles.info);
      console.log(`  Enabled: ${enabled}`);
      console.log(`  Min Level: ${minLevel}`);
      console.log(`  History: ${logHistory.length} entries`);
    },
    history: (count = 20) => {
      console.log(`%c${PREFIX}%c Recent Log History (last ${count}):`, styles.prefix, styles.info);
      const recent = logHistory.slice(-count);
      console.table(recent.map(e => ({
        time: e.timestamp,
        level: e.level,
        category: e.category || '-',
        message: e.message
      })));
    },

    // Utility: Log current app state
    logState: () => {
      if (!enabled) return;
      if (typeof getState === 'function') {
        console.log(`%c${PREFIX}%c Current State:`, styles.prefix, styles.state);
        console.log(getState());
      }
    },

    // Utility: Assert with logging
    assert: (condition, message) => {
      if (!condition) {
        log('error', 'assert', `Assertion failed: ${message}`);
      }
    },

    // Check if enabled
    isEnabled: () => enabled
  };
})();

// Expose to window
window.Debug = Debug;

// Log initialization
Debug.info('Debug utility loaded. Type Debug.status() for info.');
