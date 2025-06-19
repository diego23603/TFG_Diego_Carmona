import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express): void {
  // Configurar opciones de sesión
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'tu_secreto_seguro_aqui',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 día
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar la estrategia de autenticación local
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Nombre de usuario incorrecto" });
        }
        
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Contraseña incorrecta" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialización y deserialización de usuarios
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Rutas de autenticación
  app.post("/api/auth/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar si el usuario ya existe
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Crear nuevo usuario
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Iniciar sesión automáticamente
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Excluir la contraseña de la respuesta
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    console.log("Intento de login:", req.body.username);
    
    passport.authenticate("local", (err: Error, user: UserType, info: any) => {
      if (err) {
        console.error("Error de autenticación:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Usuario no encontrado o credenciales inválidas");
        return res.status(401).json({ message: info.message || "Credenciales inválidas" });
      }
      
      console.log("Usuario autenticado correctamente:", user.id);
      
      req.login(user, (err) => {
        if (err) {
          console.error("Error al iniciar sesión:", err);
          return next(err);
        }
        
        // Excluir la contraseña de la respuesta
        const { password, ...userWithoutPassword } = user;
        console.log("Sesión iniciada correctamente, enviando respuesta");
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/auth/session", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      console.log("Session check: Usuario no autenticado");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Excluir la contraseña de la respuesta
    const { password, ...userWithoutPassword } = req.user as UserType;
    console.log("Session check: Usuario autenticado", userWithoutPassword.id);
    res.json(userWithoutPassword);
  });

  // Middleware para proteger rutas
  app.use("/api/protected/*", (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autorizado" });
    }
    next();
  });
}