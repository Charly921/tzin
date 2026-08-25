# create-tzin

CLI for creating [tzin](https://github.com/Charly921/tzin) projects.

## Usage

```bash
# npm
npm create tzin@latest

# yarn
yarn create tzin

# pnpm
pnpm create tzin

# bun
bun create tzin
```

## Options

### `-t, --template <template>`

Specify the template: `node`, `bun`, or `workers`.

```bash
npm create tzin@latest my-app -- --template node
```

### `-i, --install`

Install dependencies after creation.

```bash
npm create tzin@latest my-app -- --install
```

### `-p, --pm <pm>`

Package manager to use: `npm`, `yarn`, `pnpm`, or `bun`.

```bash
npm create tzin@latest my-app -- --install --pm pnpm
```

## Templates

| Template | Description |
|---|---|
| `node` | Node.js server with hot reload |
| `bun` | Bun server |
| `workers` | Cloudflare Workers |

## License

MIT
