import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { getStore } from "./store";
import { Tenant, TenantType, User, UserRole } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

interface TokenPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}

export function createTenant(name: string, type: TenantType): Tenant {
  const now = new Date().toISOString();
  const tenant: Tenant = {
    id: uuid(),
    name,
    type,
    createdAt: now,
  };
  getStore().tenants.push(tenant);
  return tenant;
}

export async function createUser(
  email: string,
  password: string,
  role: UserRole,
  tenantId: string
): Promise<User> {
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: uuid(),
    email,
    passwordHash,
    role,
    tenantId,
    createdAt: now,
  };
  getStore().users.push(user);
  return user;
}

export function generateToken(user: User) {
  const payload: TokenPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
}

export async function verifyCredentials(email: string, password: string) {
  const user = getStore().users.find((u) => u.email === email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export interface AuthenticatedRequest extends Request {
  user?: User & { token: TokenPayload };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "Missing authorization header" });
  }
  const [, token] = header.split(" ");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = getStore().users.find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = Object.assign({}, user, { token: payload });
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return function (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}
