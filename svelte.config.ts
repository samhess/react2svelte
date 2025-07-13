import type {Config} from '@sveltejs/kit'
import adapter from '@sveltejs/adapter-auto'

const config = {
  kit: {
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter()
  }
} satisfies Config

export default config
