<div align="center">
  
<br>

<img src="./docs/src/public/logo.png" width="25%" /> <br>

<h1><img src="./docs/src/public/text.svg"></h1>

**Minimal** and **elegant** way to integrate any **library** with [`React`](https://reactjs.org/)

[![types: Typescript](https://img.shields.io/badge/types-Typescript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React: hooks](https://img.shields.io/badge/React-hooks-26C9FF?style=flat-square&logo=react)](http://npm.im/use-mutable-source)
[![Github CI](https://img.shields.io/github/workflow/status/paol-imi/use-mutable-source/Node.js%20CI?style=flat-square)](https://github.com/paol-imi/use-mutable-source/actions/workflows/ci.yml)
[![Codecov](https://img.shields.io/codecov/c/github/paol-imi/use-mutable-source?color=44cc11&logo=codecov&style=flat-square)](https://codecov.io/gh/paol-imi/use-mutable-source)
[![code style: Prettier](https://img.shields.io/badge/code_style-Prettier-ff69b4.svg?style=flat-square&logo=prettier)](https://prettier.io/)
[![npm](https://img.shields.io/npm/v/use-mutable-source.svg?style=flat-square)](http://npm.im/use-mutable-source)

</div>

# Introduction 📖

Imagine that one of your components has some complex interactions, and you have the perfect tool to manage them 😎. It can be anything, from a classic `state machine`, to your favorite `drag and drop` library. These tools are not specific to React, and therefore you need to integrate them.

It's easy to ge tricked by the simplicity of `ref.current = something`, but React makes some quite strict assumptions on when and where side-effects are allowed, so that it can provides amazing features like [**concurrent mode**](https://reactjs.org/blog/2022/03/29/react-v18.html#what-is-concurrent-react) and [**fast refresh**](https://www.npmjs.com/package/react-refresh) ⚛️.

Have you ever read or written `ref.current` during render? well, if yes, your app is likely to have bugs 🐞 and [**tearing**](https://github.com/reactwg/react-18/discussions/69) effects. And this is just the first of the pitfalls you might fall into.

This is where `use-mutable-source` comes in, so that you can safely manage the state of your React app with your favorite tools in a **minimal** and **elegant** way, without worrying to break the app in production!

## Documentation 📘

You can find the full documentation [**here**](https://paol-imi.github.io/use-mutable-source).

## Use React responsibly ⚛️

When you don't rely on `useState`, React has some quite strict constraints to keep in mind.

> "Don’t mutate during render is probably the oldest constraint of React, render has to be `pure` and refs cannot be read or written during this process. Effects with cleanups should have "symmetry" to avoid the risk of using a stale state..."

Most of these constraints have always existed, but now, with [**React 18**](https://reactjs.org/blog/2022/03/29/react-v18.html) and the new [**\<StrictMode\>**](https://github.com/reactwg/react-18/discussions/18) behavior, problems arise almost immediately if they are not met.

`use-mutable-source` is designed to seem like a primitive and to hide this complexity, ensuring that the implementation is always correct.

## Don't reinvent the wheel 🍀

Don't waste mental energy on a React porting of you're new library. `use-mutable-source` can make your implementation **minimal**, **elegant** and **concurrent safe**. Even the bundle size is minimal, it can shrink down to `600 bytes`! (with tree-shaking and zipping, depending on use cases)

## Dust off your favorite library 🎁

Do you remember your favorite DOM library that you can no more use because it has no React porting? Or the one that has not been updated for years and is broken with React 18? `use-mutable-source` takes the porting to another level of simplicity!

Check out some of the [**examples**](https://paol-imi.github.io/use-mutable-source/examples/gsap.html).

## When to use it? ✅

If you want to model some local state with a mutable object, this may be the right tool for you. This also fits very well if you are developing a multi-framework library, so the shared core doesn't have to rely on React primitives.

## When Not to use it? ❌

If you want to model some global state, that lives outside of your components, this may Not be the right tool. There are already a lot of great libraries for this use case, my favorites are definitely [zustand](https://github.com/pmndrs/zustand) and [jotai](https://github.com/pmndrs/jotai)!

## License ©

Copyright © 2022 [**Paolo Longo**](https://github.com/paol-imi) • [**MIT license**](LICENSE).
