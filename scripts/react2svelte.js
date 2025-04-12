import { existsSync, mkdirSync } from 'fs';
import { readFile, readdir, writeFile } from 'fs/promises';
import { basename, format, resolve } from 'path';

const reactRepoName = process.argv[2] ?? 'reactRepo';
const reactRepo = resolve(import.meta.dirname, '..', '..', reactRepoName);
const route = process.argv[3] ?? '';

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
		.replace(/react/g, 'svelte');
}

function getScript(code) {
	const startFunction = code.indexOf('export default function');
	const startFunctionBody = code.indexOf('\r\n', startFunction);
	const endScript = code.indexOf('return', startFunctionBody);
	return code
		.slice(startFunctionBody, endScript)
		.replaceAll(/loaderData/g, '$props()')
		.replaceAll(/(\w*) = useState/g, '$1 = $state');
}

function getTemplate(code) {
	const startFunction = code.indexOf('export default function');
	const startReturn = code.indexOf('return', startFunction);
	code = code.slice(code.indexOf('(', startReturn) + 1, code.lastIndexOf(')'));
	return code
		.replaceAll('<>', '')
		.replaceAll('</>', '')
		.replaceAll('className=', 'class=')
		.replaceAll('defaultValue', 'bind:value')
		.replaceAll(/{(\w*).map\([\w():]* => \(([\x00-\x7F]*)\)\)}/g, '{#each $1 as item} $2 {/each}')
		.replaceAll(/\s{([^#&]*) &&[\W]*\(([^#]*)\)[\W]*}/g, '{#if $1} $2 {/if}')
		.trim();
}

function getLoader(code) {
	const start = code.indexOf('export async function loader');
	const end = code.indexOf('export default function');
	code = code.slice(start, end);
	return code.replace(/loader\(([^)]*)\)/g, 'load({params,request})');
}

function createTemplate(reactCode) {
	const script = getScript(reactCode);
	const template = getTemplate(reactCode);

	return `
<script>
${script.trim()}
</script>

${template.trim()}
`;
}

function createLoader(reactCode) {
	const imports = getImports(reactCode);
	const loader = getLoader(reactCode);

	return `
${imports.trim()}

${loader.trim()}
`;
}

const files = await readdir(resolve(reactRepo, 'app', 'routes', route), {
	withFileTypes: true,
	recursive: true
});
for (const file of files) {
	if (!file.isDirectory()) {
		const childRoute = basename(file.name, '.tsx');
		const reactCode = await readFile(resolve(file.parentPath, file.name), { encoding: 'utf-8' });
		const loader = createLoader(reactCode);
		const tempalte = createTemplate(reactCode);
		const routePath = resolve(import.meta.dirname, '..', 'src', 'routes', route, childRoute);
		const loaderFile = format({ name: '+page', ext: 'server.ts', dir: routePath });
		const templateFile = format({ name: '+page', ext: 'svelte', dir: routePath });
		if (!existsSync(routePath)) {
			mkdirSync(routePath, { recursive: true });
		}
		await writeFile(loaderFile, loader);
		await writeFile(templateFile, tempalte);
		console.log(`${loaderFile} generated`);
		console.log(`${templateFile} generated`);
	}
}
