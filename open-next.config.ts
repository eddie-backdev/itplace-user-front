import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Static pages use build artifacts; public benefit data remains no-store SSR.
// Add a writable cache only if ISR/on-demand revalidation is introduced.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
