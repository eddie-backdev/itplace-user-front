export const installCustomMarkerImageFallback = (root: ParentNode) => {
  root.querySelectorAll<HTMLImageElement>('img[data-marker-image="true"]').forEach((image) => {
    image.addEventListener(
      'error',
      () => {
        const wrapper = image.closest('[data-marker-image-wrap="true"]');
        const fallback = wrapper?.querySelector<HTMLElement>('[data-marker-fallback="true"]');

        image.style.display = 'none';
        fallback?.classList.remove('hidden');
      },
      { once: true }
    );
  });
};
