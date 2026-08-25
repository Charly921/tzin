#!/usr/bin/env node

import { Command } from 'commander'
import prompts from 'prompts'
import { mkdir, writeFile, readFile, cp } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const TEMPLATES = ['node', 'bun', 'workers'] as const
type Template = (typeof TEMPLATES)[number]

interface Options {
  template?: Template
  install?: boolean
  pm?: string
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function copyTemplate(template: Template, dest: string): Promise<void> {
  const src = join(import.meta.dirname, '..', 'templates', template)
  await cp(src, dest, { recursive: true })
}

async function patchPackageJson(
  dest: string,
  projectName: string,
  template: Template
): Promise<void> {
  const pkgPath = join(dest, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  pkg.name = slug(projectName)
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

function installDeps(dest: string, pm: string): void {
  const cmds: Record<string, string> = {
    npm: 'npm install',
    yarn: 'yarn',
    pnpm: 'pnpm install',
    bun: 'bun install',
  }
  const cmd = cmds[pm]
  if (!cmd) return
  console.log(`\nInstalling dependencies with ${pm}...`)
  execSync(cmd, { cwd: dest, stdio: 'inherit' })
}

function initGit(dest: string): void {
  execSync('git init', { cwd: dest, stdio: 'ignore' })
}

async function main(): Promise<void> {
  const program = new Command()
    .name('create-tzin')
    .description('Create a new tzin project')
    .argument('[dir]', 'Project directory')
    .option('-t, --template <template>', `Template: ${TEMPLATES.join(', ')}`)
    .option('-i, --install', 'Install dependencies')
    .option('-p, --pm <pm>', 'Package manager (npm, yarn, pnpm, bun)')
    .parse()

  const opts = program.opts<Options>()
  const args = program.args

  let dir = args[0]
  let template = opts.template

  // Interactive mode
  if (!dir || !template) {
    const response = await prompts(
      [
        {
          type: dir ? null : 'text',
          name: 'dir',
          message: 'Project name:',
          initial: 'my-tzin-app',
        },
        {
          type: template ? null : 'select',
          name: 'template',
          message: 'Template:',
          choices: TEMPLATES.map((t) => ({ title: t, value: t })),
        },
      ],
      {
        onCancel: () => process.exit(1),
      }
    )
    if (!dir) dir = response.dir
    if (!template) template = response.template
  }

  if (!template) {
    console.error('No template selected')
    process.exit(1)
  }

  const dest = resolve(dir)

  console.log(`\nCreating tzin project in ${dest}...`)
  await mkdir(dest, { recursive: true })
  await copyTemplate(template, dest)
  await patchPackageJson(dest, dir, template)
  initGit(dest)

  if (opts.install) {
    installDeps(dest, opts.pm || 'npm')
  }

  console.log(`
Done! Get started:

  cd ${dir}
  ${opts.install ? '' : 'npm install\n  '}npm run dev
`)
}

main()
