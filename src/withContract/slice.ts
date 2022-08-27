/**
 * This class represents a Slice of a state that can receives and notify updates.
 * The Slice has a version that is modified each time an updates is received.
 */
export class Slice {
  public version = 0;
  private listeners = new Set<() => void>();

  /**
   * Updates the Slice version and notify all listeners.
   */
  public update = () => {
    this.version++;
    this.listeners.forEach((listener) => listener());
  };

  /**
   * Adds a listener for updates.
   *
   * @param listener - the listener
   * @returns a function to remove the listener
   */
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };
}
