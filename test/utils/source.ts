export class Source<T> {
  private listeners = new Set<() => void>();
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  public getValue() {
    return this.value;
  }

  public setValue(value: any) {
    this.value = value;
    this.listeners.forEach((listener) => listener());
  }

  public addChangeListener(listener: () => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }
}
