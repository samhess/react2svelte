import {existsSync, mkdirSync} from 'fs'
import {readFile, readdir, writeFile} from 'fs/promises'
import {basename, format, resolve} from 'path'
import {createComponent} from './react2svelte.js'

const reactRepoName = process.argv[2] ?? 'reactRepo'
const reactRepo = resolve(import.meta.dirname, '..', '..', reactRepoName)
if (existsSync(reactRepo)) {
  const componentsPath = resolve(reactRepo, 'lib', 'components')
  const components = await readdir(componentsPath, {withFileTypes: true})
  for (const component of components) {
    if (!component.isDirectory()) {
      const componentsName = basename(component.name, '.tsx')
      const reactCode = await readFile(resolve(component.parentPath, component.name), {
        encoding: 'utf-8'
      })
      const tempalte = createComponent(reactCode)
      const componentsPath = resolve(import.meta.dirname, '..', 'src', 'lib', 'components')
      const componentFile = format({name: componentsName, ext: 'svelte', dir: componentsPath})
      if (!existsSync(componentsPath)) {
        mkdirSync(componentsPath, {recursive: true})
      }
      await writeFile(componentFile, tempalte)
    }
  }
} else {
  console.log(`React repo ${reactRepo} not found`)
}
