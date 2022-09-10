# Design principles

> _Exploring the design choices is not mandatory in order to use this library but it is certainly useful for better understanding the API_

This library aims to manage the `lifecycle`, `state` derivations and `mutations` of a mutable source. The **hooks** we provide accept 3 main functions that represent these concepts:

- `init()` defines how the source is generated.
- `getSnapshot()` defines how the state is derived from the source.
- `subscribe()` defines how to subscribe to mutation events.

## Implicit Memoization

The hooks are designed to seem like primitives and they trait memoization as **implicit**. This means that, instead of defining the functions inside `useCallback`:

```tsx {-5}
const init = useCallback(
  // Init function.
  () => new Source(dep1, dep2),
  // Dependency list.
  [dep1, dep2]
);

usePureSource(init);
```

You can inline them inside the hooks and directly provide the `dependency list`.

```tsx {4-5}
usePureSource(
  // Init function.
  () => new Source(dep1, dep2),
  // Dependency list.
  [dep1, dep2]
);
```

If an hook accepts more functions, you can provide the `dependency list` for each of them right after their definition.

```tsx {4-5,8-9}
useSnapshot(
  // getSnapshot function.
  (source) => getSnapshot(source, dep3, dep4),
  // getSnapshot dependency list.
  [dep3, dep4],
  // subscribe function.
  (source, onChange) => subscribe(source, onChange, dep5, dep6),
  // subscribe dependency list.
  [dep5, dep6]
);
```

And obviously you can omit all or just some of the dependency lists.

```tsx
useSnapshot(
  // getSnapshot function.
  (source) => getSnapshot(source),
  // subscribe function.
  (source, onChange) => subscribe(source, onChange)
);
```

The main advantage of this choice is that you can avoid relying on `useMemo` or `useCallback` for **Semantic Guarantees**.

Also, you can inline these functions directly inside the hook without losing **locality** and without compromising **code readability**.

Unfortunately we lose the **linting** part on the dependencies, but in practice, since we are working with mutable objects, you often need to use some values that are **Not dependencies** (_like initialization options_). Most of the linting would just be disabled anyway.

```tsx {3-5}
useCallback(
  () => new Source(options),
  // Since we would use "options" only on initialization, we omit it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []
);
```

## Stability by default

The memoization has a different default from the primitive hooks. If no dependencies are specified, the function is treated as `stable`. This means that these syntaxes are equivalent:

```tsx
// Empty dependency list.
usePureSource(() => new Source(), []);
```

```tsx
// Without a dependency list.
usePureSource(() => new Source());
```

There are two main reason for this choice. The first is that, in practice, you never want an **always-unstable** function. Creating a new Source on each render is just not useful.

The second and main reason is that sometimes we must constraint a function to be always stable (_see next [chapter](#polymorphism)_). With stability by default, we can just Not accept its `dependency` `list`, and the constraint becomes a **consequence** of the implementation.

This have a **Huge** difference from introducing a new API to express this constraint. You Don't have to **learn** and **remember** new concepts based on the hook you're using, you just have to learn the general rule. The API surface is smaller and **coherent**.

::: tip
If you are not sure that a function can be dynamic, just put the dependency list right after it and `typescript` will show an error if it cannot be done.
:::

If for any reason (_like testing_), you need the usual behavior you can just pass an always-unstable value.

```tsx
usePureSource(
  () => new Source(),
  // "{}" will result in a different dependency each time.
  [{}]
);
```

## Polymorphism

The last and main design principle is that by `constraining` how and where each of the 3 main [functions](#design-principles) can be defined, we can provide better guarantees.

Each function have 2 different versions, one **with** constraints and one **without**, and you can choose between <code>2<sup>3</sup> = 8</code> different combinations to get the best set of `tradeoffs` for your use case.

### `Init`

By default `init` is allowed to perform any side-effect to initialize the source. This has the drawback of not being able to access the source during the first render, and we must provide initial values to derive the snapshots.

```tsx
import { useSource } from 'use-mutable-source';
```

```tsx
// ✅ init can have side-effects.
const [useSnapshot, getSource] = useSource(init);

const snapshot = useSnapshot(
  // ⚠️ Note that the source is null during the first render.
  // ⚠️ We need to provide an initial snapshot.
  (source) => (source === null ? getSnapshot(source) : initialSnapshot)
);

// ❌ We can't access the source on render, this is a side-effect!
const source = getSource();
```

You can express the fact that you don't perform side effects inside `init` by using the following hook.

```tsx
import { usePureSource } from 'use-mutable-source';
```

```tsx
// ⚠️ init cannot have side-effects.
// ✅ The source is always available.
const [useSnapshot, source] = usePureSource(init);

const snapshot = useSnapshot(
  // ✅ We can always access the source to derive the snapshot.
  (source) => getSnapshot(source)
);
```

In this way you can avoid the previous drawbacks. As you can see the API are almost the same, but the behavior is very different!

### `getSnapshot`

By default `getSnapshot` and is defined locally to `useSnapshot`. Because there is no guarantee on when and where the snapshots are generated, each update will trigger a synchronous render. This has the drawback that it cannot benefit from [`concurrent mode`](https://reactjs.org/blog/2022/03/29/react-v18.html#what-is-concurrent-react).

```tsx
import { usePureSource } from 'use-mutable-source';
```

```tsx
const [useSnapshot] = usePureSource(init);

// ⚠️ we cannot exploit concurrent mode.
const snapshot = useSnapshot(
  // ✅ getSnapshot is defined locally to useSnapshot.
  (source) => getSnapshot(source),
  subscribe
);
```

To exploit [`concurrent mode`](https://reactjs.org/blog/2022/03/29/react-v18.html#what-is-concurrent-react) you need the snapshot to be unique and not to be dynamic (_does not accept the dependency list_).

```tsx
import { usePureSource } from 'use-mutable-source/atomic';
```

```tsx
// ✅ we can exploit concurrent mode.
const [useSnapshot] = usePureSource(
  init,
  // ⚠️ we can only derive one snapshot.
  // ⚠️ the snapshot cannot be dynamic.
  (source) => getSnapshot(source),
  subscribe
);
```

### `subscribe`

By default `subscribe` is allowed to perform any side-effect and is defined locally to `useSnapshot`. This has the drawback of having to rely on equality comparisons to determine snapshot changes.

This is necessary due to the order in which side effects are performed. A child component may make changes to the source before useSnapshot can actually subscribe.

```tsx
import { usePureSource } from 'use-mutable-source';
```

```tsx
const [useSnapshot] = usePureSource(init);

const [foo, bar] = useSnapshot(
  // ⚠️ Since the snapshot is an object, we must manually check for changes.
  (source, currentSnapshot) => {
    const snapshot = [source.foo, source.bar];

    if (
      // If there is a current snapshot.
      currentSnapshot !== null &&
      // If "foo" and "bar" have not changed.
      snapshot[0] === currentSnapshot[0] &&
      snapshot[1] === currentSnapshot[1]
    ) {
      // ⚠️ We must return the currentSnapshot to avoid an infinite render loop.
      return currentSnapshot;
    }

    return snapshot;
  },
  // ✅ subscribe locally to useSnapshot.
  subscribe
);
```

You can instead subscribe inside `useSource`. Since it controls the lifecycle of the source, it is able to subscribe as soon as the source is generated, and it can rely on change events instead of equality comparisons to determine snapshot changes.

Here the drawbacks are that the subscription is shared among all snapshots, it cannot be dynamic (_does not accept the dependency list_) and in case of Pure sources, it cannot perform any side effects outside of the source.

```tsx
import { usePureSource } from 'use-mutable-source/with-contract';
```

```tsx
const [useSnapshot] = usePureSource(
  init,
  // ⚠️ subscribe must be shared to all snapshots.
  // ⚠️ subscribe cannot be dynamic.
  subscribe
);

const [foo, bar] = useSnapshot(
  // ✅ No need to checks for changes.
  (source) => [source.foo, source.bar]
);
```

### Import helper

Since each function has 2 versions, we can build up to <code>2<sup>3</sup> = 8</code> different hooks! Below you can select the constraints you want to use and obtain the corresponding `import`.

<script setup>
import { ref } from 'vue';

const init = ref(true);
const getSnapshot = ref(true);
const subscribe = ref(true);
</script>

<table style="text-align: center;">
  <tr>
    <td>&nbsp;</td>
    <td><code>init</code></td>
    <td><code>getSnapshot</code></td>
    <td><code>subscribe</code></td>
  </tr>
  <tr>
    <td>Constrains</td>
    <td><input type="checkbox" v-model="init" />
</td>
    <td><input type="checkbox" v-model="getSnapshot" /> </td>
    <td><input type="checkbox" v-model="subscribe" /> </td>
  </tr>
</table>

<div v-if="!init && !getSnapshot && !subscribe">

```tsx
import { useSource } from 'use-mutable-source';
```

</div>

<div v-if="!init && !getSnapshot && subscribe">

```tsx
import { useSource } from 'use-mutable-source/with-contract';
```

</div>

<div v-if="!init && getSnapshot && !subscribe">

```tsx
import { useSource } from 'use-mutable-source/atomic';
```

</div>

<div v-if="!init && getSnapshot && subscribe">

```tsx
import { useSource } from 'use-mutable-source/with-contract/atomic';
```

</div>

<div v-if="init && !getSnapshot && !subscribe">

```tsx
import { usePureSource } from 'use-mutable-source';
```

</div>

<div v-if="init && !getSnapshot && subscribe">

```tsx
import { usePureSource } from 'use-mutable-source/with-contract';
```

</div>

<div v-if="init && getSnapshot && !subscribe">

```tsx
import { usePureSource } from 'use-mutable-source/atomic';
```

</div>

<div v-if="init && getSnapshot && subscribe">

```tsx
import { usePureSource } from 'use-mutable-source/with-contract/atomic';
```

</div>

::: tip
When you need `use-mutable-source`, always start thinking about how your use case can fit with those constraints. The more you can fit, the better!
:::

## Unresolved questions

Below is a list of unresolved questions about some design choices. If you have any opinion about any of them, feel free to open an [`issue`](https://github.com/paol-imi/use-mutable-source/issues) to discuss it!

### Stability by default

Stability is a very handy default, but... It's a new concept to `learn`, and this represents no small `cost` for an hook that aims to be used like a primitive.

The first prototype of `use-mutable-source` was actually enforcing stability by requiring an empty dependency list. Typescript and a bunch of runtime warnings would have let the user notice if some dependencies were used where they weren't allowed.

```tsx
import { usePureSource } from 'use-mutable-source/atomic';
```

```tsx
usePureSource(
  () => new Source(),
  [], // Forced stability with an empty Dependency list.
  (source) => getSnapshot(source),
  [], // Forced stability with an empty Dependency list.
  (source, onChange) => subscribe(source, onChange)
);
```

This approach was later replaced by the current one. Which of the two is better remains an unresolved question for now.

### Pure Contracts and Pure Sources

Currently, we solve the subscription timing problem in Pure Sources by using the contract during render. This requires the contract to be pure and also requires the source to be `garbage collectable` after the contract has been used.

This last requirements should be satisfied most of the time without any additional work, but in general is not an easy thing to reason about.

An alternative could be to subscribe inside `useInsertionEffect`. It would run before `useLayoutEffect` and `useEffect`, and it wouldn't be possible to dispatch state updates inside it, so we would be sure to subscribe before any changes can be performed.

The main problem is that this is Not supported by versions of React prior to 18. Also the React team has discouraged its use outside the scope of css-in-js libraries, but that's something we could explore more.
