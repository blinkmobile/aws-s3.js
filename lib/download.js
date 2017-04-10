'use strict';

const fs = require('fs');

function download ({
  bucket /* : string */,
  filePath /* : string */,
  key /* : string */,
  s3
}) /* : Promise<void> */ {
  return new Promise((resolve, reject) => {
    // Create writable stream to write file too
    const writable = fs.createWriteStream(filePath);
    writable.once('finish', () => {
      writable.removeAllListeners();
      resolve();
    });
    writable.on('error', (err) => {
      writable.removeAllListeners();
      writable.end();
      reject(new Error(`Error while writing downloaded project to file: ${err}`));
    });

    // Create request to download object from S3
    const manager = s3.getObject({
      Key: key,
      Bucket: bucket
    });
    manager.on('error', (err) => reject(new Error(`Error while downloading project from S3: ${err}`)));

    // Create readable stream to read file from
    const reader = manager.createReadStream();
    reader.on('error', (err) => reject(new Error(`Error while reading downloaded project: ${err}`)));
    reader.pipe(writable);
  });
}

module.exports = { download };
