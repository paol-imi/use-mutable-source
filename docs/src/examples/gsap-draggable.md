# GSAP Draggable

This example shows how to integrate [GSAP](https://greensock.com/gsap/) with your React app.

[![Open in CodeSandbox](https://img.shields.io/badge/Open_in_CodeSandbox-3178C6?style=for-the-badge&logo=CodeSandbox&color=black&labelColor=black)](https://codesandbox.io/s/use-mutable-source-gsap-draggable-rburjl?file=/src/App.tsx)

```tsx
import { ChangeEvent, useRef } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap-trial/InertiaPlugin';
import { useSource } from 'use-mutable-source';
import './styles.css';

// Registers the plugins.
gsap.registerPlugin(Draggable, InertiaPlugin);

export default function App() {
  // Defines the references to the elements.
  const ref = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<HTMLDivElement>(null);
  // useSource will manage the Draggable lifecycle.
  const [useSnapshot] = useSource(() => [
    // Generates the draggable.
    new Draggable(ref.current, {
      type: 'x,y',
      edgeResistance: 0.65,
      bounds: boundsRef.current,
      inertia: true,
    }),
    // Destroys the Draggable.
    (draggable) => draggable.kill(),
  ]);

  const isDragging = useSnapshot(
    // Derives the snapshot. If the Draggable has not yet been created,
    // we are sure that the element is not dragging.
    (draggable) => (draggable ? draggable.isDragging : false),
    // Handles the subscription.
    (draggable, onChange) => {
      // Subscribe to all events.
      draggable.addEventListener('dragstart', onChange);
      draggable.addEventListener('dragend', onChange);

      return () => {
        // Unsubscribes from all events.
        draggable.removeEventListener('dragstart', onChange);
        draggable.removeEventListener('dragend', onChange);
      };
    }
  );

  return (
    <div className="container" ref={boundsRef}>
      <div className="box" ref={ref}>
        {isDragging ? 'Woooo!' : 'Drag and throw me!'}
      </div>
    </div>
  );
}
```
