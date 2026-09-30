/**
 * Static asset Worker for the existing Cloudflare Workers Build.
 * The application itself is generated into dist/ before deployment.
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
