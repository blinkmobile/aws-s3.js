/* @flow */
'use strict';

const chunk = require('lodash.chunk');

const bucketPathPrefixHelper = require('./utils/bucket-path-prefix-helper.js');

const deleteObjectTask = (task) => (keys) => {
  return new Promise((resolve, reject) => {
    keys.forEach((filename) => task.emit('deleting', filename));
    task.s3.deleteObjects({
      Delete: {
        Objects: keys.map((k) => ({Key: `${task.bucketPathPrefix}${k}`}))
      }
    }, (err, data) => {
      if (err) {
        return reject(err);
      }

      // let any listeners know which files have been deleted
      if (data.Deleted.length) {
        data.Deleted.forEach((deleted) => task.emit('deleted', bucketPathPrefixHelper.getFileFromKey(task.bucketPathPrefix, deleted.Key)));
      }

      // if there were any errors for single files, emit the error.
      if (data.Errors.length) {
        data.Errors.forEach((err) => task.emit('error', new Error(err.Message), bucketPathPrefixHelper.getFileFromKey(task.bucketPathPrefix, err.Key)));
      }
      resolve(data);
    });
  });
};

function deleteObjects (
  task /* : Object */,
  keys /* : string[] */
) /* : Promise<Object[]> */ {
  // deleteObjects is limited to 1000 keys at a time
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

  const chunks = chunk(keys, 1000);
  return Promise.all(chunks.map(deleteObjectTask(task)));
}

module.exports = {deleteObjects};
