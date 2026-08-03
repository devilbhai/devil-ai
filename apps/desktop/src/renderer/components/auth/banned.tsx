/**
 * BannedPage — Full-screen "You Are Banned" page.
 *
 * Shown when the admin bans a user. This page blocks all access
 * to the app — the user cannot use any email on this device.
 * They must contact the developer to get unbanned.
 */

import { useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"

export function BannedPage() {
	const navigate = useNavigate()

	const handleSignOut = useCallback(() => {
		localStorage.removeItem("devil-ai-token")
		localStorage.removeItem("devil-ai-user")
		localStorage.removeItem("devil-ai-device-id")
		navigate({ to: "/login" })
	}, [navigate])

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a0a 50%, #0a0a0f 100%)",
				fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
				padding: "24px",
				overflow: "hidden",
				position: "relative",
			}}
		>
			{/* Animated background particles */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					overflow: "hidden",
					pointerEvents: "none",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: "20%",
						left: "10%",
						width: "300px",
						height: "300px",
						borderRadius: "50%",
						background: "radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)",
						filter: "blur(40px)",
						animation: "pulse 4s ease-in-out infinite",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: "20%",
						right: "10%",
						width: "250px",
						height: "250px",
						borderRadius: "50%",
						background: "radial-gradient(circle, rgba(220,38,38,0.1) 0%, transparent 70%)",
						filter: "blur(40px)",
						animation: "pulse 4s ease-in-out infinite 2s",
					}}
				/>
			</div>

			{/* Main card */}
			<div
				style={{
					position: "relative",
					maxWidth: "520px",
					width: "100%",
					textAlign: "center",
					background: "rgba(18, 18, 26, 0.8)",
					backdropFilter: "blur(20px)",
					WebkitBackdropFilter: "blur(20px)",
					border: "1px solid rgba(220, 38, 38, 0.2)",
					borderRadius: "24px",
					padding: "48px 40px",
					boxShadow: "0 0 80px rgba(220, 38, 38, 0.1), 0 25px 50px rgba(0,0,0,0.5)",
				}}
			>
				{/* Shield icon */}
				<div
					style={{
						width: "80px",
						height: "80px",
						margin: "0 auto 24px",
						borderRadius: "50%",
						background: "linear-gradient(135deg, rgba(220,38,38,0.2), rgba(220,38,38,0.05))",
						border: "2px solid rgba(220,38,38,0.3)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						animation: "pulse 2s ease-in-out infinite",
					}}
				>
					<svg
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#dc2626"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
				</div>

				{/* Title */}
				<h1
					style={{
						fontSize: "28px",
						fontWeight: "800",
						color: "#fff",
						marginBottom: "8px",
						letterSpacing: "-0.02em",
					}}
				>
					Account{" "}
					<span
						style={{
							background: "linear-gradient(135deg, #dc2626, #f97316)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							backgroundClip: "text",
						}}
					>
						Banned
					</span>
				</h1>

				{/* Subtitle */}
				<p
					style={{
						fontSize: "14px",
						color: "rgba(255,255,255,0.4)",
						marginBottom: "32px",
						textTransform: "uppercase",
						letterSpacing: "0.1em",
						fontWeight: "600",
					}}
				>
					Access Revoked by Developer
				</p>

				{/* Divider */}
				<div
					style={{
						height: "1px",
						background: "linear-gradient(90deg, transparent, rgba(220,38,38,0.3), transparent)",
						marginBottom: "32px",
					}}
				/>

				{/* Message */}
				<p
					style={{
						fontSize: "15px",
						color: "rgba(255,255,255,0.6)",
						lineHeight: "1.7",
						marginBottom: "32px",
					}}
				>
					Your account has been permanently suspended due to a violation of our
					terms of service. This device has been blocked from accessing Devil AI.
				</p>

				{/* Info box */}
				<div
					style={{
						background: "rgba(220, 38, 38, 0.05)",
						border: "1px solid rgba(220, 38, 38, 0.15)",
						borderRadius: "12px",
						padding: "16px 20px",
						marginBottom: "32px",
						textAlign: "left",
					}}
				>
					<p
						style={{
							fontSize: "13px",
							color: "rgba(255,255,255,0.5)",
							lineHeight: "1.6",
						}}
					>
						<strong style={{ color: "rgba(255,255,255,0.7)" }}>What does this mean?</strong>
						<br />
						• You cannot use Devil AI on this device with any account
						<br />
						• All active subscriptions have been cancelled
						<br />
						• Your data remains safe but inaccessible
					</p>
				</div>

				{/* Contact support */}
				<p
					style={{
						fontSize: "13px",
						color: "rgba(255,255,255,0.4)",
						marginBottom: "24px",
					}}
				>
					If you believe this is an error, contact{" "}
					<span style={{ color: "#dc2626", fontWeight: "600" }}>support@devil-ai.com</span>
				</p>

				{/* Sign out button */}
				<button
					type="button"
					onClick={handleSignOut}
					style={{
						width: "100%",
						padding: "14px 24px",
						background: "linear-gradient(135deg, #dc2626, #b91c1c)",
						color: "#fff",
						border: "none",
						borderRadius: "12px",
						fontSize: "14px",
						fontWeight: "600",
						cursor: "pointer",
						transition: "all 0.3s ease",
						letterSpacing: "0.02em",
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.background = "linear-gradient(135deg, #ef4444, #dc2626)"
						e.currentTarget.style.transform = "translateY(-1px)"
						e.currentTarget.style.boxShadow = "0 8px 25px rgba(220,38,38,0.3)"
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.background = "linear-gradient(135deg, #dc2626, #b91c1c)"
						e.currentTarget.style.transform = "translateY(0)"
						e.currentTarget.style.boxShadow = "none"
					}}
				>
					Sign Out
				</button>

				{/* Version */}
				<p
					style={{
						marginTop: "24px",
						fontSize: "11px",
						color: "rgba(255,255,255,0.2)",
					}}
				>
					Devil AI • Security System v2.0
				</p>
			</div>

			{/* CSS animation */}
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; transform: scale(1); }
					50% { opacity: 0.7; transform: scale(1.05); }
				}
			`}</style>
		</div>
	)
}
