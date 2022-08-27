import { useEffect } from 'react';
import {
  useSource,
  usePureSource,
} from '../../src/withContract/useAtomicSource';
import {
  useSource as useSourceServer,
  usePureSource as usePureSourceServer,
} from '../../src/withContract/useAtomicSource/server';
import { Source } from '../utils/source';
import { act, create } from '../utils/renderer';
import { getValues, yieldValue } from '../utils/values';
import { warning } from '../utils/warning';

describe('how useSource works', () => {
  // Update callback.
  let update: (value: number) => void;
  // Test component.
  function App({
    initialValue = 0,
    initialSnapshot = 0,
    getSnapshotOffset = 0,
  }) {
    const [value, getSource] = useSource(
      () => {
        // Generate the source.
        const source = new Source(initialValue);
        // Define the update function.
        update = (value) => source.setValue(value);
        // Yield initialization value.
        yieldValue(`init`, `source(${source.getValue()})`);
        // Return the source.
        return [
          source,
          // Yield destroy value.
          () => yieldValue(`destroy`, `source(${source.getValue()})`),
        ];
      },
      (source, onChange) => {
        // Yield subscribe value.
        yieldValue(`subscribe`, `source(${source.getValue()})`);
        const unsubscribe = source.addChangeListener(onChange);

        return () => {
          // Yield unsubscribe value.
          yieldValue(`unsubscribe`, `source(${source.getValue()})`);
          unsubscribe();
        };
      },
      (source) =>
        (source ? source.getValue() : initialSnapshot) + getSnapshotOffset
    );

    // Yield render value.
    yieldValue(`render`, `snapshot(${value})`);

    useEffect(() => {
      // Lazily generate the source.
      const source = getSource();
      // Value = 2 triggers a new update with value = 3.
      if (value === 2) {
        source.setValue(3);
      }

      // Yield effect values.
      yieldValue(`effect`, `source(${source.getValue()}) snapshot(${value})`);
    });

    return null;
  }

  it('creates a source exactly once', () => {
    const root = create({ strictMode: true });

    // Mounts the App with no dependencies.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render:      snapshot(0)',
      'render:      snapshot(0)',
      // First lifecycle.
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
      'unsubscribe: source(0)',
      'destroy:     source(0)',
      // Second lifecycle.
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
    ]);

    // Triggers an update.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render: snapshot(0)',
      'render: snapshot(0)',
      'effect: source(0) snapshot(0)',
    ]);
  });

  it('subscribe exactly once', () => {
    const root = create({ strictMode: true });

    // Mounts the App with no dependencies.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render:      snapshot(0)',
      'render:      snapshot(0)',
      // First lifecycle.
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
      'unsubscribe: source(0)',
      'destroy:     source(0)',
      // Second lifecycle.
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
    ]);

    // Triggers an update.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render: snapshot(0)',
      'render: snapshot(0)',
      'effect: source(0) snapshot(0)',
    ]);
  });

  it('getSnapshot is stable', () => {
    const root = create({ strictMode: true });

    // Mounts the App with no dependencies.
    act(() => root.update(<App getSnapshotOffset={0} />));

    expect(getValues()).toEqual([
      'render:      snapshot(0)',
      'render:      snapshot(0)',
      // First lifecycle.
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
      'unsubscribe: source(0)',
      'destroy:     source(0)',
      // Second lifecycle.
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
    ]);

    // Triggers an update.
    act(() => root.update(<App getSnapshotOffset={1} />));

    expect(getValues()).toEqual([
      'render: snapshot(0)',
      'render: snapshot(0)',
      'effect: source(0) snapshot(0)',
    ]);
  });

  it('correctly dispatches snapshot updates', () => {
    const root = create({ strictMode: true });

    // Mount the App.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render:      snapshot(0)',
      'render:      snapshot(0)',
      // First lifecycle.
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
      'unsubscribe: source(0)',
      'destroy:     source(0)',
      // Second lifecycle
      'init:        source(0)',
      'subscribe:   source(0)',
      'effect:      source(0) snapshot(0)',
    ]);

    // Dispatch an update with a new value.
    act(() => update(1));

    expect(getValues()).toEqual([
      'render: snapshot(1)',
      'render: snapshot(1)',
      'effect: source(1) snapshot(1)',
    ]);

    // Dispatch an update with the current value.
    act(() => update(1));

    expect(getValues()).toEqual(['render: snapshot(1)', 'render: snapshot(1)']);

    // Dispatch an update with the current value for the second time.
    act(() => update(1));

    expect(getValues()).toEqual([]);

    // Re-render with no changes.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render: snapshot(1)',
      'render: snapshot(1)',
      'effect: source(1) snapshot(1)',
    ]);

    // Update with the special value 2, The component will trigger a new update
    // with the value 3 inside an effect.
    act(() => update(2));

    expect(getValues()).toEqual([
      'render: snapshot(2)',
      'render: snapshot(2)',
      'effect: source(3) snapshot(2)',
      'render: snapshot(3)',
      'render: snapshot(3)',
      'effect: source(3) snapshot(3)',
    ]);
  });

  it('warns about initial snapshot mismatch', () => {
    const root = create({ strictMode: true });

    // Mounts the App.
    act(() => root.update(<App initialValue={0} initialSnapshot={1} />));

    expect(warning).toHaveBeenLastCalledWith(
      `The initial snapshot (derived when the source was not yet ` +
        `created) is different from the snapshot derived from the ` +
        `source. This will force a new render and may hurt performance.\n` +
        `Initial snapshot: ${1}\n ` +
        `Actual snapshot: ${0}`
    );
  });

  it('warns about getSource being called on render', () => {
    const App = () => {
      const [, getSource] = useSource(
        () => [null],
        () => void 0,
        () => null
      );
      return getSource();
    };

    const root = create({ strictMode: true });

    // Mount the App.
    act(() => root.update(<App />));
    // Re-render without changes.
    act(() => root.update(<App />));

    expect(warning).toHaveBeenLastCalledWith(
      `It looks like you are attempting to read a source during render. ` +
        `Since the source would be lazily instantiated, causing ` +
        `side-effects, it cannot be used on render.\n` +
        `If the initialization of the source is side-effects free ` +
        `please use "usePureSource" instead.`
    );
  });

  it('acts correctly during ssr', () => {
    const App = () => {
      const [snapshot] = useSourceServer(
        () => {
          // Yield initialization value.
          yieldValue(`never`, `this is never called`);
          return [null];
        },
        () => void 0,
        () => null
      );

      yieldValue(`render`, `snapshot(${snapshot})`);
      return null;
    };

    const root = create();
    // Mounts the App.
    act(() => root.update(<App />));

    expect(getValues()).toEqual(['render: snapshot(null)']);
  });
});

describe('how usePureSource works', () => {
  // Update callback.
  let update: (value: number) => void;
  // App component.
  function App({ initialValue = 0, getSnapshotOffset = 0 }) {
    const [value, source] = usePureSource(
      () => {
        // Generate the source.
        const source = new Source(initialValue);
        // Define the update function.
        update = (value) => source.setValue(value);
        // Yield the initialization value.
        yieldValue(`init`, `source(${source.getValue()})`);
        // Return the source.
        return source;
      },
      (source, onChange) => {
        // Yield subscribe value.
        yieldValue(`subscribe`, `source(${source.getValue()})`);
        source.addChangeListener(onChange);
      },
      (source) => source.getValue() + getSnapshotOffset
    );

    // Yield render value.
    yieldValue(`render`, `snapshot(${value})`);

    useEffect(() => {
      // Value 2 triggers a new update with value 3.
      if (value === 2) {
        source.setValue(3);
      }

      // Yield effect values.
      yieldValue(`effect`, `source(${source.getValue()}) snapshot(${value})`);
    });

    return null;
  }

  it('creates a source exactly once', () => {
    const root = create({ strictMode: true });

    // Mounts the App with no dependencies.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      // First lifecycle.
      'effect:    source(0) snapshot(0)',
      // Second lifecycle.
      'effect:    source(0) snapshot(0)',
    ]);

    // Triggers an update.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render: snapshot(0)',
      'render: snapshot(0)',
      'effect: source(0) snapshot(0)',
    ]);
  });

  it('subscribe exactly once', () => {
    const root = create({ strictMode: true });

    // Mounts the App with no dependencies.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      // First lifecycle.
      'effect:    source(0) snapshot(0)',
      // Second lifecycle.
      'effect:    source(0) snapshot(0)',
    ]);

    // Triggers an update.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render: snapshot(0)',
      'render: snapshot(0)',
      'effect: source(0) snapshot(0)',
    ]);
  });

  it('getSnapshot is stable', () => {
    const root = create({ strictMode: true });

    // Mounts the App with no dependencies.
    act(() => root.update(<App getSnapshotOffset={0} />));

    expect(getValues()).toEqual([
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      // First lifecycle.
      'effect:    source(0) snapshot(0)',
      // Second lifecycle.
      'effect:    source(0) snapshot(0)',
    ]);

    // Triggers an update.
    act(() => root.update(<App getSnapshotOffset={1} />));

    expect(getValues()).toEqual([
      'render: snapshot(0)',
      'render: snapshot(0)',
      'effect: source(0) snapshot(0)',
    ]);
  });

  it('correctly dispatches snapshot updates', () => {
    const root = create({ strictMode: true });

    // Mount the App.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      'init:      source(0)',
      'subscribe: source(0)',
      'render:    snapshot(0)',
      // First lifecycle.
      'effect:    source(0) snapshot(0)',
      // Second lifecycle
      'effect:    source(0) snapshot(0)',
    ]);

    // Dispatch an update with a new value.
    act(() => update(1));

    expect(getValues()).toEqual([
      'render: snapshot(1)',
      'render: snapshot(1)',
      'effect: source(1) snapshot(1)',
    ]);

    // Dispatch an update with the current value.
    act(() => update(1));

    expect(getValues()).toEqual(['render: snapshot(1)', 'render: snapshot(1)']);

    // Dispatch an update with the current value for the second time.
    act(() => update(1));

    expect(getValues()).toEqual([]);

    // Re-render with no changes.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'render: snapshot(1)',
      'render: snapshot(1)',
      'effect: source(1) snapshot(1)',
    ]);

    // Update with the special value 2, The component will trigger a new update
    // with the value 3 inside an effect.
    act(() => update(2));

    expect(getValues()).toEqual([
      'render: snapshot(2)',
      'render: snapshot(2)',
      'effect: source(3) snapshot(2)',
      'render: snapshot(3)',
      'render: snapshot(3)',
      'effect: source(3) snapshot(3)',
    ]);
  });

  it('acts correctly during ssr', () => {
    const App = () => {
      const [snapshot] = usePureSourceServer(
        () => {
          // Yield initialization value.
          yieldValue(`init`, `source(null)`);
          return null;
        },
        () => void 0,
        () => null
      );

      yieldValue(`render`, `snapshot(${snapshot})`);
      return null;
    };

    const root = create();
    // Mounts the App.
    act(() => root.update(<App />));

    expect(getValues()).toEqual([
      'init:    source(null)',
      'render:  snapshot(null)',
    ]);
  });
});
