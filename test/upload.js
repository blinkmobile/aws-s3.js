'use strict';

const EventEmitter = require('events');
const path = require('path');

const test = require('ava');

const upload = require('..').upload;

const mockS3 = {
  listObjectsV2 (options, callback) { callback(null, { Contents: [] }); },
  upload (options, callback) {
    if (!options.ContentType) {
      throw new TypeError('missing ContentType');
    }
    return {
      on: () => {},
      send: (fn) => fn()
    };
  }
};

test('upload() missing s3 throws', (t) => {
  t.throws(() => upload(), TypeError);
});

test('upload() incomplete s3 throws', (t) => {
  t.throws(() => upload({ s3: {} }), TypeError);
});

test('upload() old s3 version throws', (t) => {
  t.throws(() => upload({ s3: {listObjects: () => true} }), TypeError);
});

test('upload() => EventEmitter', (t) => {
  const task = upload({ s3: mockS3 });
  t.truthy(task instanceof EventEmitter);
});

test('upload().promise: Promise', (t) => {
  const task = upload({ s3: mockS3 });
  t.truthy(task.promise instanceof global.Promise);
});

test('task = upload({ filePaths: [...] }); task.filePaths as provided', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const filePaths = [
    'abc.txt',
    'sub/sub/index.html'
  ];
  const task = upload({ cwd, filePaths, s3: mockS3 });
  return task.promise
    .then(() => {
      t.deepEqual(task.filePaths, filePaths);
    });
});

test('task = upload({ filePaths: null }); task.filePaths glob\'ed', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const filePaths = [
    'abc.txt',
    'sub/sub/index.html'
  ];
  const task = upload({ cwd, s3: mockS3 });
  return task.promise
    .then(() => {
      t.deepEqual(task.filePaths, filePaths);
    });
});

test('task = upload({ filePaths: null }); events', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const events = {
    'abc.txt': { uploading: false, uploaded: false },
    'sub/sub/index.html': { uploading: false, uploaded: false }
  };
  const task = upload({ cwd, s3: mockS3 });
  task.on('uploading', (fileName) => {
    events[fileName].uploading = true;
  });
  task.on('uploaded', (fileName) => {
    events[fileName].uploaded = true;
  });
  return task.promise
    .then(() => {
      t.deepEqual(events, {
        'abc.txt': { uploading: true, uploaded: true },
        'sub/sub/index.html': { uploading: true, uploaded: true }
      });
    });
});

test('task uploads and deletes', (t) => {
  const mockS3 = {
    listObjectsV2 (options, callback) {
      callback(null, { Contents: [
        {Key: 'abcd.txt'},
        {Key: 'efgh.txt'},
        {Key: 'ijkl.txt'}
      ]});
    },
    upload (options, callback) {
      if (!options.ContentType) {
        throw new TypeError('missing ContentType');
      }
      return {
        on: () => {},
        send: (fn) => fn()
      };
    },
    deleteObjects (params, cb) {
      cb(null, {
        Deleted: [
          {Key: 'abcd.txt'},
          {Key: 'efgh.txt'},
          {Key: 'ijkl.txt'}
        ],
        Errors: []
      });
    }
  };

  const events = {
    'abcd.txt': {deleting: false, deleted: false},
    'efgh.txt': {deleting: false, deleted: false},
    'ijkl.txt': {deleting: false, deleted: false}
  };
  const cwd = path.join(__dirname, 'fixtures');
  const task = upload({cwd, s3: mockS3, prune: true});
  task.on('deleting', (filename) => {
    events[filename].deleting = true;
  });
  task.on('deleted', (filename) => {
    events[filename].deleted = true;
  });

  return task.promise.then(() => {
    t.deepEqual(events, {
      'abcd.txt': {deleting: true, deleted: true},
      'efgh.txt': {deleting: true, deleted: true},
      'ijkl.txt': {deleting: true, deleted: true}
    });
  });
});
