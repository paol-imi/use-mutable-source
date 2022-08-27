# Source as dependency

There are cases in which the initialization of a source depends on another source. In this document we are going to explore some of the valid (and invalid) patterns to relate Pure sources and non-Pure sources.

## Between Pure sources

In this example we are using the classic composition to create a Container of an Item. The Container must be defined last.

```tsx {3-5}
const [, item] = usePureSource(() => new Item());
const [, container] = usePureSource(
  // ✅ classic composition, the Item is defined before the Container.
  () => new Container(item),
  [item]
);
```

Note that the opposite is **Not** a valid pattern. If we define the Container earlier, we are not able to insert the Item without a side-effect.

```tsx {5-6}
const [, container] = usePureSource(() => new Container());
// ❌ The only way to insert the Item is with a mutation.
const [, item] = usePureSource(() => {
  const item = new Item();
  // ❌ This is a side-effect!
  container.add(item);
  return item;
}, [container]);
```

Another possible pattern is to create the Items dynamically, and use them inside children components. In this example we use a [`contract`](./use-pure-source.md#contracts-avoid-comparing-snapshots).

```tsx {8-11}
const ListComponent = () => {
  const [useSnapshot, list] = usePureSource(
    () => new List(),
    // Subscribes to the events of adding/removing items.
    onListChange
  );

  // ✅ Derives the children inside useSnapshot.
  const children = useSnapshot(() =>
    list.map((item) => <ItemComponent key={item.id} item={item} />)
  );

  // Dynamically creates the items.
  const addItem = (item) => list.add(item);

  // Rest of the component...
};
```

```tsx {2-3}
const ItemComponent = ({ item }) => {
  // ✅ The List is Not mutated inside the init function.
  const [useSnapshot] = usePureSource(() => item, [item]);
  // Rest of the component...
};
```

## Between Pure and non-Pure sources

In this example we are using the classic composition to create a Container of an Item. The Container must be the non-Pure source and must be defined last.

```tsx {3-5}
const [, item] = usePureSource(() => new Item());
const [, getContainer] = useSource(
  // ✅ classic composition, the Item is defined before the Container.
  () => [new Container(item)],
  [item]
);
```

Note that the opposite is **Not** a valid pattern. If we define the Item as non-Pure and the Container as Pure, we are not able to insert the Item without a side-effect.

```tsx {5-6}
const [, getItem] = useSource(() => [new Item()]);
const [, container] = usePureSource(
  () =>
    new Container(
      // ❌ This is a side-effect!
      getItem()
    ),
  [getItem]
);
```

Another possible pattern is to create the Item children components dynamically, and generate an Item inside each of them.

```tsx
const ListComponent = () => {
  const [, getList] = useSource(() => [new List()]);
  const [items, setItems] = useState([1, 2, 3]);

  // Dynamically generates the items.
  const children = items.map((key) => (
    <ItemComponent key={key} getList={getList} />
  ));

  // Rest of the component...
};
```

```tsx {4-11}
const ItemComponent = ({ getList }) => {
  const [, item] = usePureSource(() => new Item());

  // ✅ Add the item only inside an effect.
  useEffect(() => {
    const list = getList();
    // Mutates the list.
    list.add(item);
    // Returns a cleanup function.
    return () => list.remove(item);
  }, [getList, item]);

  // Rest of the component...
};
```

## Between non-Pure sources

In this example we are using the classic composition to create a Container of an Item.

```tsx {3-5}
const [, getItem] = useSource(() => [new Item()]);
const [, getContainer] = useSource(
  // ✅ classic composition.
  () => [new Container(getItem())],
  [getItem]
);
```

We can do the same in the opposite order.

```tsx {4-6}
const [, getContainer] = useSource(() => [new Container()]);
const [, getItem] = useSource(() => {
  const item = new Item();
  // ✅ We can have side-effects here.
  const container = getContainer();
  container.add(item);
  return [item];
}, [container]);
```

Another possible pattern is to create the Item children components dynamically, and generate an Item inside each of them.

```tsx
const ListComponent = () => {
  const [, getList] = useSource(() => [new List()]);
  const [items, setItems] = useState([1, 2, 3]);

  // Dynamically generates the items.
  const children = items.map((key) => (
    <ItemComponent key={key} getList={getList} />
  ));

  // Rest of the component...
};
```

```tsx {4-11}
const ItemComponent = ({ getList }) => {
  const [, getItem] = useSource(() => [new Item()]);

  // ✅ Add the item only inside an effect.
  useEffect(() => {
    const list = getList();
    // Mutates the list.
    list.add(item);
    // Returns a cleanup function.
    return () => list.remove(item);
  }, [getList, item]);

  // Rest of the component...
};
```

## Inherit dependencies

The stability of `useSnapshot` and `getSource` are defined the source `dependencies`. This means that if the dependencies don't change, these functions are guarantee to be `stable`. You can use these functions as dependencies as you would any other variable.

```tsx {9-11}
const [, getItem] = useSource(
  () => [new Item(dep1, dep2)],
  // Dependencies of item
  [dep1, dep2]
);

const [, getContainer] = useSource(
  () => [new Container(getItem())],
  // ✅ Correctly defines "getItem" as a dependency. As usual, this implicitly
  // inherit the dependencies "dep1" and "dep2" from the item.
  [getItem]
);
```
