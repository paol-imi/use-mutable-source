# WIP

This page is a work in progress.

## withContract

```tsx
import { withContract } from 'use-mutable-source/with-contract';
```

```tsx
const [useSnapshot, source] = withContract(
  new Source(),
  (source, onChange) => void source.subscribe(onChange)
);
```

## useFactory

```tsx
import { useFactory } from 'use-mutable-source';
```
