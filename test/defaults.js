'use strict';

const test = require('ava');

const mergeDefaults = require('../lib/upload').mergeDefaults;

test('mergeDefaults({}) => skip=true', (t) => {
  const options = mergeDefaults({});
  t.is(options.skip, true);
});

test('mergeDefaults({ skip: true }) => skip=true', (t) => {
  const options = mergeDefaults({ skip: true });
  t.is(options.skip, true);
});

test('mergeDefaults({ skip: false }) => skip=false', (t) => {
  const options = mergeDefaults({ skip: false });
  t.is(options.skip, false);
});

test('mergeDefaults({prune: true}) => prune=true', (t) => {
  const options = mergeDefaults({ prune: true });
  t.is(options.prune, true);
});

test('mergeDefaults({prune: false}) => prune=false', (t) => {
  const options = mergeDefaults({ prune: false });
  t.is(options.prune, false);
});
