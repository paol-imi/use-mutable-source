/**
 * Object.is polyfill taken from https://github.com/facebook/react/blob/main/packages/shared/objectIs.js
 *
 * @param x - first value to compare
 * @param y - second value to compare
 * @returns A Boolean indicating whether or not the two value are the same
 */
export function is(x: any, y: any) {
  return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
}
