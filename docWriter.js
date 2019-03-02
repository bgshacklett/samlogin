const path    = require('path');
const fs      = require('fs');
const homedir = require('os').homedir();

function outputDocAsDownload(doc) {
  const credsPath = path.join(homedir, '.aws', 'credentials');
  fs.writeFileSync(credsPath, doc);
}

module.exports = {
                   outputDocAsDownload,
                 };
