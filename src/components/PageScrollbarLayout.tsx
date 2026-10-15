'use client';

import { useLayoutEffect } from 'react';

const WIDTH_PROPERTY = '--itplace-scrollbar-width';
const READY_ATTRIBUTE = 'data-itplace-scrollbar-ready';

export default function PageScrollbarLayout() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const originalWidth = root.style.getPropertyValue(WIDTH_PROPERTY);
    const originalPriority = root.style.getPropertyPriority(WIDTH_PROPERTY);
    const originalReady = root.getAttribute(READY_ATTRIBUTE);
    const probe = document.createElement('div');
    const content = document.createElement('div');

    probe.setAttribute('aria-hidden', 'true');
    probe.tabIndex = -1;
    probe.inert = true;
    Object.assign(probe.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100px',
      height: '100px',
      boxSizing: 'border-box',
      overflow: 'scroll',
      visibility: 'hidden',
      pointerEvents: 'none',
    });
    Object.assign(content.style, { width: '200px', height: '200px' });
    probe.append(content);
    document.body.append(probe);

    let lastWidth = -1;
    const measure = () => {
      const width = probe.offsetWidth - probe.clientWidth;
      if (width === lastWidth) return;

      lastWidth = width;
      root.style.setProperty(WIDTH_PROPERTY, `${width}px`);
      root.setAttribute(READY_ATTRIBUTE, '');
    };

    const observer = new ResizeObserver(measure);
    observer.observe(probe, { box: 'content-box' });
    measure();

    return () => {
      observer.disconnect();
      probe.remove();
      if (originalWidth) root.style.setProperty(WIDTH_PROPERTY, originalWidth, originalPriority);
      else root.style.removeProperty(WIDTH_PROPERTY);
      if (originalReady === null) root.removeAttribute(READY_ATTRIBUTE);
      else root.setAttribute(READY_ATTRIBUTE, originalReady);
    };
  }, []);

  return null;
}
