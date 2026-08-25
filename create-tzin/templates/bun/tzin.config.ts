import { defineConfig } from '@carlos-tzin/tzin'

export default defineConfig({
  port: 3000,
  openapi: true,
  llms: true,
  meta: {
    title: 'My tzin App',
    version: '0.0.0',
  },
})
