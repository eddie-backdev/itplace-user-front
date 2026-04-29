let lockCount = 0;
let previousBodyOverflow = '';
let previousDocumentOverflow = '';

export const disableScroll = () => {
  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousDocumentOverflow = document.documentElement.style.overflow;
  }

  lockCount += 1;
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
};

export const enableScroll = () => {
  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousDocumentOverflow;
    previousBodyOverflow = '';
    previousDocumentOverflow = '';
  }
};
