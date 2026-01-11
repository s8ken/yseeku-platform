import type { IUser } from '../models/user.model'

declare global {
  namespace Express {
    interface Request {
      user?: IUser
      userId?: string
      tenant?: string
      userTenant?: string
      userEmail?: string
      sessionId?: string
    }
  }
}

export {}
