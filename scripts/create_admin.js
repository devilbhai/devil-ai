const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const prisma = new PrismaClient()

async function main() {
	const email = "gunjan@agribee.in"
	const password = "DevilBhai@1010"
	const salt = await bcrypt.genSalt(10)
	const passwordHash = await bcrypt.hash(password, salt)

	await prisma.user.upsert({
		where: { email },
		update: {
			passwordHash,
			role: "ADMIN",
			status: "ACTIVE",
		},
		create: {
			email,
			passwordHash,
			name: "Gunjan (Admin)",
			role: "ADMIN",
			status: "ACTIVE",
		},
	})
	console.log("Admin user created/updated successfully with bcrypt")
}
main()
	.catch(console.error)
	.finally(() => prisma.$disconnect())
