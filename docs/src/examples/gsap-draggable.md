# GSAP Draggable

This example shows how to integrate [GSAP](https://greensock.com/gsap/) with your React app.

[![Edit use-mutable-source-gsap](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/use-mutable-source-gsap-draggable-rburjl)

<iframe src="https://codesandbox.io/embed/use-mutable-source-gsap-draggable-rburjl?autoresize=1&codemirror=1&fontsize=14&hidenavigation=1&theme=light&view=preview&hidedevtools=1"
     style="width:100%; height:200px; border:0; border-radius: 4px; overflow:hidden; border: 1px solid #242424;"
     title="use-mutable-source-gsap"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>

```tsx
import { ChangeEvent, useRef } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap-trial/InertiaPlugin';
import { useSource } from 'use-mutable-source';

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
    // we are sure that the element is not being dragged.
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
