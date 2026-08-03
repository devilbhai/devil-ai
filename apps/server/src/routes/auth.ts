import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { Hono } from "hono"
import { createMiddleware } from "hono/factory"
import { sign } from "hono/jwt"
import nodemailer from "nodemailer"

const auth = new Hono()
const prisma = new PrismaClient()

if (!process.env.JWT_SECRET) {
	throw new Error(
		"FATAL: JWT_SECRET environment variable is required. Refusing to start without it.",
	)
}
const JWT_SECRET = process.env.JWT_SECRET

function isValidEmail(email: string): boolean {
	return (
		typeof email === "string" &&
		email.length >= 5 &&
		email.length <= 254 &&
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	)
}

export const authMiddleware = createMiddleware(async (c, next) => {
	const header = c.req.header("Authorization")
	if (!header?.startsWith("Bearer ")) {
		return c.json({ error: "Missing or invalid Authorization header" }, 401)
	}
	const token = header.slice(7)
	try {
		const { verify } = await import("hono/jwt")
		const payload = await verify(token, JWT_SECRET)
		c.set("jwtPayload", payload)
		await next()
	} catch {
		return c.json({ error: "Invalid or expired token" }, 401)
	}
})

auth.post("/signup", async (c) => {
	try {
		const { email, password, name } = await c.req.json()

		if (!isValidEmail(email)) {
			return c.json({ message: "Invalid email format" }, 400)
		}
		if (typeof password !== "string" || password.length < 8) {
			return c.json({ message: "Password must be at least 8 characters" }, 400)
		}
		if (typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
			return c.json({ message: "Invalid name" }, 400)
		}

		const existing = await prisma.user.findUnique({ where: { email } })
		if (existing) {
			return c.json({ message: "User already exists" }, 400)
		}

		const salt = await bcrypt.genSalt(10)
		const passwordHash = await bcrypt.hash(password, salt)

		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				name: name.trim(),
				role: "USER",
				status: "ACTIVE",
			},
		})

		const token = await sign(
			{ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
			JWT_SECRET,
		)

		return c.json({ token, user: { id: user.id, email: user.email, name: user.name } })
	} catch (_error) {
		return c.json({ message: "Internal server error" }, 500)
	}
})

auth.post("/login", async (c) => {
	try {
		const { email, password } = await c.req.json()

		if (!isValidEmail(email)) {
			return c.json({ message: "Invalid email format" }, 400)
		}

		const user = await prisma.user.findUnique({ where: { email } })
		if (!user) {
			return c.json({ message: "Invalid credentials" }, 401)
		}

		const isMatch = await bcrypt.compare(password, user.passwordHash)
		if (!isMatch) {
			return c.json({ message: "Invalid credentials" }, 401)
		}

		if (user.status === "BANNED") {
			return c.json({ message: "Account is banned. Please contact support." }, 403)
		}

		const token = await sign(
			{ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
			JWT_SECRET,
		)

		return c.json({ token, user: { id: user.id, email: user.email, name: user.name } })
	} catch (_error) {
		return c.json({ message: "Internal server error" }, 500)
	}
})

// ==========================================
// Forgot Password Flow
// ==========================================

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.gmail.com",
	port: Number(process.env.SMTP_PORT) || 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
})

auth.post("/forgot-password", async (c) => {
	try {
		const { email } = await c.req.json()

		if (!isValidEmail(email)) {
			return c.json({ message: "Invalid email format" }, 400)
		}

		const user = await prisma.user.findUnique({ where: { email } })
		if (!user) {
			// Don't reveal if user exists or not for security
			return c.json({ success: true, message: "If an account exists, a reset code has been sent." })
		}

		if (user.status === "BANNED") {
			return c.json({ message: "Account is banned" }, 403)
		}

		// Generate 6 digit code
		const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
		// Expiry 15 minutes from now
		const resetCodeExpiry = new Date(Date.now() + 15 * 60000)

		await prisma.user.update({
			where: { email },
			data: { resetCode, resetCodeExpiry },
		})

		const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - Devil AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0d0d0d; padding: 40px 0;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" max-width="600" style="background-color: #1a1a24; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <tr>
                        <td align="center" style="padding: 40px 0 20px 0;">
                            <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); width: 64px; height: 64px; border-radius: 16px; display: inline-block; text-align: center; line-height: 64px; font-weight: bold; font-size: 32px; color: white; box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);">⚡</div>
                            <h1 style="margin: 24px 0 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">Reset Your Password</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #9ca3af; text-align: center;">
                                We received a request to reset the password for your Devil AI account. Enter the 6-digit code below to set a new password.
                            </p>
                            
                            <div style="background-color: #000000; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ef4444;">${resetCode}</div>
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; line-height: 21px; color: #6b7280; text-align: center;">
                                This code will expire in 15 minutes.<br>If you didn't request a password reset, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 24px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05);">
                            <p style="margin: 0; font-size: 12px; color: #4b5563;">
                                &copy; ${new Date().getFullYear()} Devil AI. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

		await transporter.sendMail({
			from: `"Devil AI" <${process.env.SMTP_USER || "no-reply@agribee.in"}>`,
			to: email,
			subject: "Password Reset Code - Devil AI",
			html: htmlEmail,
		})

		return c.json({ success: true, message: "Reset code sent successfully" })
	} catch (error) {
		console.error("Forgot password error:", error)
		return c.json({ message: "Internal server error" }, 500)
	}
})

auth.post("/verify-reset-code", async (c) => {
	try {
		const { email, code } = await c.req.json()

		if (!isValidEmail(email) || !code || code.length !== 6) {
			return c.json({ message: "Invalid request" }, 400)
		}

		const user = await prisma.user.findUnique({ where: { email } })
		if (!user) {
			return c.json({ message: "Invalid code or email" }, 400)
		}

		if (user.resetCode !== code) {
			return c.json({ message: "Invalid reset code" }, 400)
		}

		if (!user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
			return c.json({ message: "Reset code has expired" }, 400)
		}

		return c.json({ success: true, message: "Code verified" })
	} catch (error) {
		return c.json({ message: "Internal server error" }, 500)
	}
})

auth.post("/reset-password", async (c) => {
	try {
		const { email, code, newPassword } = await c.req.json()

		if (
			!isValidEmail(email) ||
			!code ||
			code.length !== 6 ||
			typeof newPassword !== "string" ||
			newPassword.length < 8
		) {
			return c.json(
				{ message: "Invalid request data. Password must be at least 8 characters." },
				400,
			)
		}

		const user = await prisma.user.findUnique({ where: { email } })
		if (!user) {
			return c.json({ message: "Invalid request" }, 400)
		}

		if (user.resetCode !== code || !user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
			return c.json({ message: "Invalid or expired reset code" }, 400)
		}

		const salt = await bcrypt.genSalt(10)
		const passwordHash = await bcrypt.hash(newPassword, salt)

		const updatedUser = await prisma.user.update({
			where: { email },
			data: {
				passwordHash,
				resetCode: null,
				resetCodeExpiry: null,
			},
		})

		const token = await sign(
			{
				id: updatedUser.id,
				role: updatedUser.role,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
			},
			JWT_SECRET,
		)

		return c.json({
			success: true,
			token,
			user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name },
		})
	} catch (error) {
		return c.json({ message: "Internal server error" }, 500)
	}
})

export default auth
