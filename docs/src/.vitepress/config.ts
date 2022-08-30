import { defineConfig } from 'vitepress';
import { description, version } from '../../../package.json';

const name = 'use-mutable-source';
const url = 'https://paol-imi.github.io';
const homepage = `${url}/${name}`;
const github = `https://github.com/paol-imi/${name}`;
const title = 'useMutableSource';
const logo = '/logo.png';
const image = `${homepage}${logo}`;

export default defineConfig({
  lang: 'en-US',
  title,
  description: description,
  base: `/${name}/`,
  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['link', { rel: 'icon', href: logo, type: 'image/png' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: homepage }],
    ['meta', { property: 'og:image', content: image }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: image }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  appearance: true,

  themeConfig: {
    logo,

    editLink: {
      pattern: `${github}/tree/main/docs/src/:path`,
      text: 'Suggest changes to this page',
    },

    algolia: {
      appId: 'ZX0FEEDOQ4',
      apiKey: '2fb46c11aaabae35391c9d37f32ed1a4',
      indexName: 'use-mutable-source',
    },

    socialLinks: [{ icon: 'github', link: github }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © 2022-PRESENT Paolo Longo`,
    },

    nav: nav(),

    sidebar: {
      '/guide/': sidebarGuide(),
      '/examples/': sidebarExamples(),
    },
  },
});

function nav() {
  return [
    { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
    {
      text: 'Examples',
      link: '/examples/gsap',
      activeMatch: '/examples/',
    },
    {
      text: version,
      items: [
        {
          text: 'Release Notes',
          link: `${github}/releases`,
        },
      ],
    },
  ];
}

function sidebarGuide() {
  return [
    {
      text: 'Guide',
      collapsible: true,
      items: [
        { text: 'Introduction', link: '/guide/introduction' },
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'useSource', link: '/guide/use-source' },
        { text: 'usePureSource', link: '/guide/use-pure-source' },
        { text: 'Source as Dependency', link: '/guide/source-as-dependency' },
        { text: 'Design Principles', link: '/guide/design-principles' },
      ],
    },
  ];
}

function sidebarExamples() {
  return [
    {
      text: 'Libraries integrations',
      collapsible: true,
      items: [
        {
          text: 'GSAP',
          link: 'examples/gsap',
        },
        {
          text: 'GSAP Draggable',
          link: 'examples/gsap-draggable',
        },
      ],
    },
    {
      text: 'Custom hooks',
      collapsible: true,
      items: [
        {
          text: 'useMediaQuery',
          link: 'examples/use-media-query',
        },
      ],
    },
  ];
}
