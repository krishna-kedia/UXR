const path = require('path');
const fs = require('fs-extra');

const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
fs.ensureDirSync(uploadsDir);

module.exports = {
  uploadsDir
}; 