# Getting started

This library aims to manage the `lifecycle`, `state` derivations and `mutations` of a mutable source. To achieve that we provide 2 main hooks, depending on your use case you can choose one or the other and go through their documentation:

| [`useSource`](./use-source.md)          | <span style="font-weight:lighter">If the source initialization have side-effects, like accessing the DOM or a Ref.</span> |
| --------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| [`usePureSource`](./use-pure-source.md) | If the source initialization have No side-effects.                                                                        |

## Adding to your Project

Don't forget to add `use-mutable-source` to your project!

```sh
# with npm
npm install use-mutable-source
```

```sh
# with yarn
yarn add use-mutable-source
```

```sh
# or with pnpm
pnpm add use-mutable-source
```

## Design philosophy

Once you have read the documentation, if you're curious, you may also read the [Design Principles](./design-principles.md) the hooks are based on. This could help you to have a broader view on the API surface area.
