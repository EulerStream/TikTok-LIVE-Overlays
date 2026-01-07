import type { ConnectionStatus as Status } from "../hooks/useWebcastConnection";

interface ConnectionStatusProps {
  status: Status;
  error: string | null;
  retryCountdown: number;
  onRetry: () => void;
}

export function ConnectionStatus({
  status,
  error,
  retryCountdown,
  onRetry,
}: ConnectionStatusProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {status === "connecting" && (
          <>
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-purple-500" />
            <p className="text-lg text-gray-400">Connecting...</p>
          </>
        )}

        {status === "offline" && (
          <>
            <div className="mb-4 text-4xl">📡</div>
            <p className="mb-2 text-lg text-gray-300">
              Waiting for stream to go live
            </p>
            <p className="text-sm text-gray-500">
              Retrying in {retryCountdown}s
            </p>
            <button
              onClick={onRetry}
              className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
            >
              Retry Now
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-4 text-4xl">⚠️</div>
            <p className="mb-2 text-lg text-red-400">{error}</p>
            {retryCountdown > 0 && (
              <p className="text-sm text-gray-500">
                Retrying in {retryCountdown}s
              </p>
            )}
            <button
              onClick={onRetry}
              className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
