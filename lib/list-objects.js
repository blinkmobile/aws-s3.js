/* @flow */
'use strict';

const co = require('co');

const listObjects = function (s3, bucketPathPrefix, continuationToken) {
  return new Promise((resolve, reject) => {
    const params = {};
    if (bucketPathPrefix) {
      params.Prefix = bucketPathPrefix;
    }
    if (continuationToken) {
      params.ContinuationToken = continuationToken;
    }
    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data);
    });
  });
};

const listAll = co.wrap(function * (s3, bucketPathPrefix) {
  // wait for the first batch of objects from s3
  let results = yield listObjects(s3, bucketPathPrefix);
  let contents = results.Contents;

  // if we have more results
  while (results.NextContinuationToken) {
    // get those results and wait for the async task to finish
    results = yield listObjects(s3, bucketPathPrefix, results.NextContinuationToken);
    // add results to the list
    contents = contents.concat(results.Contents);
  }

  return contents;
});

module.exports = { listObjects: listAll };
