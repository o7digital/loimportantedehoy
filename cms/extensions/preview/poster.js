import { initEditing } from './editing.js';
(async () => {
  try {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    const failed = [];
    for (const block of document.querySelectorAll('[data-fit]')) {
      const minimum = Number(block.dataset.min);
      let size = parseFloat(getComputedStyle(block).fontSize);
      while ((block.scrollHeight > block.clientHeight + 2 || block.scrollWidth > block.clientWidth + 2) && size > minimum) {
        size -= .5;
        block.style.fontSize = `${size}px`;
      }
      if (block.scrollHeight > block.clientHeight + 3 || block.scrollWidth > block.clientWidth + 3) failed.push(block.textContent.slice(0, 42));
    }
    if (failed.length) throw new Error(`Acorta estos textos en «Formato Instagram» antes de exportar: ${failed.join(' / ')}`);
    initEditing(JSON.parse(document.getElementById('studio-data').textContent));
    window.__STUDIO_READY__ = true;
  } catch (error) {
    window.__STUDIO_ERROR__ = error.message.startsWith('Acorta') ? error.message : 'No se pudo cargar una imagen. Comprueba los archivos de esta edición.';
  }
})();
