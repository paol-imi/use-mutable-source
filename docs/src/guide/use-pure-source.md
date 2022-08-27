# Introduction

`usePureSource` enables React components to safely and efficiently use a mutable `Pure` source, and derive state from it. A source is considered `Pure` if its initialization is side-effects free and doesn't require access to the DOM or to a Ref.

```tsx
import { usePureSource } from 'use-mutable-source';
```

## Define the source

You can define an `init` function that generates a Pure source. `usePureSource` will take care of generating it when the component renders.

```tsx
const [useSnapshot, source] = usePureSource(
  // Defines the source.
  () => new Source()
);
```

If the source lifecycle depends on some variables, you may pass the `dependency list` as a second parameter. The source will be recreated every time a dependency changes.

```tsx
const [useSnapshot, source] = usePureSource(
  // Defines the source.
  () => new Source(dep1, dep2),
  // Defines the dependency list.
  [dep1, dep2]
);
```

## Derive a snapshot

React strictly [forbid](introduction.md#use-react-responsibly-⚛%EF%B8%8F) to read a mutable object on render, but you can safely derive some state from it using `useSnapshot`. You can provide a **pure** function that generates the (**Immutable**) snapshot from the source as a first parameter.

```tsx {3}
const snapshot = useSnapshot(
  // Derives a snapshot.
  (source) => getSnapshot(source),
  // Subscribes to all the events that may change the snapshot.
  // We'll dig into it in the next chapter.
  subscribeToChanges
);
```

After each render, `useSnapshot` will [compare](#comparing-snapshots) the new snapshot with the current one, and if they are not the same, it will force a re-render so that the the components always see the latest snapshot.

::: info
`use-mutable-source` use [`use-sync-external-storage`](https://github.com/reactwg/react-18/discussions/86) under the hood, so that your can safely use the snapshot.
:::

`getSnapshot` is considered stable by default. If you need it to be dynamic, you may pass the dependency list right after.

```tsx {2-5}
const snapshot = useSnapshot(
  // Derives the snapshot using some variables.
  (source) => getSnapshot(source, dep1, dep2),
  // Defines the "getSnapshot" dependency list.
  [dep1, dep2],
  // Subscribes to changes.
  subscribe
);
```

## Subscribe to changes

To make the snapshot always up to date, you have to provide a `subscribe` function as a second parameter. The function has to subscribe to all the events that may change the snapshot, using the `onChange` callback, and has to return an unsubscribe function.

```tsx {4-9}
const snapshot = useSnapshot(
  getSnapshot,
  // Defines the subscription.
  (source, onChange) => {
    // Subscribes to the events that will change the snapshot.
    subscribe(source, onChange);
    // Returns a callback to unsubscribe.
    return () => unsubscribe(source, onChange);
  }
);
```

`subscribe` is considered stable by default. If you need it to be dynamic, you may pass the dependency list right after. `useSnapshot` will resubscribe each time a dependency changes.

```tsx {4-11}
const snapshot = useSnapshot(
  getSnapshot,
  // Defines the subscription.
  (source, onChange) => {
    // Subscribes to the events based on some dependencies.
    subscribe(source, onChange, dep1, dep2);
    // Returns a callback to unsubscribe.
    return () => unsubscribe(source, onChange, dep1, dpe2);
  },
  // Defines the "subscription" dependency list.
  [dep1, dep2]
);
```

## Comparing snapshots

When the immutable snapshot is an `object`, since it is derived from a mutable source, `useSnapshot` cannot rely on reference equality to determine if it has changed.

In these cases, it is necessary to manually compare the current snapshot with the generated snapshot, and return the current one if they are semantically equal.

A classic example is using a shallow comparison. `use-mutable-source` expose the comparer for your convenience.

```tsx
import { shallowEqual } from 'use-mutable-source';
```

```tsx {5-7}
useSnapshot(
  // Derives a snapshot.
  (source, currentSnapshot) => {
    const snapshot = getSnapshot(source);
    // If the two snapshots are semantically equals, we can return the current
    // one to bailout from the update.
    return shallowEqual(currentSnapshot, snapshot) ? currentSnapshot : snapshot;
  },
  subscribe
);
```

Since `useSnapshot` will try to re-render each time the snapshot changes, if it is unable to determine that two snapshot are equal it may cause an infinite render loop. Check the next [chapter](#contracts-avoid-comparing-snapshots) to see how to avoid equality comparisons.

::: info
There is currently a limitation with **typescript** when you access `currentSnapshot`, and it is unable to infer the snapshot type. In those cases you should manually provide the snapshot type `useSnapshot<SnapshotType>()`.
:::

## Exploit concurrent mode

By default, useSnapshot will use [`use-sync-external-storage`](https://github.com/reactwg/react-18/discussions/86) to manage the subscription. Because there is no guarantee on when and where the snapshots are generated, each update will trigger a synchronous render.

This behavior is safe, but cannot benefit from [`concurrent mode`](https://reactjs.org/blog/2022/03/29/react-v18.html#what-is-concurrent-react). For this reason, we provide a compact API that we call `atomic`.

```tsx
import { usePureSource } from 'use-mutable-source/atomic';
```

By `constraining` how and where you can derive a snapshot, we are able to exploit concurrent mode. We expect this to fit many use cases and we recommend using it whenever possible.

```tsx
// Instead of useSnapshot we directly have the unique snapshot.
const [snapshot, source] = usePureSource(
  // Defines the source.
  () => new Source(),
  // Derives a snapshot.
  (source) => getSnapshot(source),
  // Subscribes to changes and returns the unsubscribe function.
  (source, onChange) => subscribe(source, onChange)
);
```

Again, all functions are considered stable by default. Unlike before, `getSnapshot` and `init` **Cannot** be dynamic (and their dependency lists cannot be defined). This is the tradeoff to achieve better performance.

::: tip
If you are not sure that a function can be dynamic, just put the dependency list right after it and `typescript` will show an error if it cannot be done.
:::

## Contracts <small>(_avoid comparing snapshots_)</small>

You may be wondering why we need an equality comparison to determine if a snapshot has changed, when useSnapshot actually `subscribes` to change events.

This is necessary due to the order in which side effects are performed. A child component may make changes to the source before `useSnapshot` can actually subscribe.

To solve this we introduce a slightly different concept from subscriptions, that we call `contracts`.

```tsx
import { usePureSource } from 'use-mutable-source/with-contract';
```

A `contract` is a function that register a callback to change events and doesn't perform any (other) side effect (it is `Pure` in a sense). Since it is side-effect free, it doesn't accept any unsubscribe callback in return.

By passing the contract directly to useSource, we are able to subscribe right after the source is generated, and remove the timing problem.

```tsx {4-5}
const [useSnapshot, source] = usePureSource(
  // Defines the source.
  () => new Source(),
  // Defines the contract.
  (source, onChange) => void subscribe(source, onChange)
);
```

`useSnapshot` will rely on that contract to listen for change events, no subscription has to be provided.

```tsx
// Derives a snapshot.
const snapshot = useSnapshot((source) => getSnapshot(source));
```

Again, all functions are considered stable by default. Unlike before, the `contract` **Cannot** be dynamic (and its dependency lists cannot be defined) and is shared by all `snapshots`.

Also note that since there is no clean-up phase, you **Must** ensure that the source is `garbage collectable` even after the contract has registered the callback.

::: info
Those are the tradeoffs to achieve the best performance and dx that `use-mutable-source` can provide. The constraints are quite restrictive, but they should cover most use cases.
In future we may extend the contracts concept to be more flexible.
:::

### Contracts and concurrent mode

Lastly, we also provide the `atomic` equivalent.

```tsx
import { usePureSource } from 'use-mutable-source/with-contract/atomic';
```

Note that the contract comes **before** getSnapshot.

```tsx
// Instead of useSnapshot we directly have the unique snapshot.
const [snapshot, source] = usePureSource(
  // Defines the source.
  () => new Source(),
  // Defines the contract.
  (source, onChange) => void subscribe(source, onChange),
  // Derives a snapshot.
  (source) => getSnapshot(source)
);
```

Again, all functions are considered stable by default and none can be dynamic (their dependency lists cannot be defined).

## Examples

Check some of the [examples](../examples/use-media-query).
