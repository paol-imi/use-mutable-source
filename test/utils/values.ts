let values = [] as [string, string][];

/**
 * yield a value with a tag.
 *
 * @param tag - the tag
 * @param value - the value
 */
export function yieldValue(tag: string, value: string) {
  values.push([tag, value]);
}

/**
 * Returns the previous yielded values and clean the history. The values are
 * formatted and tabbed.
 *
 * @returns the formatted values
 */
export function getValues() {
  // Maximum length of a tab.
  const maxTagLength = values.reduce(
    (prev, [tag]) => (prev > tag.length ? prev : tag.length),
    0
  );

  // Boolean representing if all tabs have the same length.
  const allTagsHaveSameLength = values.every(
    ([tag]) => tag.length === maxTagLength
  );

  // If some tags have different lengths, add a tab (assuming that the string is
  // inlined and starts with an apex).
  const tagOffset =
    maxTagLength + (allTagsHaveSameLength ? 0 : 1 - (maxTagLength % 2));

  // Formats the values.
  const formattedValues = values.map(([tag, value]) =>
    (tag + ': ').padEnd(tagOffset + 2).concat(value)
  );

  // Cleans up the history.
  values = [];

  // Returns the formatted values.
  return formattedValues;
}

afterEach(() => {
  // Cleans up the history.
  values = [];
});
