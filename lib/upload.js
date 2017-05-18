/* @flow */
'use strict';

const EventEmitter = require('events');
const fs = require('fs');

const getGlobIgnore = require('./utils/ignore.js').getGlobIgnore;
const maps = require('./maps');
const glob = require('./utils/glob').glob;
const listObjects = require('./list-objects').listObjects;
const uploadObjects = require('./upload-object').uploadObjects;
const deleteObjects = require('./delete-objects.js').deleteObjects;
const bucketPathPrefixHelper = require('./utils/bucket-path-prefix-helper.js');

const S3_METHODS = ['listObjectsV2', 'upload'];

// assertS3 (options: Object) => Object
function assertS3 (options) {
  const s3 = options.s3;
  if (!s3 || typeof s3 !== 'object') {
    throw new TypeError('"s3" object must be provided');
  }
  S3_METHODS.forEach((method) => {
    if (typeof s3[method] !== 'function') {
      throw new TypeError(`provided "s3" object missing "${method}" method`);
    }
  });
  return options;
}

// mergeDefaults (options: Object) => Object
function mergeDefaults (
  options /* : Object */
) /* : Object */ {
  options = options || {};

  // create a new object, merging `options` over the top of defaults
  return Object.assign({}, {
    cwd: process.cwd(),
    dryRun: false,
    filePaths: null,
    fs,
    prune: false,
    s3: null,
    skip: true,
    bucketPathPrefix: ''
  }, options);
}

// getFilePaths (options: Object) => Promise<String[]>
// passes the provided filePaths through, otherwise scans the filesystem
function getFilePaths (options) {
  if (Array.isArray(options.filePaths)) {
    return Promise.resolve(options.filePaths.concat([]));
  }
  return getGlobIgnore(options.cwd)
    .then((ignore) => glob('**/*', {
      cwd: options.cwd,
      dot: false,
      ignore,
      nodir: true
    }));
}

// upload (options: UploadOptions) => Task
// main entry point, see README.md
function upload (
  options /* : Object */
) /* : Object */ {
  options = mergeDefaults(options);
  assertS3(options);

  // make an object that inherits from EventEmitter
  const task = Object.create(EventEmitter.prototype, {});

  // copy some critical options to it for later use
  task.s3 = options.s3;
  task.cwd = options.cwd;
  task.bucketPathPrefix = bucketPathPrefixHelper.validate(options.bucketPathPrefix);

  // create a Promise, consumers can use Promise and/or events
  // start by ensuring that we have a list of files to work on
  task.promise = getFilePaths(options)
    .then((filePaths) => {
      task.filePaths = filePaths;
    })
    // scan remote S3 Bucket and local filesystem concurrently
    .then(() => Promise.all([
      listObjects(options.s3, task.bucketPathPrefix).then(maps.fromS3Contents),
      maps.fromFiles(null, options.cwd, task.filePaths)
    ]))
    .then((results) => {
      task.objects = results[0];
      task.files = results[1];
      // compare local and remote Maps, build a plan
      const plan = maps.compare(task.files, task.objects, {
        skip: options.skip,
        bucketPathPrefix: task.bucketPathPrefix
      });
      // per our API, emit events for any files that we are skipping
      plan.noops.forEach((fileName) => task.emit('skipped', fileName));

      // perform the work, start uploading!
      if (options.prune) {
        return Promise.all([
          uploadObjects(task, plan.uploads),
          deleteObjects(task, plan.deletes)
        ]);
      }

      return uploadObjects(task, plan.uploads);
    });

  return task;
}

module.exports = { mergeDefaults, upload };
