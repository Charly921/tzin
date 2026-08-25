import { serveBun } from '@carlos-tzin/tzin'
import { app } from './app.js'

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

serveBun(app, port)
console.log(`Server running on http://localhost:${port}`)
