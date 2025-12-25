const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'api_usage.log');
const reportFilePath = path.join(__dirname, '..', 'api_usage_report.txt');

fs.readFile(logFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Failed to read log file:', err);
    return;
  }

  const lines = data.split('\n').filter(line => line.trim() !== '' && !line.includes('INFO:') && !line.includes('ERROR:') && !line.includes('WARN:') && !line.includes('DEBUG:'));
  const apiUsage = {};

  lines.forEach(line => {
    const parts = line.split(' ');
    if (parts.length >= 3) {
      const method = parts[1];
      const url = parts[2];
      const endpoint = `${method} ${url}`;

      if (apiUsage[endpoint]) {
        apiUsage[endpoint]++;
      } else {
        apiUsage[endpoint] = 1;
      }
    }
  });

  let report = 'API Usage Report\n';
  report += '==================\n\n';

  for (const endpoint in apiUsage) {
    report += `${endpoint}: ${apiUsage[endpoint]} requests\n`;
  }

  fs.writeFile(reportFilePath, report, 'utf8', (err) => {
    if (err) {
      console.error('Failed to write report file:', err);
      return;
    }
    console.log('API usage report generated successfully.');
  });
});
