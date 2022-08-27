import { type ReactNode, Fragment, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

// @ts-expect-error this flag is not typed.
global.IS_REACT_ACT_ENVIRONMENT = true;

// FIXME: use react-test-render when this issue
// https://github.com/facebook/react/issues/25032 is resolved.
function create({ strictMode } = { strictMode: false }) {
  const root = createRoot(document.createElement('div'));
  const Wrapper = strictMode ? StrictMode : Fragment;

  return {
    update(children: ReactNode) {
      root.render(<Wrapper>{children}</Wrapper>);
    },
    unmount() {
      root.unmount();
    },
  };
}

export { act, create };
