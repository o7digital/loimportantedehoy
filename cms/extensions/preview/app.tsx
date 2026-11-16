import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles/global.css';
import MagazineReader from '../../../src/components/MagazineReader';

const snapshot = JSON.parse(document.getElementById('studio-data')!.textContent!);
// Previews remain inside the studio. Section links and source links still work.
document.addEventListener('click', event => {
  const link = (event.target as Element).closest('a');
  if (link?.getAttribute('href')?.startsWith('/')) event.preventDefault();
});
createRoot(document.getElementById('root')!).render(<MagazineReader edition={snapshot.edition} editions={[snapshot.edition]} syncUrl={false} initialChapter={snapshot.page} />);
(async () => {
  try {
    await document.fonts.ready;
    for (let attempt = 0; attempt < 100 && !document.querySelector('.journal-track'); attempt++) await new Promise(resolve => setTimeout(resolve, 30));
    if (!document.querySelector('.journal-track')) throw new Error('Reader not ready');
    for (let attempt = 0; attempt < 100 && document.querySelectorAll('.journal-page[inert]').length !== snapshot.edition.chapters.length - 1; attempt++) await new Promise(resolve => setTimeout(resolve, 30));
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll<HTMLImageElement>('.journal-page[data-current=true] img')].map(img => img.decode()));
    await new Promise(resolve => setTimeout(resolve, 200));
    if (!document.querySelector('.journal-track')) throw new Error('Reader not ready');
    (window as any).__STUDIO_READY__ = true;
  } catch { (window as any).__STUDIO_ERROR__ = 'No se pudo cargar una imagen. Comprueba los archivos de esta edición.'; }
})();
