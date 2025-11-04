/// <reference types="vite/client" />

declare global {
	interface Window {
		getIdToken?: () => Promise<string | undefined>;
		copyIdToken?: () => Promise<void>;
	}
}

export {};
