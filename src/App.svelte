<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import Shorten from './components/Shorten.svelte';

  const isChild = writable(false);
  const isMobile = writable(false);

  const updateTheme = (isDarkMode: boolean) => {
    const classList = document.documentElement.classList;
    if (isDarkMode && !classList.contains('dark')) {
      classList.add('dark');
    } else if (!isDarkMode && classList.contains('dark')) {
      classList.remove('dark');
    }
  };

  let themeListener: (event: MessageEvent) => void;
  let handleScreenSizeMessage: (event: MessageEvent) => void;
  let mediaQuery: MediaQueryList;

  onMount(() => {
    themeListener = (event: MessageEvent) => {
      if (event.data?.type === 'theme-change') {
        updateTheme(event.data.isDarkMode);
      }
    };
    window.addEventListener('message', themeListener);

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    updateTheme(mediaQuery.matches);

    const handleMediaChange = (event: MediaQueryListEvent) => {
      updateTheme(event.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    handleScreenSizeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'screen-size') {
        isChild.set(true);
        isMobile.set(event.data.isMobile);
      }
    };
    window.addEventListener('message', handleScreenSizeMessage);

    return () => {
      window.removeEventListener('message', themeListener);
      window.removeEventListener('message', handleScreenSizeMessage);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  });

  const mainClass = derived(
    [isChild, isMobile],
    ([$isChild, $isMobile]) => {
      if ($isChild) {
        return $isMobile
          ? 'max-md:[&_.main-layout]:pb-24'
          : 'md:[&_.main-layout]:pt-24';
      }
      return '';
    }
  );
</script>

<main class={$mainClass}>
  {#if !$isChild}
    <h1 class="sr-only">KieLink by Degiam</h1>
  {/if}
  <Shorten />
</main>

<style>
  /* Add any required scoped styles here */
</style>
