export const CONTACT_EMAIL =
  import.meta.env.VITE_CONTACT_EMAIL?.trim() || 'noreply.itplace@gmail.com';
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
