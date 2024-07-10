import { useEffect, useState } from "react";
const calculateRemainingTime = (countdownEnd) => {
    const now = new Date();
    const end = new Date(countdownEnd);
    return Math.max(Math.floor((end - now) / 1000), 0);
};

const CountdownTimer = ({ countdownEnd, onCountdownEnd }) => {
    const [secondsLeft, setSecondsLeft] = useState(calculateRemainingTime(countdownEnd));

    useEffect(() => {
        const interval = setInterval(() => {
            const seconds = calculateRemainingTime(countdownEnd);
            if (seconds <= 0) {
                clearInterval(interval);
                onCountdownEnd();
            } else {
                setSecondsLeft(seconds);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [countdownEnd, onCountdownEnd]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!countdownEnd || new Date(countdownEnd) <= new Date()) {
        return null;
    }

    return (
        <p>Cooling down... Wait for: {formatTime(secondsLeft)}</p>
    );
};

export default CountdownTimer;
