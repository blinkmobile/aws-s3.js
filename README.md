# blinkmobile/aws-s3 [![npm module](https://img.shields.io/npm/v/@blinkmobile/aws-s3.svg)](https://www.npmjs.com/package/@blinkmobile/aws-s3) [![Build Status](https://travis-ci.org/blinkmobile/aws-s3.js.svg?branch=master)](https://travis-ci.org/blinkmobile/aws-s3.js) [![Greenkeeper badge](https://badges.greenkeeper.io/blinkmobile/aws-s3.js.svg)](https://greenkeeper.io/)

our simplified wrapper for common AWS S3 operations

## Getting Started

```sh
npm install @blinkmobile/aws-s3 aws-sdk
```

```js
const upload = require('@blinkmobile/aws-s3').upload;
const AWS = require('aws-sdk');
```


## Requirements

AWS SDK for Javascript, version >= v2.3.9


## Usage

```js
const task = upload({
  // common options
  cwd: '', // current working directory to search, defaults to `process.cwd()`
  prune: false, // true => delete S3 Objects that don't match local files
  s3: new AWS.S3({ /* ... */ }),

  // advanced options
  dryRun: false, // true bypasses write calls with simulated success events
  filePaths: [''], // paths relative to rootPath, defaults to glob(['**/*'])
  fs: null // defaults to `require('fs')`
});

const EventEmitter = require('events');
console.assert(task instanceof EventEmitter);
console.assert(task.promise instanceof Promise);
```


### .blinkmignore

We ignore certain files and directories [by default](https://github.com/novemberborn/ignore-by-default).

The "cwd" directory may also contain a ".blinkmignore" file.
This file is like a [.gitignore](https://git-scm.com/docs/gitignore) file.

This file should contain [globs](https://www.npmjs.com/package/glob#glob-primer),
which we combine with the above defaults for the ["ignore" option for `glob`](https://www.npmjs.com/package/glob#options).

Example:

```
# we ignore comments and empty lines

do-not-upload/**/anything-in-this-directory/**/*
or-this-file.txt
```


## API

```
upload (options: UploadOptions) => Task
```

```
interface Task extends EventEmitter {
  filePaths: String[],
  files: Map,
  objects: Map,
  promise: Promise
}
```

Note: until `task.promise` resolves / rejects, other properties may not be available. `EventEmitter` methods _are_ always available.

```
interface UploadOptions {
  cwd? : String, // defaults to process.cwd()
  dryRun = false: Boolean,
  filePaths?: String[], // defaults to glob(['**/*'])
  fs? : Object, // defaults to require('fs')
  prune = false : Boolean,
  s3: AWS.S3,
  skip = true : Boolean
}
```


### Events

- **skipped**: `fileName`

- **uploading**: `fileName`

- **uploaded**: `fileName`

- **error**: `error`, `fileName`

- **deleting**: `fileName`

- **deleted**: `fileName`

```js
const task = upload({ /* ... */ });
task.on('error', (error, fileName) => {
  // TODO: ...
});
```


## Roadmap

- [ ] "dryRun" option
- [ ] "fs" option
