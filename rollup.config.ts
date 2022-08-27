import { type RollupOptions } from 'rollup';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import pkg from './package.json';

const banner = `/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.homepage}
 * Copyright (c) 2022-present, ${pkg.author.name}
 * https://github.com/paol-imi/${pkg.name}/blob/main/LICENSE
 * @license MIT
 */
`;

export default {
  input: './src/index.ts',
  output: [
    { file: './dist/index.js', format: 'cjs', banner },
    { file: './dist/index.esm.js', format: 'esm', banner },
  ],
  external: ['react', 'use-sync-external-store/shim'],
  plugins: [
    replace({
      __DEV__: "process.env.NODE_ENV !== 'production'",
      preventAssignment: true,
    }),
    esbuild(),
  ],
} as RollupOptions;
