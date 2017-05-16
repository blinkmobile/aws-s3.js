'use strict';

const workerFarm = require('worker-farm');

// fromS3Contents (contents: Object[]) => Promise<Map>
// creates a Map by parsing the result of an S3 listObjects request
function fromS3Contents (contents) {
  const map = new Map();
  contents.forEach((entry) => {
    map.set(entry.Key, entry);
  });
  return Promise.resolve(map);
}

// fromFiles (fs?: Object, cwd: String, filePaths: String[]) => Promise<Map>
// creates a Map by scanning the local filesystem
function fromFiles (fs, cwd, filePaths) {
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

// isEqual (file: Object, object: Object) => Boolean
function isEqual (file, object) {
  return file.Size === object.Size && trimQuotes(file.ETag) === trimQuotes(object.ETag);
}

// compare (files: Map, objects: Map, options: Object) => Object
// creates a plan of what to do by comparing the local and remote Maps
function compare (files, objects, options) {
  const deletes = [];
  const noops = [];
  const uploads = [];
  const skip = options.skip;

  // compare local against remote, to find local files to upload
  for (let key of files.keys()) {
    let file = files.get(key);
    let object = objects.get(key);
    if (!object || !isEqual(file, object) || !skip) {
      uploads.push(key);
    } else {
      noops.push(key);
    }
  }

  // compare remote against local, to find remote files to delete
  for (let key of objects.keys()) {
    if (!files.has(key)) {
      deletes.push(key);
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
