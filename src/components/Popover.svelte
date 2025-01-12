<script lang="ts">
  import { writable } from "svelte/store";

  export let content: string | null = null;

  let isVisible = writable(false);
  let position = writable({ x: 0, y: 0 });

  const handleMouseMove = (event: MouseEvent) => {
    const { clientX, clientY } = event;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const maxPopoverWidth = 200;
    const popoverPadding = 10;

    position.set({
      x: Math.min(clientX, screenWidth - maxPopoverWidth - popoverPadding),
      y: Math.min(clientY + 65, screenHeight - popoverPadding),
    });
  };

  const handleMouseEnter = () => {
    isVisible.set(true);
  };

  const handleMouseLeave = () => {
    isVisible.set(false);
  };
</script>

<div
  class="inline-block cursor-default"
  role="button"
  tabindex="0"
  aria-haspopup="true"
  aria-expanded={$isVisible}
  aria-label="Popover trigger"
  on:mousemove={handleMouseMove}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <slot></slot>

  {#if $isVisible}
    <div class="absolute bg-black text-white px-4 py-3 text-center text-xs rounded-xl z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 max-w-[220px] break-word after:content-[''] after:absolute after:-top-3.5 after:left-1/2 after:transform after:-translate-x-1/2 after:w-0 after:h-0 after:border-8 after:border-t-transparent after:border-x-transparent after:border-b-black"
      style="top: {$position.y}px; left: {$position.x}px;"
    >
      <slot name="content">{content}</slot>
    </div>
  {/if}
</div>