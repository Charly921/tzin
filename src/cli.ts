import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

function usage(): never {
  console.error(`tzin CLI

  tzin dev <entry-file> [--port N]   start dev server with hot reload
                                     entry must default-export a tzin App`)
  process.exit(1)
}

const [, , cmd, ...rest] = process.argv
if (cmd !== 'dev' || rest.length === 0) usage()

const entry = rest[0]
let port = '3000'
const portFlag = rest.indexOf('--port')
if (portFlag !== -1 && rest[portFlag + 1]) port = rest[portFlag + 1]

const devServer = fileURLToPath(new URL('./dev-server.ts', import.meta.url))
const child = spawn('npx', ['tsx', 'watch', '--clear-screen=false', devServer, entry, port], {
  stdio: 'inherit',
})

process.on('SIGINT', () => child.kill('SIGINT'))
child.on('exit', (code) => process.exit(code ?? 0))
