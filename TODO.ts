const [useSnapshot, getSource] = useSource(
  () => [new Source(), (source) => source.destroy()],
  [],
  
);
