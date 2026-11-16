<script setup>
defineProps({ name: { type: String, default: 'book' } });
const paths = {
  book:'M3 4h6a4 4 0 0 1 3 1.4A4 4 0 0 1 15 4h6v16h-6a4 4 0 0 0-3 1 4 4 0 0 0-3-1H3ZM12 6v15',
  text:'M4 5h16M12 5v15M8 20h8M5 12h4m6 0h4', image:'M3 3h18v18H3ZM3 17l6-6 4 4 3-3 5 5M8 7h.01',
  pages:'M8 3h12v15H8ZM4 7v15h12', palette:'M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 1-3.7 1.7 1.7 0 0 1 1-3.3h2a4 4 0 0 0 4-4C21 6 17 3 12 3ZM7 9h.01M10 6h.01M15 6h.01M18 9h.01',
  save:'M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8', upload:'M12 16V3M7 8l5-5 5 5M4 16v5h16v-5',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6', plus:'M12 5v14M5 12h14', close:'m6 6 12 12M6 18 18 6',
  down:'m6 9 6 6 6-6', up:'m6 15 6-6 6 6', arrow:'M5 12h14m-6-6 6 6-6 6', left:'M19 12H5m6-6-6 6 6 6',
  check:'m5 12 4 4L19 6', refresh:'M20 7v5h-5M4 17v-5h5M5.5 7a7 7 0 0 1 12-2l2.5 4M4 15l2.5 4a7 7 0 0 0 12-2',
  phone:'M7 2h10v20H7ZM10 18h4', monitor:'M3 3h18v14H3ZM12 17v4M7 21h10', instagram:'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M17 7h.01',
  music:'M9 18V5l11-2v13M9 9l11-2M9 18a3 3 0 1 1-3-3h3M20 16a3 3 0 1 1-3-3h3', quote:'M4 6h6v7H7c0 3-1 4-3 5M14 6h6v7h-3c0 3-1 4-3 5',
  chart:'M4 20h16M7 16V9M12 16V4M17 16v-5', external:'M14 3h7v7m-1-6L10 14M10 3H3v18h18v-7',
  search:'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM16 16l5 5', clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l4 2',
  grid:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z', menu:'M4 6h16M4 12h16M4 18h16', copy:'M8 3h13v14H8ZM3 7v14h13', archive:'M3 3h18v5H3ZM5 8v13h14V8M9 12h6', undo:'M9 4 4 9l5 5M4 9h9a7 7 0 0 1 7 7v4', expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5', pencil:'m14 5 5 5M4 20l4-1L20 7a2 2 0 0 0-4-4L4 15Z',
};
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.book" /></svg></template>
