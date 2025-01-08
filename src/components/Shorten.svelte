<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import html2canvas from 'html2canvas';
  import Brand from './Brand.svelte';
  import Built from './Built.svelte';
  import { shortenUrl, deleteUrl } from '../lib/bitly';

  const storage: string = 'degiam-link';

  let qrcode: string | null = null;
  let popupQr: boolean = false;
  let popupDelete: boolean = false;
  let dropdown: string | null = null;
  let dropdownRefs: { [key: string]: HTMLDivElement } = {};
  let qrcodeElement: HTMLDivElement;

  $: longUrl = '';
  $: stored = JSON.parse(localStorage.getItem(storage) || '[]');
  $: selected = '';
  $: loadingCreate = false;
  $: loadingDelete = false;
  $: error = '';
  $: success = '';
  $: if (success) {
    setTimeout(() => {
      success = '';
    }, 3000);
  };

  const handleShorten = async () => {
    try {
      loadingCreate = true;
      success = '';
      error = '';

      if (!/^(https?:\/\/(?:www\.)?[^\s$.?#].[^\s]*)$/i.test(longUrl)) {
        error = 'Masukkan URL yang valid';
        loadingCreate = false;
        return;
      }

      const result: any = await shortenUrl(longUrl);
      if (result) {
        const newData = {
          id: result.id,
          url: {
            original: result.long_url,
            shorten: result.link,
          },
          qrcode: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(result.link)}&size=512x512`,
        };
        const storedUpdate = [newData, ...stored];
        localStorage.setItem(storage, JSON.stringify(storedUpdate));
        stored = storedUpdate;

        longUrl = '';
        success = 'URL dan QR Code berhasil dibuat';
      } else {
        error = 'Gagal membuat URL pendek, coba lagi nanti.';
      }
    } catch (err: any) {
      error = err.message || 'Terjadi kesalahan';
    } finally {
      loadingCreate = false;
    }
  };

  const handleRemove = async (id: string) => {
    try {
      loadingDelete = true;
      success = '';
      error = '';

      const result: any = await deleteUrl(id)
      
      if (result) {
        stored = stored.filter((item: any) => item.id !== id);
        localStorage.setItem(storage, JSON.stringify(stored));

        success = 'URL dan QR Code berhasil dihapus';
      } else {
        error = 'Gagal menghapus URL pendek, coba lagi nanti.';
      }
    } catch (err: any) {
      error = err.message || 'Terjadi kesalahan';
    } finally {
      loadingDelete = false;
      handlePopupDeleteClose();
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      success = '';
      error = '';

      await navigator.clipboard.writeText(url);
      success = 'URL berhasil disalin';
    } catch {
      error = 'Gagal menyalin URL';
    }
  };

  const handleQrDownload = () => {
    if (qrcodeElement) {
      html2canvas(qrcodeElement, {
        backgroundColor: "#ffffff",
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpg');
        link.download = 'qrcode.jpg';
        link.click();
      });
    }
  };

  const handlePopupQrOpen = (id: string) => {
    const item = stored.find((data: any) => data.id === id);
    if (item) {
      qrcode = item.qrcode;
    } else {
      qrcode = null;
    }
    popupQr = true;
  };
  const handlePopupQrClose = () => {
    qrcode = null;
    popupQr = false;
  };

  const handlePopupDeleteOpen = (id: string) => {
    selected = id;
    popupDelete = true;
  };
  const handlePopupDeleteClose = () => {
    selected = '';
    popupDelete = false;
  };

  const handleDropdown = (id: string) => {
    dropdown = dropdown === id ? null : id;
  };
  const handleDropdownClickOutside = (event: MouseEvent) => {
    const clickedOutside = Object.values(dropdownRefs).every(ref => ref && !ref.contains(event.target as Node));
    if (clickedOutside) {
      dropdown = null;
    }
  };

  onMount(() => {
    document.addEventListener('click', handleDropdownClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleDropdownClickOutside);
  });
</script>

<div class="flex justify-center items-center min-h-screen p-6 main-layout">
  <div class={`w-screen max-w-lg ${stored.length < 1 ? 'mb-10 md:mb-16' : ''}`}>

    <div class="w-fit mx-auto mb-4">
      <Brand />
    </div>

    <form on:submit|preventDefault={handleShorten} class="flex flex-col gap-6">
      <label class="flex flex-col gap-2">
        <span class="sr-only">URL</span>
        <input type="url" bind:value={longUrl} placeholder="https://domain.com/abc/xyz" class="w-full px-4 py-3 border border-slate-300 text-black rounded-lg focus:shadow-[2px_2px_0_#22d3ee,-2px_2px_0_#22d3ee,2px_-2px_0_#22d3ee,-2px_-2px_0_#22d3ee] focus-visible:outline-none focus:border-slate-400" />
      </label>
    
      <button type="submit" class={`w-full px-4 py-3 rounded-lg transition font-bold text-white border-cyan-500 hover:border-cyan-600 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 ${loadingCreate ? 'pointer-events-none !text-white !bg-slate-300 dark:!text-slate-500 dark:!bg-slate-800' : ''}`}>Generate</button>
    </form>

    {#if success}
      <div class="fixed top-0 right-0 m-4 md:m-8 px-4 py-3 md:px-5 md:py-4 rounded-lg md:rounded-xl shadow-xl bg-green-100 text-green-600">
        {success}
      </div>
    {/if}

    {#if error}
      <p class="text-sm text-red-500 dark:text-red-600 mt-4">{error}</p>
    {/if}

    {#if loadingCreate}
      <div class="w-10 h-10 mx-auto mt-[2.8rem] -mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full animate-spin text-cyan-600">
          <path fill="none" d="M0 0h24v24H0z" stroke="none" />
          <path opacity=".25" d="M5.636 5.636a9 9 0 1 0 12.728 12.728a9 9 0 0 0 -12.728 -12.728z" />
          <path d="M16.243 7.757a6 6 0 0 0 -8.486 0" />
        </svg>
      </div>
    {/if}

    {#if stored.length > 0}
      <div class="w-full mt-8">
        <ul>
        {#each stored as item}
          <li class="flex md:items-center justify-between max-md:flex-col gap-y-3 gap-x-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
            <div class="flex flex-col gap-1 text-left max-w-[calc(100%-160px)]">
              <a class="hover:text-cyan-500 hover:underline transition w-fit" target="_blank" href={item.url.shorten}>{item.url.shorten}</a>
              <p class="text-xs text-slate-400 dark:text-slate-500 w-fit line-clamp-1">{item.url.original}</p>
            </div>
            <div class="flex items-center max-md:justify-between gap-3">
              <div class="flex items-center gap-3">
                <button
                  on:click={() => handleCopyUrl(item.url.shorten)}
                  class="w-full whitespace-nowrap px-8 md:px-4 py-1.5 text-sm rounded-lg transition border border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-400 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Salin
                </button>
                <button
                  on:click={() => handlePopupQrOpen(item.id)}
                  class="text-sm opacity-50 hover:opacity-100 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                    <path d="M7 17l0 .01" />
                    <path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                    <path d="M7 7l0 .01" />
                    <path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                    <path d="M17 7l0 .01" />
                    <path d="M14 14l3 0" />
                    <path d="M20 14l0 .01" />
                    <path d="M14 14l0 3" />
                    <path d="M14 20l3 0" />
                    <path d="M17 17l3 0" />
                    <path d="M20 17l0 3" />
                  </svg>
                  <span class="sr-only">QR Code</span>
                </button>
              </div>
              <div class="relative" bind:this={dropdownRefs[item.id]}>
                <button
                  on:click={() => handleDropdown(item.id)}
                  class="text-sm opacity-50 hover:opacity-100 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  </svg>
                  <span class="sr-only">Lainnya</span>
                </button>
                {#if dropdown === item.id}
                  <div class="absolute bottom-10 -right-4 z-[1] py-1 mt-2 rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <button
                      on:click={() => handleCopyUrl(item.url.shorten)}
                      class="w-full whitespace-nowrap text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/30"
                    >
                      Salin URL
                    </button>
                    <button
                      on:click={() => handlePopupQrOpen(item.id)}
                      class="w-full whitespace-nowrap text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/30"
                    >
                      Lihat QR Code
                    </button>
                    <button
                      on:click={() => handlePopupDeleteOpen(item.id)}
                      class="w-full whitespace-nowrap text-left px-4 py-2 text-sm text-red-500 dark:text-dark-700 hover:bg-slate-100 dark:hover:bg-slate-900/30"
                    >
                      Hapus
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          </li>
        {/each}
        </ul>
      </div>
    {/if}

    {#if popupQr}
      <div class="fixed inset-0 flex justify-center items-center bg-black/80 z-50">
        <div class="flex flex-col gap-4 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-md">
          {#if qrcode}
            <div class="relative mx-auto border bg-white border-slate-300 dark:border-slate-500 rounded-xl w-fit p-1">
              <img bind:this={qrcodeElement} class="w-64 h-64 p-4 relative z-[1]" width="512" height="512" alt="QR Code" src={qrcode} />
              <div class="w-10 h-10 absolute top-0 left-0 bottom-0 right-0 m-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full animate-spin text-cyan-600">
                  <path fill="none" d="M0 0h24v24H0z" stroke="none" />
                  <path opacity=".25" d="M5.636 5.636a9 9 0 1 0 12.728 12.728a9 9 0 0 0 -12.728 -12.728z" />
                  <path d="M16.243 7.757a6 6 0 0 0 -8.486 0" />
                </svg>
              </div>
            </div>
            <button
              type="button"
              class="w-full px-4 py-3 rounded-lg transition font-bold text-white bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500"
              on:click={handleQrDownload}
            >
              Unduh QR Code
            </button>
          {:else}
            <div class="w-[330px] h-64 flex items-center justify-center mx-auto">
              <div class="w-10 h-10 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full animate-spin text-cyan-600">
                  <path fill="none" d="M0 0h24v24H0z" stroke="none" />
                  <path opacity=".25" d="M5.636 5.636a9 9 0 1 0 12.728 12.728a9 9 0 0 0 -12.728 -12.728z" />
                  <path d="M16.243 7.757a6 6 0 0 0 -8.486 0" />
                </svg>
              </div>
            </div>
          {/if}
          <button
            type="button"
            on:click={handlePopupQrClose}
            class="w-full px-4 py-3 rounded-lg transition text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
          >
            Kembali
          </button>
        </div>
      </div>
    {/if}

    {#if popupDelete}
      <div class="fixed inset-0 flex justify-center items-center bg-black/80 z-50">
        <div class="flex flex-col gap-8 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-lg">
          <h2 class="text-2xl font-bold text-center">Yakin mau dihapus?</h2>
          <div class="text-slate-400 dark:text-slate-500">Kamu akan menghapus <pre class="text-sm bg-black/5 dark:bg-white/10 py-1 px-2 rounded-lg w-fit inline-block ml-1"><code>https://{selected}</code></pre></div>
          <div class="flex flex-col gap-4">
            <button
              type="button"
              class={`w-full px-4 py-3 rounded-lg font-bold relative flex items-center justify-center gap-2 text-white bg-red-500 dark:bg-red-600 ${!loadingDelete ? 'transition hover:bg-red-600 dark:hover:bg-red-500' : 'pointer-events-none'}`}
              on:click={() => handleRemove(selected)}
            >
              <span>Hapus Sekarang</span>
              {#if loadingDelete}
                <div class="w-8 h-8 invert brightness-0 contrast-100 -my-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full animate-spin text-cyan-600">
                    <path fill="none" d="M0 0h24v24H0z" stroke="none" />
                    <path opacity=".25" d="M5.636 5.636a9 9 0 1 0 12.728 12.728a9 9 0 0 0 -12.728 -12.728z" />
                    <path d="M16.243 7.757a6 6 0 0 0 -8.486 0" />
                  </svg>
                </div>
              {/if}
            </button>
            <button
              type="button"
              on:click={handlePopupDeleteClose}
              class="w-full px-4 py-3 rounded-lg transition text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    {/if}

    <Built />
  </div>
</div>