import {existsSync, mkdirSync} from 'fs'
import {readFile, readdir, writeFile} from 'fs/promises'
import {basename, format, resolve} from 'path'
import {createLoader, createTemplate} from './react2svelte.js'

const dynamicRoutes = [
  'country',
  'currency',
  'exchange',
  'industry',
  'listing',
  'company',
  'instrument',
  'portfolio'
]

const reactRepoName = process.argv[2] ?? 'reactRepo'
const reactRepo = resolve(import.meta.dirname, '..', '..', reactRepoName)
if (existsSync(reactRepo)) {
  const routesDir = resolve(reactRepo, 'app', 'routes')
  const dirs = await readdir(routesDir, {withFileTypes: true})
  for (const dir of dirs) {
    if (dir.isDirectory()) {
      const route = dir.name
      console.log(`creating ${route} routes`)
      const routeDir = resolve(reactRepo, 'app', 'routes', route)
      const files = await readdir(routeDir, {withFileTypes: true, recursive: true})
      for (const file of files) {
        if (!file.isDirectory()) {
          const child = basename(file.name, '.tsx')
          const reactCode = await readFile(resolve(file.parentPath, file.name), {encoding: 'utf-8'})
          const loader = createLoader(reactCode)
          const tempalte = createTemplate(reactCode)
          let param = ''
          if (dynamicRoutes.includes(child)) {
            param = '[key]'
          }
          const routePath = resolve(import.meta.dirname, '..', 'src', 'routes', route, child, param)
          const loaderFile = format({name: '+page', ext: 'server.ts', dir: routePath})
          const templateFile = format({name: '+page', ext: 'svelte', dir: routePath})
          if (!existsSync(routePath)) {
            mkdirSync(routePath, {recursive: true})
          }
          await writeFile(loaderFile, loader)
          await writeFile(templateFile, tempalte)
        }
      }
    }
  }
} else {
  console.log(`React repo ${reactRepo} not found`)
}
