import * as module from '../src';

it('correctly define the exports', () => {
  expect(module.useFactory).toBeDefined();
  expect(module.usePureFactory).toBeDefined();
  expect(module.shallowEqual).toBeDefined();

  expect(module.usePureSourceWithContract).toBeDefined();
  expect(module.usePureSourceWithContractClient).toBeDefined();
  expect(module.usePureSourceWithContractServer).toBeDefined();
  expect(module.usePureSourceWithSubscription).toBeDefined();
  expect(module.usePureSourceWithSubscriptionClient).toBeDefined();
  expect(module.usePureSourceWithSubscriptionServer).toBeDefined();
  expect(module.useSourceWithContract).toBeDefined();
  expect(module.useSourceWithContractClient).toBeDefined();
  expect(module.useSourceWithContractServer).toBeDefined();
  expect(module.useSourceWithSubscription).toBeDefined();
  expect(module.useSourceWithSubscriptionClient).toBeDefined();
  expect(module.useSourceWithSubscriptionServer).toBeDefined();
  expect(module.withContract).toBeDefined();
  expect(module.withContractClient).toBeDefined();
  expect(module.withContractServer).toBeDefined();

  expect(module.useAtomicPureSourceWithContract).toBeDefined();
  expect(module.useAtomicPureSourceWithContractClient).toBeDefined();
  expect(module.useAtomicPureSourceWithContractServer).toBeDefined();
  expect(module.useAtomicPureSourceWithSubscription).toBeDefined();
  expect(module.useAtomicPureSourceWithSubscriptionClient).toBeDefined();
  expect(module.useAtomicPureSourceWithSubscriptionServer).toBeDefined();
  expect(module.useAtomicSourceWithContract).toBeDefined();
  expect(module.useAtomicSourceWithContractClient).toBeDefined();
  expect(module.useAtomicSourceWithContractServer).toBeDefined();
  expect(module.useAtomicSourceWithSubscription).toBeDefined();
  expect(module.useAtomicSourceWithSubscriptionClient).toBeDefined();
  expect(module.useAtomicSourceWithSubscriptionServer).toBeDefined();
});
