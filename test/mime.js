'use strict';

const path = require('path');

const test = require('ava');

const mimeType = require('../lib/utils/mime').mimeType;

const projectFiles = {
  '.gitignore': 'application/octet-stream',
  'CHANGELOG.md': 'text/x-markdown'
};

Object.keys(projectFiles).forEach((projectFile) => {
  const expected = projectFiles[projectFile];

  test(projectFile, (t) => {
    return mimeType(path.join(__dirname, '..', projectFile))
      .then((mime) => {
        t.is(mime, expected);
      });
  });
});

test('missing.txt', (t) => {
  return mimeType(path.join(__dirname, '..', 'missing.txt'))
    .then(() => t.fail('should not resolve'))
    .catch((err) => t.truthy(err));
});
