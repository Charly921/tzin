import { serveBun } from '@carlos-tzin/tzin'
import { app } from './app.js'
import { log } from '@carlos-tzin/tzin/log'

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

serveBun(app, port)
log.info('Server started', { port, url: `http://localhost:${port}` })
