function getImports(code) {
  return code
    .split('\n')
    .filter(
      (line) =>
        line.includes('import ') &&
        !line.includes('/components/') &&
        !line.includes('import type {Route} from') &&
        !line.includes('useState')
    )
    .map((line) => line.trim())
    .join('\n')
    .replace(/@\/lib/g, '$lib')
    .replace(/react-router/g, '@sveltejs/kit')
    .replace(/react/g, 'svelte')
}

function getSvelteImports(code) {
  return code
    .split('\n')
    .filter(
      (line) =>
        line.includes('import ') &&
        line.includes('/components/') &&
        !line.includes('import type {Route} from') &&
        !line.includes('useState')
    )
    .map((line) => line.trim())
    .join('\n')
    .replace(/\/components\/(\w*)(['"])$/g, '/components/$1.svelte$2')
    .replace(/@\/lib/g, '$lib')
    .replace(/react-router/g, '@sveltejs/kit')
    .replace(/react/g, 'svelte')
}

function getScript(code) {
  const startFunction = code.indexOf('export default function')
  const startFunctionBody = code.indexOf('\n', startFunction)
  const endScript = code.indexOf('return', startFunctionBody)
  return code
    .slice(startFunctionBody, endScript)
    .replaceAll(/loaderData/g, 'data')

    .replace(/(const|let) \[(\w*), \w*\] = useState/g, 'let $2 = $state')
    .replaceAll(/\sprops/g, ' $props()')
    .replaceAll('useEffect', '$effect')
    .replaceAll(/useRef/g, '$state')
    .replaceAll('.current', '')
}

function getTemplate(code) {
  const startFunction = code.indexOf('export default function')
  const startReturn = code.indexOf('return', startFunction)
  code = code.slice(code.indexOf('(', startReturn) + 1, code.lastIndexOf(')'))
  return code
    .replaceAll('<>', '')
    .replaceAll('</>', '')
    .replaceAll('<Fragment>', '')
    .replaceAll('</Fragment>', '')
    .replaceAll('className=', 'class=')
    .replaceAll('defaultValue', 'bind:value')
    .replaceAll('onClick', 'onclick')
    .replace(/\sref=\{/g, ' bind:this={')
    .replace(/key=\{[^}]*\}/g, '')

    .replaceAll(
      /\{([\w]*)\.map\({2}(\w*):?\s?\w*\) => \(([^&]*)\)\)\}/g,
      '{#each $1 as $2} $3 {/each}'
    )
    .replaceAll(/\{([\w\d.?>\s]*) && \(([^&]*)\)\}/g, '{#if $1} $2 {/if}')
    .replaceAll(/\{([\w\d.?>\s]*) && ([^\n]*)\}/g, '{#if $1} $2 {/if}')
    .replaceAll(/\{([\w.]*) \? \(([^:]*)\) : \(([^#]*)\)\}/g, '{#if $1} $2 {:else} $3 {/if}')
    .replaceAll(/\{([\w.]*) \? ([^:]*) : ([^\n]*)\}/g, '{#if $1} $2 {:else} $3 {/if}')
    .replaceAll(
      /\{([\w]*)\.map\({2}(\w*):?\s?\w*\) => \(([^&]*)\)\)\}/g,
      '{#each $1 as $2} $3 {/each}'
    )
    .trim()
}

function getLoader(code) {
  const start = code.indexOf('export async function loader')
  const end = code.indexOf('export default function')
  code = code.slice(start, end)
  return code
    .replace(/loader\(([^)]*)\)/g, 'load({params,request}):Promise<PageServerLoad>')
    .replace(/throw data\(([^,]*), (\d{3})\)/g, 'error($2,$1)')
    .replace(/redirect\(([^,]*), (\d{3})\)/g, 'redirect($2,$1)')
}

export function createTemplate(reactCode) {
  const imports = getSvelteImports(reactCode)
  const script = getScript(reactCode)
  const template = getTemplate(reactCode)

  return `
<script lang="ts">
import type { PageProps } from './$types'
${imports.trim()}
let {data,form}:PageProps = $props()
${script.trim()}
</script>

${template.trim()}
`
}

export function createLoader(reactCode) {
  const imports = getImports(reactCode)
  const loader = getLoader(reactCode)

  return `
import type {PageServerLoad} from './$types'
${imports.trim()}

${loader.trim()}
`
}

export function createComponent(reactCode) {
  const imports = getImports(reactCode)
  const script = getScript(reactCode)
  const template = getTemplate(reactCode)

  return `
<script lang="ts">
${imports.trim()}
${script.trim()}
</script>

${template.trim()}
`
}
