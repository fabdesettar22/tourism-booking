// frontend/src/hooks/useInView.ts
// IntersectionObserver hook — fires once when element enters viewport

import { useEffect, useRef } from 'react';

export function useInView<T extends HTMLElement = HTMLDivElement>(
  threshold: number = 0.12
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mb-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
