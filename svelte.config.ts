import type {Config} from '@sveltejs/kit'
import adapter from '@sveltejs/adapter-auto'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'

const config = {
  // Consult https://svelte.dev/docs/kit/integrations for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter()
  }
} satisfies Config

export default config
