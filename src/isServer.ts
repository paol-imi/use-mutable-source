export const isServer: boolean =
  typeof window === 'undefined' ||
  typeof window.document === 'undefined' ||
  typeof window.document.createElement === 'undefined';
