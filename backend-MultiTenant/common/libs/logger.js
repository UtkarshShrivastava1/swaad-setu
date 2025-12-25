const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '..', '..', 'api_usage.log');

const logger = {
  middleware: (req, res, next) => {
    const logMessage = `${new Date().toISOString()} ${req.method} ${req.url}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
    next();
  },
  info: (message) => {
    const logMessage = `${new Date().toISOString()} INFO: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  },
  error: (message) => {
    const logMessage = `${new Date().toISOString()} ERROR: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  },
  warn: (message) => {
    const logMessage = `${new Date().toISOString()} WARN: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  },
  debug: (message) => {
    const logMessage = `${new Date().toISOString()} DEBUG: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  },
};

module.exports = logger;

