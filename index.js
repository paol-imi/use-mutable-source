/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const {
  useSourceWithSubscription: useSource,
  usePureSourceWithSubscription: usePureSource,
  shallowEqual,
} = require('./dist/index');

module.exports = { useSource, usePureSource, shallowEqual };
