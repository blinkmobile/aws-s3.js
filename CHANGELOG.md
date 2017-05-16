# Change Log


## Unreleased

### Fixed

-   CC-22: process not finishing without calling process.exit()


## 2.1.0 - 2016-10-31


### Added

- CC-17: `upload()` ignores files per ".blinkmignore"


## 2.0.0 - 2016-06-08


### Changed

- CC-16: AWS SDK for Javascript v2.3.9 or above is required


### Added

- CC-16: "prune" option now removes files from the s3 bucket that are not on the local file system
- CC-16 "deleting" and "deleted" events
- CC-16: listObjects now supports s3 buckets with > 1000 objects


## 1.2.0 - 2016-04-04


### Added

- CC-11: "skip" option, default to `true`, bypass content that seems to match remote already (#1, @jokeyrhyme)


### Fixed

- CC-11: detect MIME type locally, and submit as "ContentType" option during upload (#1, @jokeyrhyme)


## 1.1.1 - 2016-03-04


### Fixed

- fix equality tests when comparing MD5 hashes

- drop ContentMD5 HTTP header for now (requires Base64, not hexadecimal)

    - consumer should use "computeChecksums" option for `new AWS.S3()`: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property


## 1.1.0 - 2016-03-03


### Added

- new "skipped" event emitted for files that are not changed


### Fixed

- pass unquoted local MD5 as ContentMD5 HTTP header

- wrap local MD5s once during comparison, instead of extra unwrap


## 1.0.1 - 2016-03-03


### Changed

- send ContentMD5 HTTP header during upload


### Fixed

- calculate MD5 instead of SHA1 (oops)

- fix `Promise`-ification of `AWS.S3#upload()`

- wrap local MD5s in quotes like real ETags

    - with other fixes, change-detection works to skip unchanged files
