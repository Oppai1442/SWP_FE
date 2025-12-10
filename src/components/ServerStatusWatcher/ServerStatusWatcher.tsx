import { useCallback, useEffect, useRef, useState } from "react";

const REQUEST_TIMEOUT_MS = 5000;
const NORMAL_INTERVAL_MS = 600_000; // 10 phút
const ERROR_INTERVAL_MS = 30_000; // 30 giây

export const ServerStatusWatcher: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const statusUrlRef = useRef(
    `${(import.meta.env.VITE_API_URL?.trim() || "/api").replace(/\/$/, "")}/status`
  );

  const clearPingInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pingServer = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(statusUrlRef.current, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Unexpected response");
      setIsOffline(false);
    } catch (_err) {
      setIsOffline(true);
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const setupInterval = useCallback(
    (ms: number) => {
      clearPingInterval();
      intervalRef.current = window.setInterval(() => {
        if (!document.hidden) {
          void pingServer();
        }
      }, ms);
    },
    [pingServer]
  );

  useEffect(() => {
    void pingServer();
    setupInterval(NORMAL_INTERVAL_MS);

    const handleVisibility = () => {
      if (!document.hidden) {
        void pingServer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearPingInterval();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pingServer, setupInterval]);

  useEffect(() => {
    if (isOffline) {
      setupInterval(ERROR_INTERVAL_MS);
    } else {
      setDismissed(false);
      setupInterval(NORMAL_INTERVAL_MS);
    }
  }, [isOffline, setupInterval]);

  if (!isOffline || dismissed) return null;

  return (
    <></>
    // <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-live="assertive">
    //   <div className={styles.modal}>
    //     <div className={styles.content}>
    //       <p className={styles.title}>Server offline</p>
    //       <p className={styles.message}>Server offline, please contact web owner.</p>
    //       <p>0366862288</p>
    //     </div>
    //     <button
    //       type="button"
    //       className={styles.confirmButton}
    //       onClick={() => setDismissed(true)}
    //       autoFocus
    //     >
    //       Confirm
    //     </button>
    //   </div>
    // </div>
  );
};
