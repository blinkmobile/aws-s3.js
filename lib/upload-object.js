'use strict';

const fs = require('fs');
const path = require('path');

// uploadObject (task: Task, fileName: String) => Promise
function uploadObject (task, fileName) {
  const cwd = task.cwd;
  const filePath = path.isAbsolute(fileName) ? fileName : path.join(cwd, fileName);
  let stream = fs.createReadStream(filePath);
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
  const manager = task.s3.upload({
    Body: stream,
    ContentType: meta.ContentType,
    Key: fileName
  });
  manager.on('httpUploadProgress', (uploadProgress) => {
    // Note that total may be undefined until the payload size is known.
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html
    if (uploadProgress.total) {
      task.emit('uploading', fileName, Math.floor(uploadProgress.loaded / uploadProgress.total * 100));
    }
  });

  return new Promise((resolve, reject) => {
    manager.send((err, data) => {
      if (err) {
        reject(err);
        return;
      }
      task.emit('uploaded', fileName);
      resolve(data);
    });
  })
    .catch((err) => {
      task.emit('error', err, fileName);
      return Promise.reject(err);
    });
}

module.exports = {
  uploadObject,

  // uploadObjects (task: Task, fileList: String[]) => Promise
  uploadObjects (task, fileList) {
    return Promise.all(fileList.map((fileName) => uploadObject(task, fileName)));
  }
};
