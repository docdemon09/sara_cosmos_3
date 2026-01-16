import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, Html, Sparkles, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';

// --- Configuration ---
// Simple data: radius (distance from sun), speed (orbit speed), size (scale), color
const PLANETS = [
    { name: "Mercury", radius: 6, speed: 1.5, size: 0.5, color: "#b5a7a7" },
    { name: "Venus", radius: 9, speed: 1.2, size: 0.9, color: "#e3bb76" },
    { name: "Earth", radius: 13, speed: 1.0, size: 1.0, color: "#22ffaa" },
    { name: "Mars", radius: 17, speed: 0.8, size: 0.7, color: "#ff4400" },
    { name: "Jupiter", radius: 25, speed: 0.5, size: 3.5, color: "#d9ae89" },
    { name: "Saturn", radius: 35, speed: 0.4, size: 3.0, color: "#f4d03f", ring: true },
    { name: "Uranus", radius: 45, speed: 0.3, size: 2.0, color: "#aaddff" },
    { name: "Neptune", radius: 55, speed: 0.2, size: 2.0, color: "#3366ff" }
];

// Specific order: Visit all others first, END at Earth.
// Indies: Mercury(0), Venus(1), Mars(3), Jupiter(4), Saturn(5), Uranus(6), Neptune(7), Earth(2)
const VISIT_ORDER = [0, 1, 3, 4, 5, 6, 7, 2];

const POLAROID_IMAGES = Array.from({ length: 8 }, (_, i) => `https://picsum.photos/seed/${i + 400}/300/350`);

// --- Assets ---
const PEN_IMAGE = "https://cdn-icons-png.flaticon.com/512/286/286539.png";

// --- Components ---

function Sun() {
    return (
        <group>
            <mesh>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshBasicMaterial color="#ffcc00" />
            </mesh>
            <pointLight intensity={2} distance={100} decay={2} color="#ffaa00" />
        </group>
    );
}

// Global Ref to track planet positions for the shuttle to find them
const planetRefs = {};

function Planet({ planet, index }) {
    const meshRef = useRef();
    // Random start angle so they aren't all in a line
    const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.getElapsedTime();
            // Orbit Logic
            const angle = startAngle + t * planet.speed * 0.2;
            const x = Math.cos(angle) * planet.radius;
            const z = Math.sin(angle) * planet.radius;

            // "Alive" Animation: Bobbing up and down
            const y = Math.sin(t * 1.5 + index) * 0.5;

            meshRef.current.position.set(x, y, z);

            // Self Rotation (Faster)
            meshRef.current.rotation.y += 0.02;

            // Update global ref for shuttle tracking
            if (!planetRefs[index]) planetRefs[index] = new THREE.Vector3();
            planetRefs[index].copy(meshRef.current.position);
        }
    });

    return (
        <group ref={meshRef}>
            <mesh>
                <sphereGeometry args={[planet.size, 32, 32]} />
                <meshStandardMaterial color={planet.color} />
            </mesh>

            {/* Simple Ring for Saturn */}
            {planet.ring && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[planet.size * 1.4, planet.size * 2.2, 32]} />
                    <meshBasicMaterial color="#cba" side={THREE.DoubleSide} transparent opacity={0.6} />
                </mesh>
            )}

            <Text
                position={[0, planet.size + 1, 0]}
                fontSize={planet.size * 0.8}
                color="white"
                anchorX="center"
                anchorY="bottom"
            >
                {planet.name}
            </Text>
        </group>
    );
}

function OrbitPath({ radius }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.1} transparent side={THREE.DoubleSide} />
        </mesh>
    );
}

function SpaceShuttle({ position, rotation }) {
    return (
        <group position={position} rotation={rotation}>
            <Trail width={1} length={8} color={new THREE.Color(0, 1, 1)} attenuation={(t) => t * t}>
                {/* Body */}
                <mesh rotation={[0, 0, -Math.PI / 2]}>
                    <cylinderGeometry args={[0.3, 0.5, 1.5, 16]} />
                    <meshStandardMaterial color="white" />
                </mesh>
            </Trail>

            {/* Nose */}
            <mesh position={[1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.3, 0.6, 16]} />
                <meshStandardMaterial color="black" />
            </mesh>
            {/* Wings */}
            <mesh position={[-0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[0.8, 0.1, 2]} />
                <meshStandardMaterial color="white" />
            </mesh>
            {/* Engine Glow */}
            <group position={[-1, 0, 0]}>
                <pointLight color="cyan" distance={3} intensity={2} />
                <Sparkles count={20} scale={2} color="cyan" size={2} speed={0.5} opacity={0.5} />
            </group>
        </group>
    );
}

function PhotoPopup({ planetName, index }) {
    const handleImageError = (e) => {
        const currentSrc = e.target.src;
        // Logic: jpeg -> jpg -> png -> placeholder
        if (currentSrc.endsWith('.jpeg')) {
            e.target.src = `/memories/${planetName.toLowerCase()}.jpg`;
        } else if (currentSrc.endsWith('.jpg')) {
            e.target.src = `/memories/${planetName.toLowerCase()}.png`;
        } else {
            e.target.onerror = null; // Stop infinite loop
            e.target.src = POLAROID_IMAGES[index];
        }
    };

    return (
        <Html center position={[0, 0, 0]} zIndexRange={[100, 0]}>
            <div className="polaroid-container" style={{ animation: 'popIn 0.8s forwards' }}>
                <div className="polaroid-photo">
                    <img
                        src={`/memories/${planetName.toLowerCase()}.jpeg`}
                        onError={handleImageError}
                        alt={planetName}
                    />
                </div>
                <div className="polaroid-caption">
                    <p>Memories at {planetName}</p>
                </div>
            </div>
        </Html>
    );
}

function FallingFlowers() {
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
                    position: 'absolute', top: '-50px', left: f.left, fontSize: f.fontSize,
                    animation: `fall ${f.animationDuration} linear ${f.animationDelay} infinite`, opacity: 0.8
                }}>🌸</div>
            ))}
        </div>
    );
}

function VintageLetter({ visible }) {
    const [text, setText] = useState("");
    const fullText = `Happy Birthday Sara!
May this year be filled with all the joys and happiness.
Thankyou for motivating me , thankyou for everything,
wish you all the best for your boards

Sayan (정신박약자 사얀)
段家旭`;
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        if (visible && charIndex < fullText.length) {
            const timeout = setTimeout(() => {
                setText(prev => prev + fullText[charIndex]);
                setCharIndex(prev => prev + 1);
            }, 50); // Speed up slightly for longer text
            return () => clearTimeout(timeout);
        }
    }, [visible, charIndex]);

    if (!visible) return null;

    // Converted to Standard DOM (absolute positioned over canvas)
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)' }} />
            <div className="torn-paper" style={{
                width: '600px', minHeight: '400px',
                background: `#f4e4bc url('https://www.transparenttextures.com/patterns/aged-paper.png')`,
                padding: '60px', fontFamily: "'Indie Flower', cursive", fontSize: '2rem', color: '#2c1e12',
                position: 'relative', opacity: 1, transform: 'rotate(-1deg)', boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}>
                <FallingFlowers />
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', position: 'relative', zIndex: 2 }}>
                    {text}
                    {charIndex < fullText.length && (
                        <img src={PEN_IMAGE} className="floating-pen" style={{
                            width: '60px', position: 'absolute', display: 'inline-block',
                            marginLeft: '10px', transform: 'rotate(-135deg) translateY(-10px)', filter: 'drop-shadow(5px 5px 5px rgba(0,0,0,0.4))'
                        }} />
                    )}
                </div>
            </div>
        </div>
    );
}

function TourController({ started, onFinale }) {
    const { camera } = useThree();
    const shuttleRef = useRef(new THREE.Vector3(0, 0, 10)); // Start near 0
    const [shuttlePos, setShuttlePos] = useState(new THREE.Vector3(0, 0, 10));
    const [shuttleRot, setShuttleRot] = useState(new THREE.Euler(0, 0, 0));

    // Track target position for the Guide Line
    const [guideTarget, setGuideTarget] = useState(null);

    const [step, setStep] = useState(0); // Index in VISIT_ORDER
    const [mode, setMode] = useState('IDLE'); // IDLE, FLYING, VISITING, FINALE

    const visitTimer = useRef(null);

    useFrame((state, delta) => {
        if (!started || mode === 'FINALE') return;

        // If Step is beyond array, we are done
        if (step >= VISIT_ORDER.length) {
            if (mode !== 'FINALE') {
                setMode('FINALE');
                onFinale();
            }
            return;
        }

        const targetPlanetIdx = VISIT_ORDER[step];
        const targetPos = planetRefs[targetPlanetIdx];

        if (!targetPos) return; // Wait for planet to initialize

        if (mode === 'IDLE') setMode('FLYING');

        // Update guide target for line rendering
        setGuideTarget(targetPos.clone());

        if (mode === 'FLYING') {
            const currentPos = shuttleRef.current;
            const dist = currentPos.distanceTo(targetPos);

            // Move towards planet - SLOWER Speed
            const speed = 5;
            const dir = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();

            if (dist > 3) { // Stop slightly further way
                const moveAmount = dir.multiplyScalar(speed * delta);
                currentPos.add(moveAmount);

                // Rotation (Look at target)
                // calculated simple LookAt manually or use dummy object
                const dummy = new THREE.Object3D();
                dummy.position.copy(currentPos);
                dummy.lookAt(targetPos);
                setShuttleRot(dummy.rotation);

                // Update Camera to follow shuttle
                const camOffset = new THREE.Vector3(-12, 6, 0).applyEuler(dummy.rotation); // Slightly further camera
                const camPos = currentPos.clone().add(camOffset);
                camera.position.lerp(camPos, 2 * delta); // Slower camera lerp
                camera.lookAt(targetPos);

            } else {
                // Arrived
                setMode('VISITING');

                // Start timer to leave
                visitTimer.current = setTimeout(() => {
                    setStep(prev => prev + 1);
                    setMode('FLYING');
                }, 5000); // 5 seconds viewing time (more relaxed)
            }

            setShuttlePos(currentPos.clone());
        }

        if (mode === 'VISITING') {
            // Keep shuttle near planet (it's moving!)
            // Actually, let's latch it to the planetRef?
            // For simplicity, we just hover at the position we arrived at,
            // or let the next FLYING frame catch up.
            // But if planet moves away, we should follow lightly?
            // Let's just Hover in place relative to the screenshot moment.

            // Camera slightly rotates around planet?
            // Just look at planet
            const pPos = planetRefs[targetPlanetIdx];
            camera.lookAt(pPos);
        }
    });

    return (
        <>
            {mode !== 'FINALE' && (
                <>
                    <SpaceShuttle position={shuttlePos} rotation={shuttleRot} />
                    {/* Guide Ray */}
                    {mode === 'FLYING' && guideTarget && (
                        <Line
                            points={[shuttlePos, guideTarget]}
                            color="cyan"
                            lineWidth={1}
                            dashScale={2}
                            dashSize={1}
                            dashed
                            transparent
                            opacity={0.5}
                        />
                    )}
                </>
            )}

            {mode === 'VISITING' && (
                <group position={shuttlePos}>
                    <PhotoPopup
                        planetName={PLANETS[VISIT_ORDER[step]].name}
                        index={VISIT_ORDER[step]}
                    />
                </group>
            )}
        </>
    );
}


export default function CelestialScene({ autoStart = false, onFinale }) {
    // We can just use the prop directly or sync it if we wanted internal control, 
    // but the requirement implies the flow triggers it.
    // However, we still need 'finale' state for the letter.
    const [finale, setFinale] = useState(false);

    // If autoStart is true, the tour is active.
    const started = autoStart;

    const handleFinale = () => {
        setFinale(true);
        if (onFinale) onFinale();
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
            <Canvas camera={{ position: [0, 20, 40], fov: 60 }}>
                {!started && <OrbitControls makeDefault minDistance={10} maxDistance={100} />}

                <ambientLight intensity={0.2} />
                <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade />

                <Sun />

                {PLANETS.map((p, i) => (
                    <React.Fragment key={i}>
                        <Planet planet={p} index={i} />
                        <OrbitPath radius={p.radius} />
                    </React.Fragment>
                ))}

                {started && (
                    <TourController started={started} onFinale={handleFinale} />
                )}

            </Canvas>

            {/* Finale Overlay Over Canvas */}
            {finale && <VintageLetter visible={true} />}
        </div>
    );
}
