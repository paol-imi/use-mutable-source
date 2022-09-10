/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const {
  useAtomicSourceWithSubscription: useSource,
  useAtomicPureSourceWithSubscription: usePureSource,
  shallowEqual,
  useFactory,
  usePureFactory,
} = require('../dist/index');

module.exports = {
  useSource,
  usePureSource,
  shallowEqual,
  useFactory,
  usePureFactory,
};
