import { Button } from "@devil-ai/ui/components/button"
import {
	CheckCircle2Icon,
	CircleAlertIcon,
	GithubIcon,
	Loader2Icon,
	ShieldCheckIcon,
	UserIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { SettingsSection } from "./settings-section"

// ============================================================
// Main component
// ============================================================

export function AccountSettings() {
	const navigate = useNavigate()
	const [user, setUser] = useState<any>(null)
	const [showPlans, setShowPlans] = useState(false)
	const [githubUser, setGithubUser] = useState<string | null>(null)
	const [validating, setValidating] = useState(true)
	const [subValid, setSubValid] = useState(false)
	const [subInfo, setSubInfo] = useState<any>(null)

	useEffect(() => {
		const stored = localStorage.getItem("devil-ai-user")
		if (stored) {
			try {
				const parsedUser = JSON.parse(stored)
				setUser(parsedUser)

				const token = localStorage.getItem("devil-ai-token")
				if (token && typeof window !== "undefined" && "devilAi" in window) {
					window.devilAi.validateSubscription(token).then((result: any) => {
						// If user is banned, redirect to banned page
						if (result.banned) {
							localStorage.removeItem("devil-ai-token")
							localStorage.removeItem("devil-ai-user")
							navigate({ to: "/banned" })
							return
						}
						setSubValid(result.valid)
						setSubInfo(result)
						setValidating(false)
						if (!result.valid) {
							setShowPlans(true)
							parsedUser.subscriptions = []
							localStorage.setItem("devil-ai-user", JSON.stringify(parsedUser))
						} else {
							setShowPlans(false)
							parsedUser.subscriptions = result.planId
								? [{ planId: result.planId, status: "ACTIVE", currentPeriodEnd: result.expiresAt }]
								: []
							localStorage.setItem("devil-ai-user", JSON.stringify(parsedUser))
						}
					}).catch(() => {
						setValidating(false)
						const hasCached = parsedUser?.subscriptions?.some((s: any) => s.status === "ACTIVE")
						setSubValid(!!hasCached)
						setShowPlans(!hasCached)
					})
				} else {
					setValidating(false)
					const hasCached = parsedUser?.subscriptions?.some((s: any) => s.status === "ACTIVE")
					setSubValid(!!hasCached)
					setShowPlans(!hasCached)
				}
			} catch {
				setValidating(false)
				setSubValid(false)
				setShowPlans(true)
			}
		} else {
			setValidating(false)
			setSubValid(false)
			setShowPlans(true)
		}

		// Check GitHub status
		const checkGithub = async () => {
			try {
				if (typeof window !== 'undefined' && window.devilAi?.githubActions) {
					const hasToken = await window.devilAi.githubActions.hasToken?.();
					if (hasToken?.hasToken) {
						const githubLogin = await window.devilAi.githubActions.getUser?.();
						if (githubLogin) {
							setGithubUser(githubLogin);
						}
					}
				}
			} catch (err) {}
		};
		checkGithub();
	}, [])

	const handleSignOut = async () => {
		localStorage.removeItem("devil-ai-token")
		localStorage.removeItem("devil-ai-user")
		localStorage.removeItem("devil-ai-sub-expired")
		
		if (typeof window !== "undefined" && window.devilAi && window.devilAi.credential) {
			try {
				await window.devilAi.credential.delete("subscription-token")
				await window.devilAi.credential.delete("sub-verify-token")
			} catch (e) {}
		}
		
		window.location.reload()
	}

	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center h-full space-y-4">
				<p className="text-muted-foreground">You are not logged in.</p>
				<Button onClick={() => (window.location.href = "#/login")}>Sign In</Button>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-xl font-semibold">
					{showPlans ? "Choose a Plan" : "Account"}
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					{showPlans
						? "Select a subscription plan to start using Devil-AI."
						: "Manage your subscription, profile, and connected accounts."}
				</p>
			</div>

			<ValidationBanner validating={validating} subValid={subValid} subInfo={subInfo} />

			<ProfileSection
				user={user}
				subValid={subValid}
				onSignOut={handleSignOut}
			/>

			{showPlans ? (
				<PlansSection onSubscribed={(planId, expiresAt) => {
					setSubValid(true)
					setSubInfo({ planId, expiresAt, valid: true })
					setShowPlans(false)
					user.subscriptions = [{ planId, status: "ACTIVE", currentPeriodEnd: expiresAt }]
					localStorage.setItem("devil-ai-user", JSON.stringify(user))
				}} />
			) : (
				<SubscriptionSection subInfo={subInfo} onUpgrade={() => setShowPlans(true)} />
			)}

			<ConnectedAccountsSection githubUser={githubUser} />
		</div>
	)
}

// ============================================================
// Validation banner
// ============================================================

function ValidationBanner({
	validating,
	subValid,
	subInfo,
}: {
	validating: boolean
	subValid: boolean
	subInfo: any
}) {
	if (validating) {
		return (
			<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
				<Loader2Icon aria-hidden="true" className="size-4 animate-spin text-primary" />
				<span className="text-sm text-muted-foreground">Validating subscription...</span>
			</div>
		)
	}

	if (!subValid) {
		return (
			<div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
				<CircleAlertIcon aria-hidden="true" className="size-4 text-destructive" />
				<div>
					<p className="text-sm font-medium text-destructive">No Active Subscription</p>
					<p className="text-xs text-muted-foreground">Subscribe to unlock all Devil-AI features.</p>
				</div>
			</div>
		)
	}

	if (subInfo?.daysRemaining !== undefined) {
		return (
			<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
				<ShieldCheckIcon aria-hidden="true" className="size-4 text-primary" />
				<div>
					<p className="text-sm font-medium">
						Active {subInfo.planId} Plan — {subInfo.daysRemaining} days remaining
					</p>
					<p className="text-xs text-muted-foreground">Subscription verified with server.</p>
				</div>
			</div>
		)
	}

	return null
}

// ============================================================
// Profile section
// ============================================================

function ProfileSection({
	user,
	subValid,
	onSignOut,
}: {
	user: any
	subValid: boolean
	onSignOut: () => void
}) {
	return (
		<SettingsSection>
			<div className="flex items-center justify-between gap-4 px-4 py-3">
				<div className="flex items-center gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<UserIcon aria-hidden="true" className="size-6" />
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">{user.name || "Developer"}</p>
						<p className="truncate text-sm text-muted-foreground">{user.email}</p>
						<div className="mt-1.5 flex items-center gap-2">
							<span
								className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
									subValid
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground"
								}`}
							>
								{subValid ? "Active Subscription" : "No Subscription"}
							</span>
						</div>
					</div>
				</div>
				<Button variant="outline" size="sm" onClick={onSignOut}>
					Sign Out
				</Button>
			</div>
		</SettingsSection>
	)
}

// ============================================================
// Subscription section (active)
// ============================================================

function SubscriptionSection({
	subInfo,
	onUpgrade,
}: {
	subInfo: any
	onUpgrade: () => void
}) {
	return (
		<SettingsSection title="Subscription">
			<div className="flex items-center justify-between gap-4 px-4 py-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{subInfo?.planId || "Pro Lifetime"}</p>
					<p className="text-sm text-muted-foreground">Unlimited access to Devil-AI features.</p>
					{subInfo?.daysRemaining !== undefined && (
						<p className="text-xs text-muted-foreground mt-1">
							Expires in {subInfo.daysRemaining} days
						</p>
					)}
				</div>
				<Button variant="outline" size="sm" onClick={onUpgrade}>
					Upgrade Plan
				</Button>
			</div>
		</SettingsSection>
	)
}

// ============================================================
// Plans section (no active subscription)
// ============================================================

function PlansSection({
	onSubscribed,
}: {
	onSubscribed: (planId: string, expiresAt: string) => void
}) {
	const [plans, setPlans] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [isProcessing, setIsProcessing] = useState(false)
	const [selectedPlan, setSelectedPlan] = useState<any>(null)
	
	const [couponCode, setCouponCode] = useState("")
	const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
	const [couponError, setCouponError] = useState("")
	const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

	const loadRazorpayScript = () => {
		return new Promise((resolve) => {
			if ((window as any).Razorpay) {
				resolve(true)
				return
			}
			const script = document.createElement("script")
			script.src = "https://checkout.razorpay.com/v1/checkout.js"
			script.onload = () => resolve(true)
			script.onerror = () => resolve(false)
			document.body.appendChild(script)
		})
	}

	const handleSubscribe = async (plan: any) => {
		if (isProcessing) return
		
		try {
			setIsProcessing(true)
			const stored = localStorage.getItem("devil-ai-user")
			if (!stored) throw new Error("Not logged in")
			const user = JSON.parse(stored)

			const res = await fetch("https://devil-ai.agribee.in/api/payments/create-order", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: user.id, planId: plan.slug, couponCode: appliedCoupon?.code || "" }),
			})
			
			const orderData = await res.json()
			
			if (!orderData.success) {
				throw new Error(orderData.error || "Failed to create order")
			}

			const isScriptLoaded = await loadRazorpayScript()
			if (!isScriptLoaded) {
				throw new Error("Razorpay SDK failed to load")
			}

			const options = {
				key: orderData.key_id,
				amount: orderData.amount,
				currency: orderData.currency,
				name: "Devil-AI",
				description: `Subscription for ${plan.name}`,
				order_id: orderData.order_id,
				handler: async function (response: any) {
					try {
						const verifyRes = await fetch("https://devil-ai.agribee.in/api/payments/verify", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								razorpay_order_id: response.razorpay_order_id,
								razorpay_payment_id: response.razorpay_payment_id,
								razorpay_signature: response.razorpay_signature,
								userId: user.id,
								planId: plan.slug,
								amount: orderData.amount,
								couponCode: appliedCoupon?.code || "",
							}),
						})
						
						const verifyData = await verifyRes.json()
						if (verifyData.success) {
							// Update local UI
							const expiresAt = new Date(Date.now() + plan.durationDays * 86400000).toISOString()
							onSubscribed(plan.slug, expiresAt)
						} else {
							alert("Payment verification failed: " + verifyData.error)
						}
					} catch (e: any) {
						alert("Error verifying payment: " + e.message)
					}
				},
				prefill: {
					name: user.name || "",
					email: user.email || "",
				},
				theme: {
					color: "#dc2626",
				},
			}

			const rzp = new (window as any).Razorpay(options)
			rzp.on("payment.failed", function (response: any) {
				alert(response.error.description || "Payment failed")
			})
			rzp.open()

		} catch (error: any) {
			alert(error.message)
		} finally {
			setIsProcessing(false)
		}
	}

	// Heartbeat to track online status
	useEffect(() => {
		const sendHeartbeat = () => {
			const stored = localStorage.getItem("devil-ai-user")
			if (stored && document.visibilityState === "visible") {
				try {
					const user = JSON.parse(stored)
					fetch("https://devil-ai.agribee.in/api/heartbeat", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email: user.email }),
					}).catch(() => {})
				} catch {}
			}
		}
		sendHeartbeat()
		const interval = setInterval(sendHeartbeat, 120000)
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		fetch("https://devil-ai.agribee.in/api/plans")
			.then(r => r.json())
			.then(data => { setPlans(data.plans || []); setLoading(false) })
			.catch(() => setLoading(false))
	}, [])

	const handleApplyCoupon = async () => {
		if (!couponCode.trim()) return
		setIsValidatingCoupon(true)
		setCouponError("")
		try {
			const res = await fetch("https://devil-ai.agribee.in/api/payments/validate-coupon", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: couponCode.trim() }),
			})
			const data = await res.json()
			if (data.success) {
				setAppliedCoupon(data)
			} else {
				setCouponError(data.error || "Invalid coupon")
				setAppliedCoupon(null)
			}
		} catch (e: any) {
			setCouponError("Failed to validate coupon")
			setAppliedCoupon(null)
		} finally {
			setIsValidatingCoupon(false)
		}
	}

	if (loading) {
		return (
			<SettingsSection title="Available Plans">
				<div className="px-4 py-8 text-center text-muted-foreground text-sm">Loading plans...</div>
			</SettingsSection>
		)
	}

	if (selectedPlan) {
		const originalPrice = Math.round(selectedPlan.price / 100)
		const discountRaw = appliedCoupon ? (originalPrice * appliedCoupon.discountPercentage) / 100 : 0
		const discountAmount = Math.round(discountRaw)
		const finalPrice = Math.max(1, originalPrice - discountAmount)

		return (
			<SettingsSection title="Secure Checkout">
				<div className="p-6">
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h3 className="text-xl font-bold">{selectedPlan.name}</h3>
							<p className="text-sm text-muted-foreground">Premium Subscription</p>
						</div>
						<Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)}>Change Plan</Button>
					</div>

					<div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl p-6 shadow-sm mb-6">
						<div className="flex justify-between py-3 border-b border-border/30">
							<span className="text-muted-foreground">Subtotal</span>
							<span className="font-medium">₹{originalPrice.toLocaleString()}</span>
						</div>
						
						{appliedCoupon && (
							<div className="flex justify-between py-3 border-b border-border/30 text-green-500">
								<span>Discount ({appliedCoupon.code})</span>
								<span>-₹{discountAmount}</span>
							</div>
						)}

						<div className="flex justify-between py-4 text-lg font-bold">
							<span>Total Pay</span>
							<span>₹{finalPrice}</span>
						</div>
					</div>

					<div className="mb-8">
						<label className="text-sm font-medium mb-2 block">Have a coupon code?</label>
						<div className="flex gap-2">
							<input
								type="text"
								value={couponCode}
								onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
								placeholder="Enter code here"
								className="flex-1 px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
								disabled={!!appliedCoupon}
							/>
							{appliedCoupon ? (
								<Button variant="outline" onClick={() => { setAppliedCoupon(null); setCouponCode("") }}>
									Remove
								</Button>
							) : (
								<Button variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode.trim() || isValidatingCoupon}>
									{isValidatingCoupon ? "Checking..." : "Apply"}
								</Button>
							)}
						</div>
						{couponError && <p className="text-xs text-destructive mt-2">{couponError}</p>}
						{appliedCoupon && <p className="text-xs text-green-500 mt-2">Coupon applied successfully! {appliedCoupon.discountPercentage}% off.</p>}
					</div>

					<Button
						className="w-full py-6 text-lg font-semibold shadow-lg hover:shadow-primary/20 transition-all bg-gradient-to-r from-primary to-primary/80"
						disabled={isProcessing}
						onClick={() => handleSubscribe(selectedPlan)}
					>
						{isProcessing ? "Processing..." : `Pay ₹${finalPrice} securely`}
					</Button>
				</div>
			</SettingsSection>
		)
	}

	return (
		<SettingsSection title="Available Plans">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-4">
				{plans.map((plan) => (
					<div
						key={plan.slug}
						className={`rounded-lg border p-6 flex flex-col ${
							plan.isBestValue ? "border-primary/50 bg-primary/5 relative" : "border-border"
						}`}
					>
						{plan.isBestValue && (
							<div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
								<span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
									Best Value
								</span>
							</div>
						)}
						<p className="text-sm font-medium">{plan.name}</p>
						<p className="text-2xl font-bold mt-2">
							{plan.priceDisplay}<span className="text-sm text-muted-foreground font-normal">/{plan.slug === "LIFETIME" ? "once" : plan.durationDays <= 7 ? "week" : plan.durationDays <= 30 ? "month" : "year"}</span>
						</p>
						<ul className="text-sm text-muted-foreground space-y-2 my-4 flex-1">
							{plan.features.map((f: string) => (
								<li key={f}>✓ {f}</li>
							))}
						</ul>
						<Button
							variant={plan.isBestValue ? "default" : "outline"}
							size="sm"
							disabled={isProcessing}
							onClick={() => setSelectedPlan(plan)}
						>
							Select {plan.name}
						</Button>
					</div>
				))}
				{plans.length === 0 && (
					<div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
						No plans available. Check back later.
					</div>
				)}
			</div>
		</SettingsSection>
	)
}

// ============================================================
// Connected accounts section
// ============================================================

function ConnectedAccountsSection({ githubUser }: { githubUser: string | null }) {
	const handleLinkGithub = () => {
		window.location.href = "#/github-actions";
	};

	return (
		<SettingsSection title="Connected Accounts">
			<div className="flex items-center justify-between gap-4 px-4 py-3">
				<div className="min-w-0">
					<p className="text-sm font-medium">GitHub Integration</p>
					<p className="text-sm text-muted-foreground">
						Link your GitHub to sync workspaces and commits.
					</p>
				</div>
				{githubUser ? (
					<div className="flex items-center gap-2 text-primary">
						<CheckCircle2Icon aria-hidden="true" className="size-4" />
						<span className="text-sm font-medium">Linked as {githubUser}</span>
					</div>
				) : (
					<Button
						variant="outline"
						size="sm"
						onClick={handleLinkGithub}
					>
						<GithubIcon aria-hidden="true" className="size-4" />
						Link GitHub
					</Button>
				)}
			</div>
		</SettingsSection>
	)
}
