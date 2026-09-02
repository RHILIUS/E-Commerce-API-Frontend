import { useEffect, useState } from "react";

const calculateRemainingSeconds = (endsAt: number | null) => {
  if (!endsAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
};

export const useCountdown = (endsAt: number | null) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(endsAt),
  );

  useEffect(() => {
    const updateCountdown = () => {
      const nextRemainingSeconds = calculateRemainingSeconds(endsAt);

      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0) {
        window.clearInterval(intervalId);
      }
    };

    // Update immediately when the supplied deadline changes.
    const timeoutId = window.setTimeout(updateCountdown, 0);
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [endsAt]);

  return remainingSeconds;
};
