# Introduction

`useSource` enables React components to safely and efficiently use a mutable source, and derive state from it.

```tsx
import { useSource } from 'use-mutable-source';
```

## Define the source

You can define an `init` function that generates a source and returns a tuple containing it. `useSource` will take care of generating it when the component mounts.

```tsx
const [useSnapshot, getSource] = useSource(
  // Defines the source.
  () => [new Source()]
);
```

If the source lifecycle depends on some variables, you may pass the `dependency list` as a second parameter. The source will be recreated every time a dependency changes.

```tsx
const [useSnapshot, getSource] = useSource(
  // Defines the source.
  () => [new Source(dep1, dep2)],
  // Defines the dependency list.
  [dep1, dep2]
);
```

It is possible to provide a `destroy` function inside the initialization tuple, that will be called when the source lifecycle ends. For your convenience the source is passed to the destroy function.

```tsx
const [useSnapshot, getSource] = useSource(() => [
  // Defines the source.
  new Source(),
  // Defines the destroy function.
  (source) => source.destroy(),
]);
```

## Derive a snapshot

React strictly [forbid](introduction.md#use-react-responsibly-⚛%EF%B8%8F) to read a mutable object on render, but you can safely derive some state from it using `useSnapshot`. You can provide a **pure** function that generates the (**Immutable**) snapshot from the source as a first parameter.

```tsx {3}
const snapshot = useSnapshot(
  // Derives a snapshot.
  (source) => (source ? getSnapshot(source) : defaultSnapshot),
  // Subscribes to all the events that may change the snapshot.
  // We'll dig into it in the next chapter.
  subscribeToChanges
);
```

Note that the source is null during the first render, and you have to provide a `defaultSnapshot` for the snapshot derivation.

::: tip Why this? 🤨
Can't we just generate the sources and read from it?

**Nope**, that's not possible. Since the initialization of the source have side-effects, React strictly [forbid](introduction.md#use-react-responsibly-⚛%EF%B8%8F) to initialize it on render.
:::

The initialization of the source should be deterministic, and it should be trivial to derive the initial value of a snapshot. Let's see an example:

```tsx {9-11}
function useAnimation({ autoplay }) {
  const [useSnapshot, getAnimation] = useSource(() => [
    // "autoplay" defines if the animation should automatically starts after
    // the initialization.
    new Animation({ autoplay }),
  ]);

  const isPlaying = useSnapshot(
    // If the Animation has not yet been created, we can rely on "autoplay"
    // to determine if it will play when the component will mount.
    (animation) => (animation ? animation.isPlaying() : autoplay),
    // Subscribes to "Play"/"Pause" events.
    // We'll dig into it in the next chapter.
    subscribeToChanges
  );

  // Methods that mutate the source, they will trigger the "Play"/"Pause"
  // events to which we have subscribed and the snapshot will be updated.
  const play = () => getAnimation().play();
  const pause = () => getAnimation().pause();
}
```

After each render, `useSnapshot` will [compare](#comparing-snapshots) the new snapshot with the current one, and if they are not the same, it will force a re-render so that the the components always see the latest snapshot.

::: info
`use-mutable-source` use [`use-sync-external-storage`](https://github.com/reactwg/react-18/discussions/86) under the hood, so that your can safely use the snapshot.
:::

`getSnapshot` is considered stable by default. If you need it to be dynamic, you may pass the dependency list right after.

```tsx {2-5}
const snapshot = useSnapshot(
  // Derives the snapshot using some variables.
  (source) => (source ? getSnapshot(source, dep1, dep2) : defaultSnapshot),
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

::: warning
If the source have a [`destroy`](#define-the-source) method, the unsubscribe function may be called after the source have been destroyed, and it should be resilient to that.
:::

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
    const snapshot = source ? getSnapshot(source) : defaultSnapshot;
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

## Access the source

You can access the source by using `getSource`. The source cannot be generated on render because of its side-effects, but it has to be available as soon as you need it inside effects or event handlers. To solve this, `getSource` **lazily initialize** the source when it is called for the first time, so it is always available.

```tsx
useEffect(() => {
  // Inside a passive effect.
  const source = getSource();
  source.doSomething();
});
```

```tsx
// Inside an event handler.
<button onCLick={() => getSource().doSomething()} />
```

::: info
Since the initialization have side-effects, `getSource` **cannot** be called on render. This is a **natural consequence** of the React constraints, even if you could have access to the source on render (as in [usePureSource](./use-pure-source.md)), you should **never read it directly** anyway, but derive the state you need with `useSnapshot`.
:::

## Exploit concurrent mode

By default, useSnapshot will use [`use-sync-external-storage`](https://github.com/reactwg/react-18/discussions/86) to manage the subscription. Because there is no guarantee on when and where the snapshots are generated, each update will trigger a synchronous render.

This behavior is safe, but cannot benefit from [`concurrent mode`](https://reactjs.org/blog/2022/03/29/react-v18.html#what-is-concurrent-react). For this reason, we provide a compact API that we call `atomic`.

```tsx
import { useSource } from 'use-mutable-source/atomic';
```

By `constraining` how and where you can derive a snapshot, we are able to exploit concurrent mode. We expect this to fit many use cases and we recommend using it whenever possible.

```tsx
// Instead of useSnapshot we directly have the unique snapshot.
const [snapshot, getSource] = useSource(
  // Defines the source.
  () => [new Source()],
  // Derives a snapshot.
  (source) => (source ? getSnapshot(source) : defaultSnapshot),
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
import { useSource } from 'use-mutable-source/with-contract';
```

The main difference is that we "lifted up" the subscription definition to `useSource`. In this way, since we control the source lifecycle, we are able to subscribe right after the source is generated, and remove the timing problem.

```tsx {5-10}
const [useSnapshot, getSource] = useSource(
  // Defines the source.
  () => [new Source()],
  // Defines the contract.
  (source, onChange) => {
    // Subscribes to the events based on some dependencies.
    subscribe(source, onChange);
    // Returns a callback to unsubscribe.
    return () => unsubscribe(source, onChange);
  }
);
```

`useSnapshot` will rely on that contract to listen for change events, no subscription has to be provided.

```tsx
const snapshot = useSnapshot(
  // Derives a snapshot.
  (source) => (source ? getSnapshot(source) : defaultSnapshot)
);
```

Again, all functions are considered stable by default. Unlike before, the `contract` **Cannot** be dynamic (and its dependency lists cannot be defined) and is shared by all `snapshots`.

::: info
Those are the tradeoffs to achieve the best performance and dx that `use-mutable-source` can provide. The constraints are quite restrictive, but they should cover most use cases.
In future we may extend the contracts concept to be more flexible.
:::

### Contracts and concurrent mode

Lastly, we also provide the `atomic` equivalent.

```tsx
import { useSource } from 'use-mutable-source/with-contract/atomic';
```

Note that the contract comes **before** getSnapshot.

```tsx
// Instead of useSnapshot we directly have the unique snapshot.
const [snapshot, getSource] = useSource(
  // Defines the source.
  () => [new Source()],
  // Subscribes to changes and returns the unsubscribe function.
  (source, onChange) => subscribe(source, onChange),
  // Derives a snapshot.
  (source) => (source ? getSnapshot(source) : defaultSnapshot)
);
```

Again, all functions are considered stable by default and none can be dynamic (their dependency lists cannot be defined).

## Examples

Check some of the [examples](../examples/gsap).
