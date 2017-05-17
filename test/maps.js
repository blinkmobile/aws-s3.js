'use strict';

const path = require('path');

const test = require('ava');

const maps = require('../lib/maps');

test('fromFiles', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const filePaths = [
    'abc.txt',
    'sub/sub/index.html'
  ];
  const expected = {
    'abc.txt': {
      ContentType: 'text/plain',
      Key: 'abc.txt',
      ETag: '6cd3556deb0da54bca060b4c39479839',
      Size: 13
    },
    'sub/sub/index.html': {
      ContentType: 'text/html',
      Key: 'sub/sub/index.html',
      ETag: '62f9bca5a72ef519c4877c61ac2c8ac7',
      Size: 112
    }
  };
  return maps.fromFiles(null, cwd, filePaths)
    .then((map) => filePaths.forEach((key) => {
      const entry = map.get(key);
      t.truthy(entry.LastModified instanceof Date);
      delete entry.LastModified; // value is too unpredictable for this test
      t.deepEqual(map.get(key), expected[key]);
    }));
});

test('fsFileToMap with missing local file', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const filePaths = [
    'missing.txt'
  ];
  return maps.fromFiles(null, cwd, filePaths)
    .then(() => t.fail('resolved'))
    .catch((err) => t.truthy(err));
});

test('s3ContentsToMap', (t) => {
  const contents = [
    {
      Key: 'abc.txt',
      LastModified: new Date(),
      ETag: '"abc"',
      Size: 123
    }
  ];
  return maps.fromS3Contents(contents)
    .then((map) => {
      t.deepEqual(contents[0], map.get(contents[0].Key));
    });
});

test('compareMaps skip=true', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const filePaths = [
    'abc.txt',
    'sub/sub/index.html'
  ];
  return maps.fromFiles(null, cwd, filePaths)
    .then((files) => {
      let objects = new Map();
      const abc = files.get('abc.txt');
      // real ETags from S3 have double-quotes
      abc.ETag = `"${abc.ETag}"`;
      objects.set('abc.txt', abc);
      objects.set('sub/extra.txt', { // new file, should upload
        Key: 'sub/extra.txt',
        ETag: '"62f9bca5a72ef519c4877c61ac2c8ac7"',
        Size: 112
      });

      const results = maps.compare(files, objects, { skip: true, bucketPathPrefix: '' });
      t.deepEqual(results.deletes, ['sub/extra.txt']);
      t.deepEqual(results.uploads, ['sub/sub/index.html']);
      t.deepEqual(results.noops, ['abc.txt']);
    });
});

test('compareMaps skip=false', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const filePaths = [
    'abc.txt',
    'sub/sub/index.html'
  ];
  return maps.fromFiles(null, cwd, filePaths)
    .then((files) => {
      let objects = new Map();
      const abc = files.get('abc.txt');
      // real ETags from S3 have double-quotes
      abc.ETag = `"${abc.ETag}"`;
      objects.set('abc.txt', abc);
      objects.set('sub/extra.txt', { // new file, should upload
        Key: 'sub/extra.txt',
        ETag: '"62f9bca5a72ef519c4877c61ac2c8ac7"',
        Size: 112
      });

      const results = maps.compare(files, objects, { skip: false, bucketPathPrefix: '' });
      t.deepEqual(results.deletes, ['sub/extra.txt']);
      t.deepEqual(results.noops, []);
      results.uploads.sort(); // need to make tests deterministic
      t.deepEqual(results.uploads, ['abc.txt', 'sub/sub/index.html']);
    });
});

test('compareMaps skip=false and bucketPathPrefix="dev/"', (t) => {
  const cwd = path.join(__dirname, 'fixtures');
  const filePaths = [
    'abc.txt',
    'sub/sub/index.html'
  ];
  return maps.fromFiles(null, cwd, filePaths)
    .then((files) => {
      let objects = new Map();
      const abc = files.get('abc.txt');
      // real ETags from S3 have double-quotes
      abc.ETag = `"${abc.ETag}"`;
      objects.set('dev/abc.txt', abc);
      objects.set('dev/sub/extra.txt', { // new file, should upload
        Key: 'dev/sub/extra.txt',
        ETag: '"62f9bca5a72ef519c4877c61ac2c8ac7"',
        Size: 112
      });

      const results = maps.compare(files, objects, { skip: false, bucketPathPrefix: 'dev/' });
      t.deepEqual(results.deletes, ['sub/extra.txt']);
      t.deepEqual(results.noops, []);
      results.uploads.sort(); // need to make tests deterministic
      t.deepEqual(results.uploads, ['abc.txt', 'sub/sub/index.html']);
    });
});
