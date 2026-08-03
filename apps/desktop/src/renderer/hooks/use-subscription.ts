import { useEffect, useState } from 'react';

// Shared state to avoid multiple polling intervals across component instances
let sharedIsActive = true;
let sharedDetails: { planId: string | null; expiresAt: string | null } = { planId: null, expiresAt: null };
let pollInterval: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;
const listeners = new Set<() => void>();

function checkStatus() {
	const isExpired = localStorage.getItem('devil-ai-sub-expired') === 'true';
	if (isExpired) {
		sharedIsActive = false;
		notifyListeners();
		return;
	}

	const userStr = localStorage.getItem('devil-ai-user');
	if (userStr) {
		try {
			const user = JSON.parse(userStr);
			const hasActivePlan = user.subscriptions && user.subscriptions.some(
				(sub: { status: string }) => sub.status === "ACTIVE" || sub.status === "active"
			);
			if (!hasActivePlan) {
				sharedIsActive = false;
			} else {
				sharedIsActive = true;
				if (isExpired) {
					localStorage.removeItem('devil-ai-sub-expired');
				}
			}

			const activeSub = user.subscriptions?.find(
				(sub: { status: string }) => sub.status === "ACTIVE" || sub.status === "active"
			);
			if (activeSub) {
				sharedDetails = { planId: activeSub.planId, expiresAt: activeSub.currentPeriodEnd || activeSub.expiresAt };
			} else {
				sharedDetails = { planId: null, expiresAt: null };
			}
		} catch {
			// Malformed JSON, keep previous state
		}
	}
	notifyListeners();
}

function notifyListeners() {
	for (const listener of listeners) {
		listener();
	}
}

function startPolling() {
	if (pollInterval) return;
	pollInterval = setInterval(checkStatus, 15000);
	window.addEventListener('storage', checkStatus);
}

function stopPolling() {
	if (pollInterval) {
		clearInterval(pollInterval);
		pollInterval = null;
	}
	window.removeEventListener('storage', checkStatus);
}

export function useSubscriptionStatus() {
	const [isActive, setIsActive] = useState(sharedIsActive);

	useEffect(() => {
		subscriberCount++;
		if (subscriberCount === 1) startPolling();

		const listener = () => setIsActive(sharedIsActive);
		listeners.add(listener);

		return () => {
			listeners.delete(listener);
			subscriberCount--;
			if (subscriberCount === 0) stopPolling();
		};
	}, []);

	return isActive;
}

export function useSubscriptionDetails() {
	const [details, setDetails] = useState(sharedDetails);

	useEffect(() => {
		subscriberCount++;
		if (subscriberCount === 1) startPolling();

		const listener = () => setDetails(sharedDetails);
		listeners.add(listener);

		return () => {
			listeners.delete(listener);
			subscriberCount--;
			if (subscriberCount === 0) stopPolling();
		};
	}, []);

	return details;
}
