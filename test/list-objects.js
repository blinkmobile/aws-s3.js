'use strict';

const test = require('ava');

const listObjects = require('../lib/list-objects').listObjects;

test.cb('calls AWS.S3#listObjectsV2()', (t) => {
  const mockS3 = {
    listObjectsV2 (options, callback) {
      callback(null, { Contents: [] });
      t.end();
    }
  };
  listObjects(mockS3);
});

test('AWS.S3#listObjectsV2() has error', (t) => {
  const mockS3 = {
    listObjectsV2 (options, callback) {
      callback(new Error('boom!'));
    }
  };
  return listObjects(mockS3)
    .then(() => t.fail('resolved'))
    .catch((err) => t.truthy(err));
});

test('returns all results from a bucket when the server truncates the result', (t) => {
  let i = 0;
  const mockS3 = {
    listObjectsV2 (options, callback) {
      const results = {Contents: [++i]};
      if (i < 10) {
        results.NextContinuationToken = '1';
      }

      return callback(null, results);
    }
  };
  return listObjects(mockS3).then((results) => {
    t.is(results.length, 10);
    t.deepEqual(results, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

test('fails if the server returns an error', (t) => {
  let i = 0;
  const mockS3 = {
    listObjectsV2 (options, callback) {
      const results = {Contents: [++i]};
      if (i < 10) {
        results.NextContinuationToken = '1';
      }
      if (i === 9) {
        return callback(new Error('blah'));
      }
      return callback(null, results);
    }
  };

  return t.throws(listObjects(mockS3), 'blah');
});
