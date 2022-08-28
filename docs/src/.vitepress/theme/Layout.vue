<template>
  <h1 class="banner" v-if="isVisible">
    <p class="banner-text">
      ⭐️ If you like useSource, give it a star on
      <a
        class="banner-link"
        href="https://github.com/paol-imi/use-mutable-source"
        @click="close"
        >GitHub!</a
      >
      ⭐️
    </p>
    <button
      type="button"
      class="banner-close"
      aria-label="Close"
      @click.stop.prevent="close"
    >
      <svg viewBox="0 0 15 15" width="14" height="14">
        <g stroke="currentColor" stroke-width="3.1">
          <path d="M.75.75l13.5 13.5M14.25.75L.75 14.25"></path>
        </g>
      </svg>
    </button>
  </h1>
  <Layout />
</template>

<script setup>
import DefaultTheme from 'vitepress/theme';
import { ref, onMounted } from 'vue';

const { Layout } = DefaultTheme;
const isVisible = ref(false);

if (import.meta.env.MODE === 'development') {
  localStorage.removeItem('hide-banner');
}

onMounted(() => {
  isVisible.value = !localStorage.getItem('hide-banner');
  if (isVisible.value) document.body.classList.add('has-top-banner');
});

function close() {
  isVisible.value = false;
  document.body.classList.remove('has-top-banner');
  localStorage.setItem('hide-banner', 1);
}
</script>

<style>
.has-top-banner {
  --vt-banner-height: 30px;
}

.VPSidebar,
.VPLocalNav {
  top: var(--vt-banner-height, 0px) !important;
}

.VPNavScreen {
  margin-top: var(--vt-banner-height, 0px) !important;
}

@media (min-width: 960px) {
  .VPNav {
    top: var(--vt-banner-height, 0px) !important;
  }

  .VPApp {
    padding-top: var(--vt-banner-height, 0px) !important;
  }
}
</style>

<style scoped>
.banner-link {
  font-weight: 500;
  color: var(--vp-c-brand);
  text-decoration: underline;
  transition: color 0.25s;
}

.banner-link:hover {
  color: var(--vp-c-brand-dark);
}

.banner-close {
  flex: 0 0 30px;
}

.banner-close:hover {
  opacity: 0.7;
}

.banner-text {
  flex: 1 1 auto;
}

.banner {
  line-height: var(--vt-banner-height);
  display: flex;
  align-items: center;
  z-index: 999;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: var(--vt-banner-height);
  background-color: var(--vp-c-bg-alt);
  font-weight: bold;
  text-align: center;
  color: var(--vp-c-text-1);
  font-size: 85%;
}
</style>
