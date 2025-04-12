# React Router to Svelte Conversion

This project is going to be a Svelte version of a React Router project

## Creating the project

```bash
# create a new project in the current directory
npx sv create
```

## Converting route modules from React Router

```bash
cd scripts
# assuming the React repo resides in the same parent directory as this Svelte project (sibling)
npm run convert reactRepoName
npm run format

# start the dev server
npm run dev
```
