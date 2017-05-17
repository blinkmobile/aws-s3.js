/* @flow */
'use strict';

function getFileFromKey (
  bucketPathPrefix /* : string */,
  key /* : string */
) {
  let file = key;
  if (bucketPathPrefix) {
    // bucketPathPrefix.length - 1 as it will end '/'
    file = file.substr(bucketPathPrefix.length);
  }
  return file;
}

function validate (
  bucketPathPrefix /* : string | void */
) /* : string */ {
  if (!bucketPathPrefix) {
    return '';
  }

  // prefix should have a slack at the end or be an empty string.
  if (!bucketPathPrefix.endsWith('/')) {
    bucketPathPrefix += '/';
  }

  // If str starts with a slash, remove it and start validation again.
  if (bucketPathPrefix.startsWith('/')) {
    return validate(bucketPathPrefix.substr(1));
  }

  return bucketPathPrefix;
}

module.exports = {
  getFileFromKey,
  validate
};
