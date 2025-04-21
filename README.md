# React Router to Svelte Conversion

This project serves as a SvelteKit starter template for a React Router to SvelteKit migration.

The migrated code will not be fully ready to run and is subject to review and formatting.
But, most of the (boring) work such as creating folders and files is done by the script.

## Prerequisites
- The React source project
	- resides in the same parent directory as this project (../)
	- uses React Router v7
	- provides a *app/routes.ts* file
	- uses TypeScript JSX (tsx) route modules which are located in the *app/routes* folder
	- and it's source code is prettified with the options in *.prettierrc*
	- import statements are single line expressions at the beginning of the file

## Converting route modules from React Router

```shell
cd scripts
npm run migrate 'reactRepoName'
npm run format
# fix issues manually until no syntax errors left
npm run typecheck
# fix remaining issues until code is ready to run
# start the dev server
npm run dev
```
