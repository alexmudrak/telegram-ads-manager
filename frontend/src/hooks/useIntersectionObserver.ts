import { RefObject, useEffect, useState } from 'react';

export function useIntersectionObserver(
  ref: RefObject<Element>,
) {
  const [isIntersecting, setIsIntersecting] = useState(true);

  useEffect(() => {
    const currectRef = ref.current;

    if (!currectRef) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    });

    if (currectRef) {
      observer.observe(currectRef);
    }

    return () => {
      if (currectRef) {
        observer.unobserve(currectRef);
      }
    };
  }, [ref]);

  return { isIntersecting };
}
