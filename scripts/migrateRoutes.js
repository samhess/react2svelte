import {existsSync, mkdirSync} from 'fs'
import {readFile, writeFile} from 'fs/promises'
import {format, resolve} from 'path'
import {getRoutes, getServerPart, getClientPart} from './react2svelte.js'

function getFileRoutes(routes) {
  const fileRoutes = []
  for (const route of routes) {
    const fileRoute = {
      tsxFile: route.file,
      sveltePath: ''
    }
    if (!route.path) {
      // index
      fileRoutes.push(fileRoute)
    } else {
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
  console.log(`react router has ${layoutRoutes[0].children.length} routes`)
  const svelteRoutes = getFileRoutes(layoutRoutes[0].children)
  console.log(`creating ${svelteRoutes.length} svelte routes`)
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
    console.log(` - src/routes/${svelteRoute.sveltePath}`)
    await writeFile(format({name: '+page', ext: 'server.ts', dir: routePath}), serverPart)
    await writeFile(format({name: '+page', ext: 'svelte', dir: routePath}), clientPart)
  }
} else {
  console.log(`react repo ${reactRepo} not found`)
}
