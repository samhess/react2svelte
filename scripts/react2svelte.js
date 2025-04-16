import {exec as execCb} from 'child_process'
import {promisify} from 'node:util'
import {resolve} from 'node:path'

export async function getRoutes(repoName, command) {
  const exec = promisify(execCb)
  const child = await exec(command, {
    cwd: resolve(import.meta.dirname, '..', '..', repoName),
    shell: 'powershell.exe'
  })
  return JSON.parse(child.stdout)
}

function getImports(code = '', part = 'server') {
  const lastImport = code.lastIndexOf('import ')
  let imports = code
    .slice(0, code.indexOf('\n', lastImport))
    .replace(/\/components\/(\w*)(['"])$/g, '/components/$1.svelte$2')
    .replace(/@\/lib/g, '$lib')
    .replace(/react-router/g, '@sveltejs/kit')
    .replace(/react/g, 'svelte')
    .replace(
      /import \{data([^\}])*\} from '@sveltejs\/kit'/g,
      "import {json,error$1} from '@sveltejs\/kit'"
    )
    .split('\n')
    .filter(
      (line) =>
        !line.includes('import type {Route} from') &&
        !line.includes("from '~/sessions.server'") &&
        !line.includes("import {useState} from 'svelte'") &&
        !line.includes("import {Fragment} from 'svelte'")
    )
    .join('\n')
    .trim()
  if (part === 'server') {
    return imports
      .split('\n')
      .filter((line) => !line.includes('/components/'))
      .map((line) => line.trim())
      .join('\n')
  } else if (part === 'client') {
    return imports
      .split('\n')
      .filter((line) => !line.includes('@sveltejs/kit'))
      .map((line) => line.trim())
      .join('\n')
  }
}

function getScript(code) {
  const startFunction = code.indexOf('export default function')
  const startScript = code.indexOf('\n', startFunction)
  const endScript = code.indexOf('return (', startScript)
  return code
    .slice(startScript, endScript)
    .replaceAll(/loaderData/g, 'data')
    .replace(/(const|let) \[(\w*), \w*\] = useState/g, 'let $2 = $state')
    .replaceAll(/\sprops/g, ' $props()')
    .replaceAll('useEffect', '$effect')
    .replaceAll(/useRef/g, '$state')
    .replaceAll('.current', '')
    .trim()
}

function getTemplate(code) {
  if (code.includes('export default function')) {
    const startFunction = code.indexOf('export default function')
    const startReturn = code.indexOf('return (', startFunction)
    code = code.slice(code.indexOf('(', startReturn) + 1, code.lastIndexOf(')'))
    return (
      code
        .replaceAll('<>', '')
        .replaceAll('</>', '')
        .replaceAll('<Fragment>', '')
        .replaceAll('</Fragment>', '')
        .replaceAll('className=', 'class=')
        .replaceAll('defaultValue', 'bind:value')
        .replaceAll('onClick', 'onclick')
        .replace(/\sref=\{/g, ' bind:this={')
        .replace(/key=\{[^}]*\}/g, '')
        // {condition && <tag />} single line
        .replace(/\{([\w\d.?>\s]*) && (<[^\n]*\/>)\}/g, '{#if $1} $2 {/if}')
        // {array.map((company) => (HTML))}
        .replace(
          /\{(\w*|\w*\.\w*)\.map\({2}([^:)]*)[^)]*\) => \(([^&]*)\)\)\}/g,
          '{#each $1 as $2} $3 {/each}'
        )
        // run twice for nested loops
        .replace(
          /\{(\w*|\w*\.\w*)\.map\({2}([^:)]*)[^)]*\) => \(([^&]*)\)\)\}/g,
          '{#each $1 as $2} $3 {/each}'
        )
        // {condition && (HTML)} multi line
        .replace(/\{([^&}]*) && \(([^&]*)\s+\)\}/g, '{#if $1} $2 {/if}')
        .replace(/\{([^&}]*) && \(([^#]*)\s+\)\}/g, '{#if $1} $2 {/if}')
        .replace(
          /\{(\w*|\w*\.\w*)\.map\({2}(\w*)[^)]*\) => \(([^&]*)\)\)\}/g,
          '{#each $1 as $2} $3 {/each}'
        )
        // {condition && HTML : HTML}
        .replace(/[^=$]\{([^?}]*) \? ([^:]*) : ([^&}]*)\}/g, '{#if $1} $2 {:else} $3 {/if}')
        .trim()
    )
  } else {
    return ''
  }
}

function getLoader(code) {
  const start = code.indexOf('export async function loader')
  const end = code.includes('export default function')
    ? code.indexOf('export default function')
    : code.lastIndexOf('}' + 1)
  code = code.slice(start, end)
  return code
    .replace(/loader\(([^)]*)\)/g, 'load({params,request})')
    .replace(/throw data\(([^,]*), ([^)]*)\)/g, 'error($2,$1)')
    .replace(/redirect\(([^,]*), (\d{3})\)/g, 'redirect($2,$1)')
    .trim()
}

export function getServerPart(reactCode) {
  const imports = getImports(reactCode, 'server')
  const loader = getLoader(reactCode)

  return `
import type {PageServerLoad} from './$types'
${imports}

${loader}
`
}

export function getClientPart(reactCode) {
  const imports = getImports(reactCode, 'client')
  const script = getScript(reactCode)
  const template = getTemplate(reactCode)

  return `
<script lang="ts">
import type { PageProps } from './$types'
${imports}
let {data,form}:PageProps = $props()
${script}
</script>

${template}
`
}

export function createComponent(reactCode) {
  const imports = getImports(reactCode)
  const script = getScript(reactCode)
  const template = getTemplate(reactCode)

  return `
<script lang="ts">
${imports}
${script}
</script>

${template}
`
}
