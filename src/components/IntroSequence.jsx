import React, { useState, useEffect } from 'react';

export default function IntroSequence({ onComplete }) {
    const [step, setStep] = useState(1);
    const [scanText, setScanText] = useState("");
    const [fadingOut, setFadingOut] = useState(false);

    const handleNext = () => {
        setFadingOut(true);
        setTimeout(() => {
            setStep(prev => prev + 1);
            setFadingOut(false);
        }, 800); // Wait for fade out
    };

    // Transition Logic for Step 3
    useEffect(() => {
        if (step === 3) {
            const lines = [
                "Scanning sectors...",
                "Memories found in every quadrant.",
                "Destination: Earth."
            ];

            let currentLine = 0;
            let timer;

            const showNextLine = () => {
                if (currentLine < lines.length) {
                    setScanText(prev => prev + (prev ? "\n" : "") + lines[currentLine]);
                    currentLine++;
                    // Delay between lines
                    timer = setTimeout(showNextLine, 1500);
                } else {
                    // All lines shown, wait a bit then complete
                    timer = setTimeout(onComplete, 2000);
                }
            };

            showNextLine();

            return () => clearTimeout(timer);
        }
    }, [step, onComplete]);

    return (
        <div className="cosmic-container">
            {/* Background Stars/Nebula Effect */}
            <div className="stars"></div>
            <div className="twinkling"></div>
            <div className="nebula"></div>

            <div className={`content-wrapper ${fadingOut ? 'fade-out' : 'fade-in'}`}>

                {step === 1 && (
                    <div className="intro-card">
                        <h1 className="glow-text title-large">Welcome to the<br /><span className="cosmic-text">Cosmic Story</span></h1>
                        <div className="pulse-button-wrapper" onClick={handleNext}>
                            <div className="rocket-icon">🚀</div>
                            <button className="cosmic-button">Let's Start</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="intro-card">
                        <h2 className="glow-text subtitle">Accessing the Paridhi Nebula...</h2>
                        <p className="glow-text subtitle-small">Please confirm your identity.</p>

                        <div className="planet-button-wrapper" onClick={handleNext}>
                            <div className="planet-icon">🪐</div>
                            <button className="cosmic-button">Yes, I am</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="terminal-wrapper">
                        <pre className="terminal-text">
                            {scanText}
                            <span className="blinking-cursor">|</span>
                        </pre>
                    </div>
                )}

            </div>
        </div>
    );
}
