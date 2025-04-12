function getImports(code) {
  return code
    .split('\n')
    .filter(
      (line) =>
        line.includes('import ') &&
        !line.includes('import type {Route} from') &&
        !line.includes('useState')
    )
    .map((line) => line.trim())
    .join('\n')
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
    .replaceAll(/loaderData/g, '$props()')
    .replaceAll(/(\w*) = useState/g, '$1 = $state')
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
  return code.replace(/loader\(([^)]*)\)/g, 'load({params,request})')
}

export function createTemplate(reactCode) {
  const script = getScript(reactCode)
  const template = getTemplate(reactCode)

  return `
<script>
${script.trim()}
</script>

${template.trim()}
`
}

export function createLoader(reactCode) {
  const imports = getImports(reactCode)
  const loader = getLoader(reactCode)

  return `
${imports.trim()}

${loader.trim()}
`
}
