const logger = {
  middleware: (req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  },
  info: (message) => console.log(`INFO: ${message}`),
  error: (message) => console.error(`ERROR: ${message}`),
  warn: (message) => console.warn(`WARN: ${message}`),
  debug: (message) => console.debug(`DEBUG: ${message}`),
};

module.exports = logger;
