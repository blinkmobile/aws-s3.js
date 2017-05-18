/* @flow */
'use strict';

const fs = require('fs');
const path = require('path');

function uploadObject (
  task /* : Object */,
  fileName /* : string */
) /* : Promise<void> */ {
  const cwd = task.cwd;
  let stream = fs.createReadStream(path.join(cwd, fileName));
  task.emit('uploading', fileName);

  // lookup details in our local files Map
  let meta;
  try {
    meta = task.files.get(fileName);
  } catch (err) {
    const error = new Error('metadata for ' + fileName + ' unavailable');
    task.emit('error', error, fileName);
    return Promise.reject(error);
  }

  // make request to AWS S3
  return new Promise((resolve, reject) => {
    task.s3.upload({
      Body: stream,
      ContentType: meta.ContentType,
      Key: `${task.bucketPathPrefix}${fileName}`
    }, (err, data) => {
      if (err) {
        task.emit('error', err, fileName);
        reject(err);
        return;
      }
      resolve(data);
    });
  })
    .then(() => {
      task.emit('uploaded', fileName);
    })
    .catch((err) => {
      throw err;
    });
}

module.exports = {
  uploadObject,

  uploadObjects (
    task /* : Object */,
    fileList /* : string[] */
  ) /* : Promise<Array<void>> */ {
    return Promise.all(fileList.map((fileName) => uploadObject(task, fileName)));
  }
};
