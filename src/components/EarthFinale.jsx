import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

// Assets
const EARTH_TEXTURE = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
// const PAPER_TEXTURE = "https://www.transparenttextures.com/patterns/aged-paper.png"; // CSS background pattern used instead
const PAPER_TEXTURE = ""; // Handled in CSS/Inline style logic now slightly differently or just empty string to trigger fallback color
// A nice "torn edge" mask or frame can be done via CSS, but for now we'll use a style hack.

const PEN_IMAGE = "https://cdn-icons-png.flaticon.com/512/286/286539.png"; // Fountain pen icon

function FallingFlowers() {
    // Create random flower particles
    const flowers = useMemo(() => {
        return Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            animationDuration: 3 + Math.random() * 5 + 's',
            animationDelay: Math.random() * 2 + 's',
            fontSize: 20 + Math.random() * 20 + 'px'
        }));
    }, []);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
            {flowers.map(f => (
                <div key={f.id} style={{
                    position: 'absolute',
                    top: '-50px',
                    left: f.left,
                    fontSize: f.fontSize,
                    animation: `fall ${f.animationDuration} linear ${f.animationDelay} infinite`,
                    opacity: 0.8
                }}>
                    🌸
                </div>
            ))}
        </div>
    );
}

function ManuscriptOverlay({ visible }) {
    const [text, setText] = useState("");
    const fullText = "Demo from Sayan";
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        if (visible && charIndex < fullText.length) {
            const timeout = setTimeout(() => {
                setText(prev => prev + fullText[charIndex]);
                setCharIndex(prev => prev + 1);
            }, 100); // Typing speed
            return () => clearTimeout(timeout);
        }
    }, [visible, charIndex]);

    if (!visible) return null;

    return (
        <Html fullscreen style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            {/* Dark overlay backdrop */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)' }} />

            {/* Torn Paper Container */}
            <div className="torn-paper" style={{
                width: '600px',
                minHeight: '400px',
                background: `#f4e4bc url('https://www.transparenttextures.com/patterns/aged-paper.png')`,
                padding: '60px',
                fontFamily: "'Indie Flower', cursive",
                fontSize: '2rem',
                color: '#2c1e12',
                position: 'relative',
                opacity: visible ? 1 : 0,
                transition: 'opacity 2s ease-in',
                transform: 'rotate(-1deg)',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                // CSS for Torn Edges created in index.css
            }}>

                <FallingFlowers />

                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', position: 'relative', zIndex: 2 }}>
                    {text}
                    {/* Pen following the text (Simplified visual approximation) */}
                    {charIndex < fullText.length && (
                        <img
                            src={PEN_IMAGE}
                            className="floating-pen"
                            style={{
                                width: '60px',
                                position: 'absolute',
                                // Logic to position pen at end of text is complex in DOM, 
                                // we will float it near the cursor or just generic animation
                                display: 'inline-block',
                                marginLeft: '10px',
                                transform: 'rotate(-135deg) translateY(-10px)',
                                filter: 'drop-shadow(5px 5px 5px rgba(0,0,0,0.4))'
                            }}
                        />
                    )}
                </div>
            </div>
        </Html>
    );
}

export default function EarthFinale({ active }) {
    const earthRef = useRef();
    const groupRef = useRef();
    const { camera } = useThree();
    const [zoomState, setZoomState] = useState(0); // 0: Idle, 1: Rotate, 2: Zoom India, 3: Over

    // Load textures
    const [colorMap] = useTexture([EARTH_TEXTURE]);

    // Coordinates for India/Delhi (Rough spherical conversion)
    // Lat 28 N, Long 77 E
    // In 3D sphere coords (Y is up, Z is front):
    // We need to rotate the earth so this point faces the camera (0, 0, distance)
    const targetRotation = useMemo(() => {
        // Rotation logic:
        // Y rotation to match Longitude.
        // X rotation (tilt) to match Latitude.
        return {
            y: -1.7, // Approx rotation to bring India to front
            x: 0.5   // Tilt down slightly
        };
    }, []);

    useEffect(() => {
        if (active) {
            // Sequence manager
            // Start rotating
            setZoomState(1);

            setTimeout(() => {
                // Start Zooming to India
                setZoomState(2);
            }, 4000); // After 4s rotation

            setTimeout(() => {
                // Show Manuscript
                setZoomState(3);
            }, 7000); // 3s zoom
        }
    }, [active]);

    useFrame((state, delta) => {
        // 1. Rotation Phase
        if (active && zoomState === 1 && earthRef.current) {
            earthRef.current.rotation.y += 0.5 * delta; // Spin fast initially
        }

        // 2. Zoom to India Phase
        if (zoomState === 2 && earthRef.current) {
            // Slow rotation to target
            earthRef.current.rotation.y = THREE.MathUtils.lerp(earthRef.current.rotation.y, targetRotation.y, 2 * delta);
            earthRef.current.rotation.x = THREE.MathUtils.lerp(earthRef.current.rotation.x, targetRotation.x, 2 * delta);

            // Move Camera in
            const currentPos = camera.position;
            const targetPos = new THREE.Vector3(0, 0, 3.5); // Close up

            currentPos.lerp(targetPos, 1.5 * delta);
            camera.lookAt(0, 0, 0);
        }
    });

    return (
        <group ref={groupRef} visible={active}>
            <mesh ref={earthRef} position={[0, 0, 0]}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshStandardMaterial
                    map={colorMap}
                    roughness={0.5}
                    metalness={0.1}
                />
            </mesh>

            {/* Start at zoomState 3 implies manuscript is visible */}
            <ManuscriptOverlay visible={zoomState === 3} />
        </group>
    );
}
