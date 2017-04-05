'use strict';

const fs = require('fs');
const path = require('path');

const pify = require('pify');

const md5stream = require('./md5').md5stream;
const mimeType = require('./mime').mimeType;

const fsp = pify(fs);

// each worker executes this function
module.exports = function (input, callback) {
  const localPath = path.join(input.cwd, input.filePath);
  // calculate size, MD5 and MIME all concurrently
  Promise.all([
    fsp.stat(localPath),
    md5stream(fs.createReadStream(localPath)),
    mimeType(localPath)
  ])
    .then((results) => {
      const stats = results[0];
      const md5 = results[1];
      const mime = results[2];
      // return with the collected results
      callback(null, {
        ContentType: mime,
        ETag: md5,
        Key: input.filePath,
        LastModified: stats.mtime,
        Size: stats.size
      });
    })
    .catch((err) => callback(err));
};
