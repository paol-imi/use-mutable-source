import DefaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import './brand.css';
import './custom.css';

// Default to dark-mode.
if (
  typeof localStorage !== 'undefined' &&
  !localStorage.getItem('vitepress-theme-appearance')
) {
  localStorage.setItem('vitepress-theme-appearance', 'dark');
}

export default {
  ...DefaultTheme,
  // override the Layout with a wrapper component that
  // injects the slots
  Layout,
};
