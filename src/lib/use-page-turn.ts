import { useEffect, type RefObject } from "react";

// Keep scrolling native: iOS and Android choose the gesture direction, retain
// pinch zoom and scroll long articles. Only the paper's presentation changes.
export function usePageTurn(track: RefObject<HTMLDivElement | null>, count: number) {
  useEffect(() => {
    const container = track.current;
    if (!container) return;
    const mobile = matchMedia("(max-width: 820px), (max-width: 1100px) and (max-height: 500px), (pointer: coarse)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const pages = [...container.querySelectorAll<HTMLElement>(".journal-page")];
    let enabled = false;
    let frame = 0;
    function paint() {
      frame = 0;
      if (!enabled || !container) return;
      const width = container.clientWidth;
      if (!width) return;
      const position = Math.max(0, Math.min(count - 1, container.scrollLeft / width));
      for (const [index, page] of pages.entries()) {
        const progress = position - index;
        const turning = Math.max(0, Math.min(1, progress));
        // The next leaf rests underneath. The current leaf pivots around its
        // left edge; separate snap markers keep transformed geometry out of
        // the browser's scroll-snap calculations.
        page.style.transform = `translateX(${Math.min(0, progress) * width}px) perspective(${width * 4.5}px) rotateY(${-180 * turning}deg)`;
        page.style.visibility = progress >= 0.5 || progress < -1.001 ? "hidden" : "visible";
        page.style.setProperty("--journal-turn-shadow", String(Math.sin(Math.PI * turning) * 0.45));
      }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
    function mode() {
      enabled = mobile.matches && !reduced.matches;
      container!.dataset.pageTurn = String(enabled);
      for (const page of pages) {
        page.style.removeProperty("transform");
        page.style.removeProperty("visibility");
        page.style.removeProperty("--journal-turn-shadow");
      }
      paint();
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    container.addEventListener("scroll", schedule, { passive: true });
    mobile.addEventListener("change", mode);
    reduced.addEventListener("change", mode);
    mode();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("scroll", schedule);
      mobile.removeEventListener("change", mode);
      reduced.removeEventListener("change", mode);
    };
  }, [track, count]);
}
