import { listen } from '@carlos-tzin/tzin'
import { app } from './app.js'

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

listen(app, port)
console.log(`Server running on http://localhost:${port}`)
