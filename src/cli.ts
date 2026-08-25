import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

function usage(): never {
  console.error(`tzin CLI

  tzin dev [entry] [--port N]    start dev server with hot reload
                                  entry defaults to src/app.ts`)
  process.exit(1)
}

const [, , cmd, ...rest] = process.argv
if (cmd !== 'dev') usage()

// Entry is optional now - dev-server auto-detects
let entry = ''
let port = '3000'

const portFlag = rest.indexOf('--port')
if (portFlag !== -1 && rest[portFlag + 1]) port = rest[portFlag + 1]

// First non-flag arg is the entry (optional)
const entryArg = rest.find((a) => !a.startsWith('-') && a !== 'dev')
if (entryArg) entry = entryArg

const devServer = fileURLToPath(new URL('./dev-server.ts', import.meta.url))
const args = ['tsx', 'watch', '--clear-screen=false', devServer]
if (entry) args.push(entry)
args.push('--port', port)

const child = spawn('npx', args, { stdio: 'inherit' })

process.on('SIGINT', () => child.kill('SIGINT'))
child.on('exit', (code) => process.exit(code ?? 0))
