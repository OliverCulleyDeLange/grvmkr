import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

if (import.meta.env.PROD) {
	Sentry.init({
		dsn: 'https://a434935df6c5432eb0cb5342ef41cf7b@o4509434129809414.ingest.de.sentry.io/4509434131841104',

		tracesSampleRate: 1.0,

		// This sets the sample rate to be 10%. You may want this to be 100% while
		// in development and sample at a lower rate in production
		replaysSessionSampleRate: 0.1,

		// If the entire session is not sampled, use the below sample rate to sample
		// sessions when an error occurs.
		replaysOnErrorSampleRate: 1.0,

		// If you don't want to use Session Replay, just remove the line below:
		integrations: [replayIntegration()]
	});
}

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
