import { createApp } from '@carlos-tzin/tzin'
import { healthRoute } from './routes/health.js'
import { greetRoute } from './routes/greet.js'

export const app = createApp([healthRoute, greetRoute], {
  openapi: true,
  llms: true,
  meta: { title: 'My tzin App', version: '0.0.0' },
})
