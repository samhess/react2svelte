import {existsSync, mkdirSync} from 'fs'
import {readFile, readdir, writeFile} from 'fs/promises'
import {basename, format, resolve} from 'path'
import {createLoader, createTemplate} from './react2svelte.js'

const reactRepoName = process.argv[2] ?? 'reactRepo'
const reactRepo = resolve(import.meta.dirname, '..', '..', reactRepoName)
const route = process.argv[3] ?? ''

const routesDir = resolve(reactRepo, 'app', 'routes', route)
const files = await readdir(routesDir, {withFileTypes: true, recursive: true})

for (const file of files) {
  if (!file.isDirectory()) {
    const childRoute = basename(file.name, '.tsx')
    const reactCode = await readFile(resolve(file.parentPath, file.name), {encoding: 'utf-8'})
    const loader = createLoader(reactCode)
    const tempalte = createTemplate(reactCode)
    const routePath = resolve(import.meta.dirname, '..', 'src', 'routes', route, childRoute)
    const loaderFile = format({name: '+page', ext: 'server.ts', dir: routePath})
    const templateFile = format({name: '+page', ext: 'svelte', dir: routePath})
    if (!existsSync(routePath)) {
      mkdirSync(routePath, {recursive: true})
    }
    await writeFile(loaderFile, loader)
    console.log(`${loaderFile} generated`)
    await writeFile(templateFile, tempalte)
    console.log(`${templateFile} generated`)
  }
}
