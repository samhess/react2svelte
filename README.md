# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create
```

## Converting a React Router project

```bash
cd scripts
node react2svelte.js <reactRepo> <route>
npm run format

# or start the server and open the app in a new browser tab
npm run dev -- --open
```
