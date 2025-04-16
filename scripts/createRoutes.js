import {existsSync, mkdirSync} from 'fs'
import {readFile, writeFile} from 'fs/promises'
import {format, resolve} from 'path'
import {getRoutes, getServerPart, getClientPart} from './react2svelte.js'

function getFileRoutes(routes) {
  const fileRoutes = []
  for (const route of routes) {
    if (route.path) {
      const fileRoute = {
        tsxFile: route.file,
        sveltePath: ''
      }
      if (route.path.includes('/:')) {
        const [base, ...params] = route.path.split('/:')
        const paramsPath = params
          .filter((p) => p !== 'action?')
          .map((p) => `[${p}]`)
          .join('/')
        fileRoute.sveltePath = base + '/' + paramsPath
      } else {
        fileRoute.sveltePath = route.path
      }
      fileRoutes.push(fileRoute)
    }
  }
  return fileRoutes
}

const repoName = process.argv[2] ?? 'react-repo-name'
const reactRepo = resolve(import.meta.dirname, '..', '..', repoName)
if (existsSync(reactRepo)) {
  const reactRouterRoutes = await getRoutes(repoName, 'npx react-router routes --json')
  const layoutRoutes = reactRouterRoutes[0].children.filter(({file}) => file.endsWith('.tsx'))
  console.log(`found main route with ${layoutRoutes[0].children.length} entries`)
  const svelteRoutes = getFileRoutes(layoutRoutes[0].children)
  for (const svelteRoute of svelteRoutes) {
    const routePath = resolve(import.meta.dirname, '..', 'src', 'routes', svelteRoute.sveltePath)
    if (!existsSync(routePath)) {
      mkdirSync(routePath, {recursive: true})
    }
    const reactCode = await readFile(resolve(reactRepo, 'app', svelteRoute.tsxFile), {
      encoding: 'utf-8'
    })
    const serverPart = getServerPart(reactCode)
    const clientPart = getClientPart(reactCode)
    console.log(`writing svelte route ${routePath}`)
    await writeFile(format({name: '+page', ext: 'server.ts', dir: routePath}), serverPart)
    await writeFile(format({name: '+page', ext: 'svelte', dir: routePath}), clientPart)
  }
} else {
  console.log(`react repo ${reactRepo} not found`)
}
