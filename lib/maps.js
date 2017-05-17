/* @flow */
'use strict';

const workerFarm = require('worker-farm');

const bucketPathPrefixHelper = require('./utils/bucket-path-prefix-helper.js');

// creates a Map by parsing the result of an S3 listObjects request
function fromS3Contents (
  contents /* : Object[] */
) /* : Promise<Map<string, Object>> */ {
  const map = new Map();
  contents.forEach((entry) => {
    map.set(entry.Key, entry);
  });
  return Promise.resolve(map);
}

// creates a Map by scanning the local filesystem
function fromFiles (
  fs /* : ?Object */,
  cwd /* : string */,
  filePaths /* : string[] */
) /* : Promise<Map<string, Object>> */ {
  const map = new Map();

  const workers = workerFarm(require.resolve('./utils/fs-map-child'));

  return new Promise((resolve, reject) => {
    for (let f = 0; f < filePaths.length; f += 1) {
      let filePath = filePaths[f];
      // sends one path at a time to the worker pool
      workers({ cwd, filePath }, (err, output) => {
        if (err) {
          workerFarm.end(workers);
          reject(err);
          return;
        }
        if (typeof output.LastModified === 'string') {
          output.LastModified = new Date(output.LastModified);
        }
        map.set(filePath, output);

        // we can only tell we are finished by counting our results
        if (map.size >= filePaths.length) {
          // looks like we're done
          workerFarm.end(workers);
          resolve(map);
        }
      });
    }
  });
}

// trimQuotes (string: String) => String
function trimQuotes (string) {
  return string.trim().replace(/"/g, '');
}

function isEqual (
  file /* : Object | void */,
  object /* : Object */
) /* : boolean */ {
  if (!file) {
    return false;
  }
  return file.Size === object.Size && trimQuotes(file.ETag) === trimQuotes(object.ETag);
}

// creates a plan of what to do by comparing the local and remote Maps
function compare (
  files /* : Map<string, Object> */,
  objects /* : Map<string, Object> */,
  options /* : { skip: boolean, bucketPathPrefix: string } */
) /* : Object */ {
  const deletes = [];
  const noops = [];
  const uploads = [];
  const skip = options.skip;
  const bucketPathPrefix = options.bucketPathPrefix;

  // compare local against remote, to find local files to upload
  for (let key of files.keys()) {
    let file = files.get(key);
    let object = objects.get(`${bucketPathPrefix}${key}`);
    if (!object || !isEqual(file, object) || !skip) {
      uploads.push(key);
    } else {
      noops.push(key);
    }
  }

  // compare remote against local, to find remote files to delete
  for (let key of objects.keys()) {
    const file = bucketPathPrefixHelper.getFileFromKey(bucketPathPrefix, key);
    if (!files.has(file)) {
      deletes.push(file);
    }
  }

  return { deletes, noops, uploads };
}

module.exports = {
  compare,
  fromFiles,
  fromS3Contents,
  isEqual
};
