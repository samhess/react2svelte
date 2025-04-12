function getImports(code) {
  return code
    .split('\r\n')
    .filter(
      (line) =>
        line.includes('import ') &&
        !line.includes('import type {Route} from') &&
        !line.includes('useState')
    )
    .map((line) => line.trim())
    .join('\r\n')
    .replace(/@\/lib/g, '$lib')
    .replace(/react-router/g, '@sveltejs/kit')
    .replace(/react/g, 'svelte')
}

function getScript(code) {
  const startFunction = code.indexOf('export default function')
  const startFunctionBody = code.indexOf('\r\n', startFunction)
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
    .replaceAll('className=', 'class=')
    .replaceAll('defaultValue', 'bind:value')
    .replaceAll(/{(\w*).map\([\w():]* => \(([\x00-\x7F]*)\)\)}/g, '{#each $1 as item} $2 {/each}')
    .replaceAll(/\s{([^#&]*) &&[\W]*\(([^#]*)\)[\W]*}/g, '{#if $1} $2 {/if}')
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
