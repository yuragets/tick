import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import './db.js' // opens the database and creates the schema on first import
import { projectsRouter } from './routes/projects.js'
import { entriesRouter } from './routes/entries.js'
import { runningRouter } from './routes/running.js'
import { stateRouter } from './routes/state.js'

const PORT = Number(process.env.PORT ?? 3001)

const app = express()

// Allow the Vite dev server (and future native app) to call the API.
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }))
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tick-server' })
})

app.use('/api/projects', projectsRouter)
app.use('/api/entries', entriesRouter)
app.use('/api/running', runningRouter)
app.use('/api', stateRouter)

// Central error handler — any thrown error becomes a clean 500.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[tick-server] error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`[tick-server] listening on http://localhost:${PORT}`)
})
