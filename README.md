# React Router to Svelte Conversion

## Creating a project

```bash
# create a new project in the current directory
npx sv create
```

## Converting route modules from React Router

```bash
cd scripts
node convertRoutes.js <reactRepoFolder> <routesSubFolder>
npm run format

# or start the server and open the app in a new browser tab
npm run dev -- --open
```
