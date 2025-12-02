import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./ServerStatusWatcher.module.css";

const REQUEST_TIMEOUT_MS = 5000;
const CHECK_INTERVAL_MS = 30000;

const buildStatusUrl = () => {
  const base = (import.meta.env.VITE_API_URL?.trim() || "/api").replace(/\/$/, "");
  return `${base}/status`;
};

export const ServerStatusWatcher: React.FC = () => {
  const statusUrl = useMemo(buildStatusUrl, []);
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkStatus = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(statusUrl, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Unexpected status: ${response.status}`);
      }

      setIsOffline(false);
    } catch (error) {
      console.warn("Server status check failed", error);
      setIsOffline(true);
    } finally {
      clearTimeout(timeoutId);
    }
  }, [statusUrl]);

  useEffect(() => {
    let isMounted = true;

    const runCheck = () => {
      if (!isMounted) {
        return;
      }
      void checkStatus();
    };

    runCheck();
    const intervalId = window.setInterval(runCheck, CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [checkStatus]);

  useEffect(() => {
    if (!isOffline) {
      setDismissed((prev) => (prev ? false : prev));
    }
  }, [isOffline]);

  if (!isOffline || dismissed) {
    return null;
  }

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
