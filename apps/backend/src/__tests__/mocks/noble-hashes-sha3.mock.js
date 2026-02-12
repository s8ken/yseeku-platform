const crypto = require('crypto');

function sha3_512(message) {
  return crypto.createHash('sha512').update(String(message)).digest();
}

module.exports = { sha3_512 };
