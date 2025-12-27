<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export interface CalloutTypeConfig {
    type: string;
    displayName: string;
    command: string;
    zhCommand?: string;
    color: string;
    icon: string;
    bgGradient: string;
    borderColor: string;
  }
  export interface CalloutItem {
    id: string;
    type: string;
    title: string;
    content: string;
    config: CalloutTypeConfig;
    collapsed: boolean;
    isExpanded?: boolean;
  }

  export let visible: boolean = false;
  export let plugin: any;
  export let cards: CalloutItem[] = [];
  export let defaultMode: 'jump' | 'preview' = 'preview';

  const dispatch = createEventDispatcher();

  let keyword = '';
  let mode: 'jump' | 'preview' = defaultMode;
  let activeIndex: number | null = null;
  function normalizeForMatch(s?: string): string {
    if (!s) return '';
    const low = s.toLowerCase();
    return low.replace(/\[|\]|!|\s+/g, '');
  }
  function scoreCard(c: CalloutItem, q: string): number {
    if (!q) return 0;
    const cfg: any = c.config || {};
    const fields = [cfg.command, cfg.zhCommand, cfg.type, cfg.displayName];
    let score = -1;
    for (const f of fields) {
      const s = normalizeForMatch(f as any);
      if (!s) continue;
      if (s.startsWith(q)) { score = Math.max(score, 3); }
      else if (s.includes(q)) { score = Math.max(score, 2); }
    }
    const t = (c.title || '').toLowerCase();
    const body = (c.content || '').toLowerCase();
    if (t.includes(q) || body.includes(q)) {
      score = Math.max(score, 1);
    }
    return score;
  }
  function computeFiltered(kw: string, list: CalloutItem[]): CalloutItem[] {
    const q = normalizeForMatch((kw || '').trim());
    if (!q) return list;
    const arr: Array<{ c: CalloutItem; score: number }> = [];
    for (const c of list) {
      const s = scoreCard(c, q);
      if (s >= 0) arr.push({ c, score: s });
    }
    arr.sort((a, b) => (b.score - a.score) || (a.c.config?.displayName || '').localeCompare(b.c.config?.displayName || ''));
    return arr.map(x => x.c);
  }
  $: filtered = computeFiltered(keyword, cards);
  $: current = activeIndex !== null && filtered[activeIndex] ? filtered[activeIndex] : null;
  $: if (activeIndex !== null && (activeIndex < 0 || activeIndex >= filtered.length)) {
    activeIndex = filtered.length ? 0 : null;
  }

  function handleCardAction(idx: number, id: string) {
    if (mode === 'jump') {
      dispatch('jump', id);
    } else {
      activeIndex = idx;
    }
  }
  function back() { activeIndex = null; }
  function prev() {
    if (!filtered.length || activeIndex === null) return;
    activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
  }
  function next() {
    if (!filtered.length || activeIndex === null) return;
    activeIndex = (activeIndex + 1) % filtered.length;
  }
  function random() {
    if (!filtered.length) return;
    let r = Math.floor(Math.random() * filtered.length);
    if (activeIndex !== null && filtered.length > 1 && r === activeIndex) {
      r = (r + 1) % filtered.length;
    }
    activeIndex = r;
  }
  function openCurrent() {
    if (!current) return;
    dispatch('jump', current.id);
  }

  function close() {
    dispatch('close');
  }
  function jump(id: string) {
    dispatch('jump', id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown, true);
  });
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown, true);
  });
</script>

{#if visible}
  <div class="scc-pop-cards-mask" on:click={close} />
  <div class="scc-pop-cards" role="dialog" aria-modal="true">
    <div class="scc-pop-cards__header">
      <div class="actions">
        <input
          class="filter"
          type="search"
          bind:value={keyword}
          placeholder={plugin?.i18n?.filterPlaceholder || 'Filter'}
        />
        <button class="mode" on:click={() => mode = mode === 'preview' ? 'jump' : 'preview'} title={mode === 'preview' ? (plugin?.i18n?.modePreview || 'Preview mode') : (plugin?.i18n?.modeJump || 'Jump mode')}>
          {#if mode === 'preview'}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 8l6 4-6 4V8z"/></svg>
          {/if}
        </button>
        <button class="refresh" on:click={() => dispatch('refresh')} title={plugin?.i18n?.refresh || 'Refresh'}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4A8 8 0 0 0 4 12h2a6 6 0 0 1 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35zM6.35 17.65C7.8 19.1 9.79 20 12 20a8 8 0 0 0 8-8h-2a6 6 0 0 1-6 6 5.98 5.98 0 0 1-4.22-1.78L11 13H4v7l2.35-2.35z"/></svg>
        </button>
        <button class="close" on:click={close} title={plugin?.i18n?.close || 'Close'}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.3 5.71L12 12.01 5.7 5.7 4.29 7.11 10.59 13.4 4.29 19.7 5.7 21.11 12 14.82l6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z"/></svg>
        </button>
      </div>
    </div>
    <div class="scc-pop-cards__body">
      {#if activeIndex !== null && current}
        <div class="detail" style="--color:{current.config?.color || '#888'}; --gradient:{current.config?.bgGradient || 'linear-gradient(to bottom, #f5f5f5, #ffffff)'}">
          <div class="detail__hero"></div>
          <div class="detail__bar">
            <button class="back" on:click={back} title={plugin?.i18n?.back || 'Back'}>
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14 7l-5 5 5 5V7z"/></svg>
            </button>
            <div class="spacer"></div>
            <button class="nav" on:click={prev} title={plugin?.i18n?.prev || 'Prev'}>
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15 6l-6 6 6 6"/></svg>
            </button>
            <button class="nav" on:click={next} title={plugin?.i18n?.next || 'Next'}>
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 6l6 6-6 6"/></svg>
            </button>
            <button class="nav" on:click={random} title={plugin?.i18n?.random || 'Random'}>
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 7h4l3 4-3 4H4v-2h2.5L9 11 6.5 9H4V7zm12-2l3 3-3 3V9h-2.59l-2 2H9v-2h1.41l2-2H16V5zM20 17l-3 3-3-3h2.59l2-2H20v2z"/></svg>
            </button>
            <button class="open" on:click={openCurrent} title={plugin?.i18n?.open || 'Open'}>
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M10 9V5l7 7-7 7v-4H4V9h6z"/></svg>
            </button>
          </div>
          <div class="detail__body">
            <div class="detail__type">{current.config?.displayName}</div>
            {#if current.title && current.title !== current.config?.displayName}
              <div class="detail__title">{current.title}</div>
            {/if}
            {#if current.content}
              <div class="detail__content">{current.content}</div>
            {/if}
          </div>
        </div>
      {:else if filtered.length === 0}
        <div class="empty">{plugin?.i18n?.noCallouts || 'No callouts in current document'}</div>
      {:else}
        <div class="grid">
          {#each filtered as c, i (c.id)}
            <div class="card" style="--color:{c.config?.color || '#888'};" on:click={() => handleCardAction(i, c.id)} tabindex="0" title={c.title || c.config?.displayName}>
              <div class="card__head">
                <div class="card__type" style="background: var(--color)">{c.config?.displayName}</div>
                {#if c.collapsed}
                  <svg class="collapsed" viewBox="0 0 16 16" width="12" height="12"><path fill="currentColor" d="M8 4l-6 6h12z"/></svg>
                {/if}
              </div>
              {#if c.title && c.title !== c.config?.displayName}
                <div class="card__title">{c.title}</div>
              {/if}
              {#if c.content}
                <div class="card__content">{c.content}</div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .scc-pop-cards-mask{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:saturate(120%) blur(2px);z-index:2147483646}
  .scc-pop-cards{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(1200px,86vw);height:min(860px,86vh);background:var(--b3-theme-background,#fff);color:var(--b3-theme-on-background,#222);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;flex-direction:column;z-index:2147483647;min-width:640px;min-height:400px}
  .scc-pop-cards__header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--b3-theme-surface-lighter,#e5e5e5)}
  .scc-pop-cards__header .title{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;white-space:nowrap;flex-shrink:0}
  .scc-pop-cards__header .actions{display:flex;align-items:center;gap:8px}
  .scc-pop-cards__header .filter{height:28px;line-height:28px;padding:0 10px;border:1px solid var(--b3-theme-surface-lighter,#e5e5e5);border-radius:6px;background:var(--b3-theme-surface,#fafafa);color:inherit;min-width:220px}
  .scc-pop-cards__header .mode{display:inline-grid;place-items:center;width:28px;height:28px;border:none;border-radius:6px;background:transparent;color:inherit;cursor:pointer}
  .scc-pop-cards__header .mode:hover{background:color-mix(in srgb, currentColor 12%, transparent)}
  .scc-pop-cards__header .refresh{display:inline-grid;place-items:center;width:28px;height:28px;border:none;border-radius:6px;background:transparent;color:inherit;cursor:pointer}
  .scc-pop-cards__header .refresh:hover{background:color-mix(in srgb, currentColor 12%, transparent)}
  .scc-pop-cards__header .close{display:inline-grid;place-items:center;width:28px;height:28px;border:none;border-radius:6px;background:transparent;color:inherit;cursor:pointer}
  .scc-pop-cards__header .close:hover{background:color-mix(in srgb, currentColor 12%, transparent)}
  .scc-pop-cards__body{padding:12px;overflow:auto;flex:1}
  .grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:12px}
  .card{background:var(--b3-theme-surface,#fafafa);border:1px solid var(--b3-theme-surface-lighter,#eee);border-radius:10px;padding:10px 12px;cursor:pointer;transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease}
  .card:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.12);border-color:color-mix(in srgb, var(--color) 36%, transparent)}
  .card__head{display:flex;align-items:center;gap:8px}
  .card__type{color:#fff;font-size:11px;font-weight:600;line-height:1;padding:5px 8px;border-radius:6px;max-width:75%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .card__title{margin:8px 0 4px;font-weight:600;line-height:1.3}
  .card__content{font-size:12px;line-height:1.45;color:var(--b3-theme-on-surface,#666);display:-webkit-box;-webkit-line-clamp:3;line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .collapsed{opacity:.7}
  @media (max-width: 860px){.scc-pop-cards{inset:4% 3%}}

  .detail{position:relative;display:flex;flex-direction:column;height:100%;}
  .detail__hero{height:140px;background:var(--gradient);border-radius:10px}
  .detail__bar{display:flex;align-items:center;gap:8px;margin-top:-20px;padding:0 6px}
  .detail__bar .spacer{flex:1}
  .detail__bar button{display:inline-grid;place-items:center;width:32px;height:32px;border:none;border-radius:8px;background:var(--b3-theme-surface,#fafafa);color:inherit;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .detail__bar button:hover{background:color-mix(in srgb, var(--color) 14%, var(--b3-theme-surface,#fafafa))}
  .detail__body{margin-top:8px;padding:8px 4px}
  .detail__type{display:inline-block;font-size:12px;font-weight:700;color:#fff;background:var(--color);padding:4px 8px;border-radius:6px}
  .detail__title{margin:8px 0 6px;font-weight:700;font-size:1.125rem}
  .detail__content{font-size:1rem;line-height:1.75;color:var(--b3-theme-on-surface,#555)}
  @media (max-width: 640px){
    .scc-pop-cards{left:auto;top:auto;transform:none;inset:0;width:100vw;height:100vh;min-width:0;min-height:0;border-radius:0}
    .scc-pop-cards__header{padding:calc(10px + env(safe-area-inset-top)) 12px 10px 12px}
    .scc-pop-cards__body{padding:10px 8px calc(12px + env(safe-area-inset-bottom)) 8px}
    .scc-pop-cards__header .filter{min-width:140px;max-width:240px;flex:0 0 50vw}
    .scc-pop-cards__header .mode,.scc-pop-cards__header .refresh,.scc-pop-cards__header .close{width:36px;height:36px}
    .grid{grid-template-columns:1fr}
    .detail__bar button{width:36px;height:36px}
  }
</style>
