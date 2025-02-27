import express, { json, urlencoded, Response } from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import session, { SessionOptions } from 'express-session'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '@/swagger/definition.json'
import { errorHandler } from '@/middleware/error'
import { notFoundHandler } from '@/middleware/notfound'
import { logHandler } from '@/middleware/log'
import { router } from './routes'
import { SERVER_CONFIG, SESSION_CONFIG } from '@/utils/config'
import pgSession from 'connect-pg-simple'
import { getDbPool } from './utils/db'

const app = express()

// configure express app
app.use(helmet())
app.use(json())
app.use(urlencoded({ extended: true }))
app.use(logHandler)

const ALLOWED_ORIGINS = [
  'https://api.devcon.org',
  'https://app.devcon.org',
  'https://archive.devcon.org',
  'https://devcon.org',
  'https://dev--devcon-app.netlify.app',
  'http://localhost:3000',
  'https://meerkat.events',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // Allow requests with no origin (like mobile apps, curl, etc)
        return callback(null, true)
      }

      if (ALLOWED_ORIGINS.includes(origin) || SERVER_CONFIG.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        console.warn('BLOCKED by CORS:', origin)
        // callback(null, true) // allow for now. Need to define proper list of origins
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
)

const pgSessionStore = pgSession(session)
const sessionConfig: SessionOptions = {
  name: SESSION_CONFIG.cookieName,
  secret: SESSION_CONFIG.password,
  cookie: {},
  resave: false,
  saveUninitialized: false,
  store: new pgSessionStore({
    pool: getDbPool(),
    tableName: 'Session',
    ttl: 30 * 24 * 60 * 60,
  }),
}

if (SERVER_CONFIG.NODE_ENV === 'production') {
  sessionConfig.cookie = {
    ...sessionConfig.cookie,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    domain: '.devcon.org',
    partitioned: true,
  }

  sessionConfig.proxy = true
  app.set('trust proxy', 1)
}
app.use(session(sessionConfig))

// static endpoints
app.use('/static', express.static(path.join(__dirname, '..', 'public')))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// add routes before error handlers
app.use(router)

// add handlers after routes
app.use(errorHandler)
app.use(notFoundHandler)

export default app
