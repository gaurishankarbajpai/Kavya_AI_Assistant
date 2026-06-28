const teachMenuBtn = document.getElementById('teachMenuBtn');
const closeMemoryBtn = document.getElementById('closeMemoryBtn');
const memoryPanel = document.getElementById('memoryPanel');
const factInput = document.getElementById('factInput');
const addFactBtn = document.getElementById('addFactBtn');
const memoryList = document.getElementById('memoryList');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');
const charContainer = document.getElementById('characterContainer');
const kavyaSubtitle = document.getElementById('kavyaSubtitle');
const userSubtitle = document.getElementById('userSubtitle');

const SERVER_URL = 'http://localhost:5000';

let learningIndicator = null;
let lastLearnedFact = null;

// ===== 3D VRM ENGINE SETUP =====
let currentVrm = null;
let currentMixer = null;
const clock = new THREE.Clock();

// Three.js Scene Setup
const canvas = document.getElementById('vrmCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();

// Camera — full body view, slightly closer for bigger model
const camera = new THREE.PerspectiveCamera(32.0, canvas.clientWidth / canvas.clientHeight, 0.1, 20.0);
camera.position.set(0.0, 1.0, 2.6);
camera.lookAt(0.0, 0.85, 0.0);

// Lighting — minimal! MToon shader self-shades, external lights wash it white
const keyLight = new THREE.DirectionalLight(0xffffff, 0.15);
keyLight.position.set(1.5, 2.5, 2.0);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xddeeff, 0.08);
fillLight.position.set(-1.5, 1.0, 1.5);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xffccee, 0.05);
rimLight.position.set(0.0, 1.5, -2.0);
scene.add(rimLight);
const ambient = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambient);

// Load VRM Model
const loader = new THREE.GLTFLoader();
loader.register((parser) => new THREE_VRM.VRMLoaderPlugin(parser));

loader.load(
    'assets/kavya.vrm',
    (gltf) => {
        const vrm = gltf.userData.vrm;
        scene.add(vrm.scene);
        currentVrm = vrm;

        // VRM0 models face -Z by default. rotateVRM0 flips to face +Z (toward camera).
        // Do NOT also set rotation.y = Math.PI — that causes double-rotation (facing back).
        if (THREE_VRM.VRMUtils && typeof THREE_VRM.VRMUtils.rotateVRM0 === 'function') {
            THREE_VRM.VRMUtils.rotateVRM0(vrm);
        } else {
            // Fallback only if rotateVRM0 not available
            vrm.scene.rotation.y = Math.PI;
        }

        // Lower arms from T-pose to natural rest pose (hands by sides)
        if (vrm.humanoid) {
            const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
            const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
            const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
            const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');

            if (leftUpperArm)  leftUpperArm.rotation.z  = -1.5;  // arm hanging down naturally
            if (rightUpperArm) rightUpperArm.rotation.z =  1.5;
            if (leftLowerArm)  leftLowerArm.rotation.z  = -0.05;
            if (rightLowerArm) rightLowerArm.rotation.z =  0.05;
        }

        console.log('✅ VRM Loaded successfully — facing forward!');

        // Hide loading text so the avatar shows clearly
        const subtitle = document.getElementById('kavyaSubtitle');
        if (subtitle) {
            subtitle.textContent = "Kavya is ready!";
            setTimeout(() => { subtitle.style.display = 'none'; }, 2000);
        }
    },
    (progress) => console.log('Loading VRM...', (100.0 * progress.loaded / progress.total).toFixed(1) + '%'),
    (error) => console.error('❌ VRM Load Error:', error)
);

// ===== SMOOTH MOUSE TRACKING =====
let mouseX = 0, mouseY = 0;
let smoothHeadX = 0, smoothHeadY = 0;
let smoothBodyX = 0;

// ===== REALISTIC BLINK ENGINE =====
// Real humans blink every 3-7 seconds, each blink ~150ms
let nextBlinkTime = 2.0;
let blinkPhase = 0; // 0=open, 1=closing, 2=opening
let blinkProgress = 0;
const BLINK_SPEED = 12.0;

function updateBlink(delta, elapsed) {
    if (blinkPhase === 0) {
        if (elapsed >= nextBlinkTime) { blinkPhase = 1; blinkProgress = 0; }
        return 0;
    } else if (blinkPhase === 1) {
        blinkProgress += delta * BLINK_SPEED;
        if (blinkProgress >= 1.0) { blinkProgress = 1.0; blinkPhase = 2; }
        return blinkProgress;
    } else {
        blinkProgress -= delta * BLINK_SPEED;
        if (blinkProgress <= 0) {
            blinkProgress = 0; blinkPhase = 0;
            nextBlinkTime = elapsed + 2.0 + Math.random() * 4.0;
            if (Math.random() < 0.2) nextBlinkTime = elapsed + 0.3; // 20% double-blink
        }
        return blinkProgress;
    }
}

// ===== RENDER LOOP =====
// Smooth lerp helper
function lerp(current, target, speed) { return current + (target - current) * speed; }

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;
    const lerpSpeed = Math.min(delta * 4.0, 0.15); // smooth interpolation

    if (currentVrm && currentVrm.humanoid) {
        // --- Get bone references ---
        const head = currentVrm.humanoid.getNormalizedBoneNode('head');
        const spine = currentVrm.humanoid.getNormalizedBoneNode('spine');
        const leftUpperArm = currentVrm.humanoid.getNormalizedBoneNode('leftUpperArm');
        const rightUpperArm = currentVrm.humanoid.getNormalizedBoneNode('rightUpperArm');
        const leftLowerArm = currentVrm.humanoid.getNormalizedBoneNode('leftLowerArm');
        const rightLowerArm = currentVrm.humanoid.getNormalizedBoneNode('rightLowerArm');
        const leftShoulder = currentVrm.humanoid.getNormalizedBoneNode('leftShoulder');
        const rightShoulder = currentVrm.humanoid.getNormalizedBoneNode('rightShoulder');

        // --- NATURAL BLINK ---
        const blinkVal = updateBlink(delta, elapsed);
        if (currentVrm.expressionManager) {
            currentVrm.expressionManager.setValue('blink', blinkVal);
        }

        // --- BREATHING ---
        const breathCycle = Math.sin(elapsed * 1.57) * 0.003;
        currentVrm.scene.position.y = breathCycle;
        if (leftShoulder) leftShoulder.rotation.z = Math.sin(elapsed * 1.57) * 0.008;
        if (rightShoulder) rightShoulder.rotation.z = -Math.sin(elapsed * 1.57) * 0.008;

        // --- SMOOTH BODY POSE INTERPOLATION (driven by emotion) ---
        const bp = emotionBodyPose;

        // Base target from emotion pose
        let targetHeadX = bp.headX;
        let targetHeadY = bp.headY;
        let targetHeadZ = bp.headZ;
        let targetSpineX = bp.spineX;
        let targetSpineZ = bp.spineZ;

        // --- PER-EMOTION MICRO-ANIMATIONS ---
        const em = currentEmotion;

        if (em === 'angry') {
            // Angry: body shakes/trembles
            targetHeadX += Math.sin(elapsed * 15) * 0.02;
            targetHeadZ += Math.sin(elapsed * 12) * 0.015;
            targetSpineX += Math.sin(elapsed * 10) * 0.01;
        } else if (em === 'excited') {
            // Excited: bouncy energy
            currentVrm.scene.position.y += Math.abs(Math.sin(elapsed * 6)) * 0.012;
            targetHeadZ += Math.sin(elapsed * 4) * 0.04;
        } else if (em === 'happy' || em === 'caring') {
            // Happy: gentle head tilt sway
            targetHeadZ += Math.sin(elapsed * 1.5) * 0.03;
            targetSpineZ += Math.sin(elapsed * 1.2) * 0.01;
        } else if (em === 'sad') {
            // Sad: slow drooping sway
            targetHeadX += Math.sin(elapsed * 0.5) * 0.02;
            currentVrm.scene.position.y += -0.005; // slight droop
        } else if (em === 'miss') {
            // Miss: slow longing sway
            targetHeadZ += Math.sin(elapsed * 0.8) * 0.04;
            targetSpineZ += Math.sin(elapsed * 0.6) * 0.015;
        } else if (em === 'sulk') {
            // Sulk: head turned away, slight pout movement
            targetHeadY += Math.sin(elapsed * 0.7) * 0.03;
        } else if (em === 'jealous') {
            // Jealous: tapping foot feeling, slight agitation
            targetHeadZ += Math.sin(elapsed * 3) * 0.02;
            targetSpineZ += Math.sin(elapsed * 5) * 0.008;
        } else if (em === 'worry') {
            // Worry: fidgeting
            targetHeadX += Math.sin(elapsed * 2.5) * 0.02;
            targetHeadZ += Math.sin(elapsed * 3.5) * 0.015;
        } else if (em === 'romantic') {
            // Romantic: gentle dreamy lean
            targetHeadZ += Math.sin(elapsed * 0.9) * 0.04;
            targetSpineZ += Math.sin(elapsed * 0.7) * 0.02;
        } else if (em === 'naughty') {
            // Naughty: playful head bob
            targetHeadZ += Math.sin(elapsed * 2.0) * 0.035;
            targetHeadY += Math.sin(elapsed * 1.5) * 0.02;
        } else if (em === 'blush') {
            // Blush: shy shrinking
            targetHeadX += 0.03;
            targetHeadZ += Math.sin(elapsed * 1.0) * 0.02;
        } else if (em === 'proud') {
            // Proud: chest out, slight swagger
            targetSpineX += -0.02;
            targetHeadZ += Math.sin(elapsed * 1.0) * 0.02;
        } else {
            // Idle: subtle natural sway
            const sway = Math.sin(elapsed * 0.4) * 0.004 + Math.sin(elapsed * 0.7) * 0.002;
            currentVrm.scene.position.x = sway;
            targetHeadZ += Math.sin(elapsed * 0.3) * 0.015;
        }

        // Apply smoothed bone rotations
        if (head) {
            head.rotation.x = lerp(head.rotation.x, targetHeadX, lerpSpeed);
            head.rotation.y = lerp(head.rotation.y, targetHeadY, lerpSpeed);
            head.rotation.z = lerp(head.rotation.z, targetHeadZ, lerpSpeed);
        }
        if (spine) {
            spine.rotation.x = lerp(spine.rotation.x, targetSpineX, lerpSpeed);
            spine.rotation.z = lerp(spine.rotation.z, targetSpineZ, lerpSpeed);
        }
        if (leftUpperArm) leftUpperArm.rotation.z = lerp(leftUpperArm.rotation.z, bp.leftArmZ, lerpSpeed);
        if (rightUpperArm) rightUpperArm.rotation.z = lerp(rightUpperArm.rotation.z, bp.rightArmZ, lerpSpeed);
        if (leftLowerArm) leftLowerArm.rotation.z = lerp(leftLowerArm.rotation.z, bp.leftForearmZ, lerpSpeed);
        if (rightLowerArm) rightLowerArm.rotation.z = lerp(rightLowerArm.rotation.z, bp.rightForearmZ, lerpSpeed);

        // --- LIP SYNC ---
        if (currentVrm.expressionManager) {
            if (window.audioAnalyzer && isSpeaking) {
                const data = new Uint8Array(window.audioAnalyzer.frequencyBinCount);
                window.audioAnalyzer.getByteFrequencyData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) sum += data[i];
                let vol = (sum / data.length) / 100.0;
                const mouthTarget = Math.min(vol * 1.8, 1.0);
                const currentMouth = currentVrm.expressionManager.getValue('aa') || 0;
                currentVrm.expressionManager.setValue('aa', currentMouth + (mouthTarget - currentMouth) * 0.3);
            } else if (isSpeaking && !window.audioAnalyzer) {
                const base = Math.max(0, Math.sin(elapsed * 12));
                const variation = Math.sin(elapsed * 7) * 0.3;
                currentVrm.expressionManager.setValue('aa', Math.min((base + variation) * 0.7, 1.0));
            } else {
                const cur = currentVrm.expressionManager.getValue('aa') || 0;
                currentVrm.expressionManager.setValue('aa', cur * 0.85);
            }
        }

        // Head nods slightly when speaking (on top of emotion pose)
        if (isSpeaking && head) {
            head.rotation.x += Math.sin(elapsed * 4) * 0.012;
            head.rotation.z += Math.sin(elapsed * 2.5) * 0.008;
        }

        currentVrm.update(delta);
    }
    renderer.render(scene, camera);
}
animate();

// Handle Resizing
window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});

// Mouse position for smooth tracking - disabled per user request
document.addEventListener('mousemove', (e) => {
    // Disabled: mouseX = ... mouseY = ...
});

// ===== EMOTION ENGINE — FULL BODY + FACE =====
let isSpeaking = false;
let currentEmotion = 'idle';

// Target body pose per emotion (smoothly interpolated in render loop)
let emotionBodyPose = {
    headX: 0, headY: 0, headZ: 0,
    spineX: 0, spineZ: 0,
    leftArmZ: -1.5, rightArmZ: 1.5,
    leftForearmZ: -0.05, rightForearmZ: 0.05
};

const EMOTION_POSES = {
    idle:     { headX: 0, headY: 0, headZ: 0, spineX: 0, spineZ: 0, leftArmZ: -1.5, rightArmZ: 1.5, leftForearmZ: -0.05, rightForearmZ: 0.05 },
    happy:    { headX: -0.08, headY: 0, headZ: 0.05, spineX: -0.03, spineZ: 0, leftArmZ: -1.3, rightArmZ: 1.3, leftForearmZ: -0.15, rightForearmZ: 0.15 },
    excited:  { headX: -0.1, headY: 0, headZ: 0.08, spineX: -0.05, spineZ: 0, leftArmZ: -1.0, rightArmZ: 1.0, leftForearmZ: -0.3, rightForearmZ: 0.3 },
    caring:   { headX: -0.12, headY: 0, headZ: 0.1, spineX: -0.04, spineZ: 0.02, leftArmZ: -1.35, rightArmZ: 1.35, leftForearmZ: -0.1, rightForearmZ: 0.1 },
    proud:    { headX: -0.1, headY: 0, headZ: 0, spineX: -0.06, spineZ: 0, leftArmZ: -1.35, rightArmZ: 1.35, leftForearmZ: -0.08, rightForearmZ: 0.08 },
    angry:    { headX: 0.1, headY: 0, headZ: 0, spineX: 0.04, spineZ: 0, leftArmZ: -1.2, rightArmZ: 1.2, leftForearmZ: -0.3, rightForearmZ: 0.3 },
    sulk:     { headX: 0.15, headY: 0.1, headZ: -0.1, spineX: 0.06, spineZ: -0.03, leftArmZ: -1.5, rightArmZ: 1.5, leftForearmZ: -0.1, rightForearmZ: 0.1 },
    jealous:  { headX: 0.05, headY: -0.15, headZ: -0.08, spineX: 0.03, spineZ: -0.02, leftArmZ: -1.4, rightArmZ: 1.4, leftForearmZ: -0.15, rightForearmZ: 0.15 },
    sad:      { headX: 0.2, headY: 0, headZ: 0.05, spineX: 0.08, spineZ: 0, leftArmZ: -1.55, rightArmZ: 1.55, leftForearmZ: -0.03, rightForearmZ: 0.03 },
    miss:     { headX: 0.15, headY: 0.08, headZ: 0.08, spineX: 0.05, spineZ: 0.02, leftArmZ: -1.45, rightArmZ: 1.45, leftForearmZ: -0.08, rightForearmZ: 0.08 },
    worry:    { headX: 0.1, headY: 0, headZ: -0.05, spineX: 0.04, spineZ: 0, leftArmZ: -1.35, rightArmZ: 1.35, leftForearmZ: -0.2, rightForearmZ: 0.2 },
    romantic: { headX: -0.1, headY: 0.12, headZ: 0.12, spineX: -0.03, spineZ: 0.03, leftArmZ: -1.4, rightArmZ: 1.4, leftForearmZ: -0.1, rightForearmZ: 0.1 },
    naughty:  { headX: -0.05, headY: -0.1, headZ: 0.1, spineX: -0.02, spineZ: -0.03, leftArmZ: -1.3, rightArmZ: 1.3, leftForearmZ: -0.15, rightForearmZ: 0.15 },
    blush:    { headX: 0.12, headY: 0.1, headZ: 0.08, spineX: 0.03, spineZ: 0.02, leftArmZ: -1.45, rightArmZ: 1.45, leftForearmZ: -0.08, rightForearmZ: 0.08 },
};

function changeEmotion(emotion) {
    if (!currentVrm) return;
    if (!emotion) emotion = 'idle';
    emotion = emotion.toLowerCase();
    currentEmotion = emotion;

    // Reset all face expressions
    const presets = ['happy', 'angry', 'sad', 'relaxed', 'surprised', 'neutral'];
    presets.forEach(p => currentVrm.expressionManager.setValue(p, 0));

    // --- FACE EXPRESSIONS (multi-blend for richer looks) ---
    if (emotion === 'happy' || emotion === 'caring') {
        currentVrm.expressionManager.setValue('happy', 1.0);
    } else if (emotion === 'excited') {
        currentVrm.expressionManager.setValue('happy', 0.8);
        currentVrm.expressionManager.setValue('surprised', 0.4);
    } else if (emotion === 'proud') {
        currentVrm.expressionManager.setValue('happy', 0.6);
    } else if (emotion === 'angry') {
        currentVrm.expressionManager.setValue('angry', 1.0);
    } else if (emotion === 'sulk') {
        currentVrm.expressionManager.setValue('angry', 0.6);
        currentVrm.expressionManager.setValue('sad', 0.3);
    } else if (emotion === 'jealous') {
        currentVrm.expressionManager.setValue('angry', 0.7);
        currentVrm.expressionManager.setValue('sad', 0.2);
    } else if (emotion === 'sad') {
        currentVrm.expressionManager.setValue('sad', 1.0);
    } else if (emotion === 'miss') {
        currentVrm.expressionManager.setValue('sad', 0.7);
        currentVrm.expressionManager.setValue('relaxed', 0.3);
    } else if (emotion === 'worry') {
        currentVrm.expressionManager.setValue('sad', 0.5);
        currentVrm.expressionManager.setValue('surprised', 0.3);
    } else if (emotion === 'romantic') {
        currentVrm.expressionManager.setValue('relaxed', 0.8);
        currentVrm.expressionManager.setValue('happy', 0.3);
    } else if (emotion === 'naughty') {
        currentVrm.expressionManager.setValue('happy', 0.5);
        currentVrm.expressionManager.setValue('relaxed', 0.5);
    } else if (emotion === 'blush') {
        currentVrm.expressionManager.setValue('relaxed', 1.0);
    }

    // --- TARGET BODY POSE (smoothly animated in render loop) ---
    const pose = EMOTION_POSES[emotion] || EMOTION_POSES.idle;
    Object.assign(emotionBodyPose, pose);
}

function setSpeaking(speaking) {
    isSpeaking = speaking;
}

// ===== LEARNING INDICATOR =====
function showLearningIndicator(text) {
    if (!learningIndicator) {
        learningIndicator = document.createElement('div');
        learningIndicator.id = 'learningIndicator';
        learningIndicator.style.cssText = `
            position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.75); border: 1px solid #a855f7;
            color: #d8b4fe; padding: 8px 20px; border-radius: 20px;
            font-size: 0.78rem; z-index: 9998; text-align: center;
            backdrop-filter: blur(10px); letter-spacing: 0.5px;
            box-shadow: 0 0 12px rgba(168,85,247,0.4);
            transition: opacity 0.4s ease;
            display: flex; align-items: center; gap: 8px;
        `;
        document.body.appendChild(learningIndicator);
    }
    learningIndicator.style.opacity = '1';
    learningIndicator.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#a855f7;animation:micPulse 1s infinite alternate;"></span> ${text}`;
    learningIndicator.style.display = 'flex';
}

function hideLearningIndicator() {
    if (learningIndicator) {
        learningIndicator.style.opacity = '0';
        setTimeout(() => { if (learningIndicator) learningIndicator.style.display = 'none'; }, 400);
    }
}

function showLearnedFact(fact) {
    showLearningIndicator(`🧠 Seekh liya: "${fact.replace('[Kavya ne khud seekha] ', '')}"`);
    setTimeout(hideLearningIndicator, 5000);
}

// ===== AUTO-LEARN (background call after every chat) =====
async function autoLearnInBackground(userMsg, kavyaMsg) {
    // Skip for very short messages (saves quota)
    if (userMsg.trim().split(/\s+/).length < 5) return;
    showLearningIndicator('🧠 Kavya seekh rahi hai...');
    try {
        const res = await fetch(`${SERVER_URL}/api/auto-learn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_msg: userMsg, kavya_msg: kavyaMsg })
        });
        const data = await res.json();
        if (data.new_facts && data.new_facts.length > 0) {
            lastLearnedFact = data.new_facts[0];
            showLearningIndicator(`✅ Yaad kar liya: "${lastLearnedFact}" (Quota: ${data.quota_left || 'N/A'})`);
            setTimeout(hideLearningIndicator, 4000);
            fetchMemory(); // refresh memory panel
        } else {
            hideLearningIndicator();
        }
    } catch (e) {
        hideLearningIndicator();
    }
}

// ===== CURIOSITY ENGINE (silent self-learning) =====
async function runCuriosityEngine() {
    console.log('[Curiosity] Kavya is exploring something new...');
    showLearningIndicator('💡 Kavya kuch naya explore kar rahi hai...');
    try {
        const res = await fetch(`${SERVER_URL}/api/curiosity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        });
        const data = await res.json();
        if (data.status === 'success' && data.fact) {
            showLearnedFact(data.fact);
            fetchMemory();
            // Just show indicator, DON'T make Kavya talk to herself
        } else {
            hideLearningIndicator();
        }
    } catch (e) {
        hideLearningIndicator();
        console.error('[Curiosity] Error:', e);
    }
}

// Run curiosity engine every 45 MINUTES (silent learning only)
setInterval(runCuriosityEngine, 45 * 60 * 1000);
// Also run once after 10 minutes of startup
setTimeout(runCuriosityEngine, 10 * 60 * 1000);

// ===== PROACTIVE & ROUTINE ENGINE =====
let lastInteractionTime = Date.now();
let routineStatus = { breakfast: false, lunch: false, tea: false, dinner: false };

function checkRoutinesAndIdle() {
    if (isSpeaking || isRecording || isBusy) return; // Don't interrupt active conversation

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    // Reset routines at midnight
    if (h === 0) {
        routineStatus = { breakfast: false, lunch: false, tea: false, dinner: false };
    }

    // BREAKFAST: ~9 AM
    if (h === 9 && !routineStatus.breakfast) {
        routineStatus.breakfast = true;
        sendToKavya("[SYSTEM EVENT: It's morning. Remind me to have my breakfast. Keep it loving and max 1 sentence.]");
        return;
    }
    // LUNCH: ~1 PM
    if (h === 13 && !routineStatus.lunch) {
        routineStatus.lunch = true;
        sendToKavya("[SYSTEM EVENT: It's 1 PM. Ask me lovingly if I have eaten my lunch. Max 1 sentence.]");
        return;
    }
    // TEA: ~5 PM
    if (h === 17 && !routineStatus.tea) {
        routineStatus.tea = true;
        sendToKavya("[SYSTEM EVENT: It's 5 PM. Remind me to drink my favorite Tea! DONT say system event. Max 1 sentence.]");
        return;
    }
    // DINNER: 8:00 PM
    if (h === 20 && !routineStatus.dinner) {
        routineStatus.dinner = true;
        sendToKavya("[SYSTEM EVENT: It is 8:00 PM! Time for my dinner. Demand that I eat food now. Max 1 sentence.]");
        return;
    }

    // IDLE CHECK: Only after 2 HOURS of no interaction (don't spam)
    if (Date.now() - lastInteractionTime > 2 * 60 * 60 * 1000) {
        lastInteractionTime = Date.now(); // reset to avoid spam
        sendToKavya("[SYSTEM EVENT: We haven't talked for a while. Lovingly check up on me. Max 1 sentence.]");
    }
}
// Check every 2 minutes (was 1 min — reduce load)
setInterval(checkRoutinesAndIdle, 2 * 60 * 1000);

// ===== MEMORY =====
async function fetchMemory() {
    try {
        const res = await fetch(`${SERVER_URL}/api/memory`);
        const data = await res.json();
        renderMemory(data);
    } catch (e) { console.error('Memory fetch err:', e); }
}

function renderMemory(facts) {
    // Stats
    const selfLearned = facts.filter(f => f.startsWith('[Kavya ne khud seekha]')).length;
    const autoLearned = facts.filter((f, i) => i >= 10 && !f.startsWith('[Kavya ne khud seekha]')).length;
    const core = facts.length - selfLearned - autoLearned;

    let statsHtml = `
        <div class="memory-stats">
            <span><span class="stat-dot" style="background:#00f0ff"></span>${core} Core</span>
            <span><span class="stat-dot" style="background:#00bfff"></span>${autoLearned} Conversation</span>
            <span><span class="stat-dot" style="background:#a855f7"></span>${selfLearned} Self-Learned</span>
        </div>
    `;

    memoryList.innerHTML = statsHtml;
    facts.forEach((fact, i) => {
        const isSelfLearned = fact.startsWith('[Kavya ne khud seekha]');
        const isAutoLearned = i >= 10 && !isSelfLearned;
        const displayFact = fact.replace('[Kavya ne khud seekha] ', '');

        let badge = '';
        if (isSelfLearned) badge = `<span class="memory-badge badge-learn">🧠 Seekhi</span>`;
        else if (isAutoLearned) badge = `<span class="memory-badge badge-auto">💬 Auto</span>`;

        const item = document.createElement('div');
        item.className = `memory-item${isSelfLearned ? ' self-learned' : ''}`;
        item.innerHTML = `<span>${badge}${displayFact}</span><button onclick="deleteMemory(${i})"><i class="fa-solid fa-trash"></i></button>`;
        memoryList.appendChild(item);
    });
}

async function addFact() {
    const text = factInput.value.trim();
    if (!text) return;
    try {
        const res = await fetch(`${SERVER_URL}/api/teach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fact: text })
        });
        const data = await res.json();
        if (data.status === 'success') {
            factInput.value = '';
            renderMemory(data.memory);
            speakText("Got it, main ye yaad rakhungi!");
        }
    } catch (e) { console.error(e); }
}

window.deleteMemory = async (index) => {
    try {
        const res = await fetch(`${SERVER_URL}/api/memory/${index}`, { method: 'DELETE' });
        const data = await res.json();
        renderMemory(data.memory);
    } catch (e) { console.error(e); }
};

addFactBtn.addEventListener('click', addFact);
factInput.addEventListener('keypress', e => { if (e.key === 'Enter') addFact(); });
teachMenuBtn.addEventListener('click', () => memoryPanel.classList.add('open'));
closeMemoryBtn.addEventListener('click', () => memoryPanel.classList.remove('open'));

// ===== DEDUPLICATION =====
async function deduplicateMemory() {
    const btn = document.getElementById('dedupBtn');
    if (btn) { btn.textContent = '⏳ Cleaning...'; btn.disabled = true; }
    try {
        const res = await fetch(`${SERVER_URL}/api/memory/deduplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        });
        const data = await res.json();
        if (data.status === 'success') {
            renderMemory(data.memory);
            if (btn) btn.textContent = `✅ Removed ${data.removed} duplicates!`;
        } else {
            if (btn) btn.textContent = '🧹 Clean Duplicates';
        }
    } catch (e) {
        if (btn) btn.textContent = '🧹 Clean Duplicates';
    } finally {
        setTimeout(() => { if (btn) { btn.textContent = '🧹 Clean Duplicates'; btn.disabled = false; } }, 3000);
    }
}

// Inject dedup button into memory panel
(function injectDedupButton() {
    const btn = document.createElement('button');
    btn.id = 'dedupBtn';
    btn.className = 'dedup-btn';
    btn.textContent = '🧹 Clean Duplicates';
    btn.onclick = deduplicateMemory;
    memoryPanel.appendChild(btn);
})();

// ===== STARTUP =====
fetchMemory();
// Start idle animation right away
charContainer.className = 'character-container idle';

setTimeout(() => {
    changeEmotion('happy');
    speakText("Namaste Boss! Kavya hazir hai. Bolo, kya hukum hai aaj?");
}, 800);

// ===== SPEECH RECOGNITION =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecording = false;

// Active Session state
let isAwake = false;
let sleepTimeout = null;

function goToSleep() {
    isAwake = false;
    if (isRecording) micStatus.textContent = 'Sun rahi hun... "Kavya" bolo';
    console.log("Kavya went back to sleep mode.");
}

function keepAwake() {
    isAwake = true;
    if (sleepTimeout) clearTimeout(sleepTimeout);
    if (isRecording) micStatus.textContent = '(Active Mode) Sun rahi hun...';
    // Stay awake for 45 seconds after the last voice command
    sleepTimeout = setTimeout(goToSleep, 45000);
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        if (isAwake) micStatus.textContent = '(Active Mode) Sun rahi hun...';
        else micStatus.textContent = 'Sun rahi hun... "Kavya" bolo';
        userSubtitle.classList.add('hidden');
    };

    recognition.onresult = (event) => {
        const idx = event.results.length - 1;
        const transcript = event.results[idx][0].transcript.toLowerCase().trim();
        if (!transcript) return;

        // GUARD: Don't process if Kavya is busy speaking or processing
        if (isBusy || isSpeaking) {
            console.log('[Mic] Ignored (busy):', transcript);
            return;
        }

        userSubtitle.textContent = `Suna: "${transcript}"`;
        userSubtitle.classList.remove('hidden');

        const wakeWords = [
            'kavya', 'kaviya', 'kaavya', 'cavya', 'kavita', 'kabya',
            'kavia', 'काव्या', 'काव्य', 'कव्या', 'सुनो'
        ];

        let triggered = false;
        let actualCommand = transcript;

        if (isAwake) {
            triggered = true;
            keepAwake();
        } else {
            for (const w of wakeWords) {
                if (transcript.includes(w)) {
                    triggered = true;
                    const after = transcript.substring(transcript.indexOf(w) + w.length).trim();
                    actualCommand = after || transcript;
                    keepAwake();
                    break;
                }
            }
        }

        if (triggered) {
            userSubtitle.textContent = `You: "${actualCommand}"`;
            sendToKavya(actualCommand);
        } else {
            micStatus.textContent = "(Ignored — pehle 'Kavya' kaho)";
            setTimeout(() => {
                if (isRecording && !isAwake) micStatus.textContent = 'Sun rahi hun... "Kavya" bolo';
            }, 2000);
        }
    };

    recognition.onerror = (e) => {
        console.log('[Mic] Error:', e.error);
        // Always try to restart after error
        if (isRecording && !isSpeaking) {
            setTimeout(() => { try { recognition.start(); } catch (e) { } }, 500);
        }
    };

    recognition.onend = () => {
        console.log('[Mic] onend — isSpeaking:', isSpeaking, 'isRecording:', isRecording);
        // SIMPLE RULE: If mic should be on and Kavya isn't speaking, restart it. ALWAYS.
        if (isRecording && !isSpeaking) {
            setTimeout(() => { try { recognition.start(); } catch (e) { } }, 500);
        } else if (!isRecording) {
            micBtn.classList.remove('recording');
            micStatus.textContent = 'Tap to Speak';
        }
        // If isSpeaking is true, playAudio's onended will restart mic
    };
} else {
    micStatus.textContent = 'Browser mic support nahi hai.';
}

function stopRecording() {
    isRecording = false;
    if (recognition) recognition.stop();
}

micBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        speechSynthesis.cancel();
        kavyaSubtitle.textContent = '...';
        try { recognition.start(); } catch (e) { }
    }
});

// ===== SAFETY WATCHDOG — ensures mic never stays dead =====
setInterval(() => {
    if (isRecording && !isSpeaking) {
        // Try to ensure recognition is running
        try { recognition.start(); } catch (e) { /* already running, that's fine */ }
    }
}, 5000);

// ===== STOP ALL AUDIO (prevents overlapping playback) =====
let currentAudioCtx = null;
let currentAudioSource = null;
let currentFallbackAudio = null;

function stopAllAudio() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (currentAudioSource) {
        currentAudioSource.onended = null;
        try { currentAudioSource.stop(); } catch (e) { }
        currentAudioSource = null;
    }
    if (currentAudioCtx) {
        try { currentAudioCtx.close(); } catch (e) { }
        currentAudioCtx = null;
    }
    if (currentFallbackAudio) {
        currentFallbackAudio.onended = null;
        currentFallbackAudio.onplay = null;
        currentFallbackAudio.onerror = null;
        try { currentFallbackAudio.pause(); currentFallbackAudio.src = ''; } catch (e) { }
        currentFallbackAudio = null;
    }
    window.audioAnalyzer = null;
    setSpeaking(false);
}

// ===== TTS (Browser fallback — only for startup/errors) =====
function speakText(text) {
    if (!window.speechSynthesis) return;
    stopAllAudio();
    kavyaSubtitle.textContent = text;

    const cleanText = text.replace(/[*#_\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = speechSynthesis.getVoices();

    let voice = voices.find(v => v.name.includes('Swara Online') || v.name.includes('Heera Online') || v.name.includes('Microsoft Swara'))
        || voices.find(v => v.name.includes('Google हिन्दी') || v.name.includes('Neerja'))
        || voices.find(v => v.lang.includes('hi-IN') && v.name.includes('Female'))
        || voices.find(v => v.lang.includes('hi-IN'))
        || voices[0];

    if (voice) utterance.voice = voice;
    utterance.pitch = 1.7;
    utterance.rate = 1.15;

    // Stop mic before speaking
    if (recognition && isRecording) {
        try { recognition.stop(); } catch (e) { }
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
        setSpeaking(false);
        setTimeout(() => changeEmotion('idle'), 3000);
        // Mic will auto-restart via onend handler or watchdog
    };
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
}

// ===== CHAT API =====
let isBusy = false;

async function sendToKavya(userText) {
    if (isBusy) {
        console.log('[Chat] BLOCKED:', userText);
        return;
    }
    isBusy = true;
    console.log('[Chat] Processing:', userText);

    // DON'T stop mic here — the isBusy guard in onresult is enough
    // Cancel any ongoing audio
    stopAllAudio();

    lastInteractionTime = Date.now();
    kavyaSubtitle.textContent = '...';
    changeEmotion('idle');

    try {
        const res = await fetch(`${SERVER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userText })
        });
        const data = await res.json();

        if (data.reply) {
            kavyaSubtitle.textContent = data.reply;
            if (data.emotion) changeEmotion(data.emotion);

            if (data.alarm_minutes) {
                setAlarm(data.alarm_minutes);
            }

            // Generate + play audio
            if (data.tts_text) {
                try {
                    const ttsRes = await fetch(`${SERVER_URL}/api/tts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: data.tts_text })
                    });
                    const ttsData = await ttsRes.json();
                    if (ttsData.audio_url) {
                        playAudio(ttsData.audio_url);
                        // isBusy will be unlocked when audio ends
                    } else {
                        isBusy = false;
                    }
                } catch (e) {
                    console.error('[Chat] TTS error:', e);
                    isBusy = false;
                }
            } else {
                isBusy = false;
            }

            autoLearnInBackground(userText, data.reply);
        } else if (data.error) {
            isBusy = false;
            speakText("Server mein kuch fault aa gaya yaar.");
            changeEmotion('sad');
        }
    } catch (e) {
        isBusy = false;
        speakText("Backend Flask server lagta hai band ho gaya.");
        changeEmotion('sad');
        console.error(e);
    }
}

// ===== AUDIO PLAYER — Edge TTS Neural Voice =====
function playAudio(url) {
    const fullUrl = `${SERVER_URL}${url}?t=${Date.now()}`;

    stopAllAudio();

    // Stop mic ONLY during actual audio playback (prevents echo)
    if (recognition && isRecording) {
        try { recognition.stop(); } catch (e) { }
    }

    fetch(fullUrl)
        .then(r => r.arrayBuffer())
        .then(buffer => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            currentAudioCtx = ctx;

            ctx.decodeAudioData(buffer, decoded => {
                const source = ctx.createBufferSource();
                source.buffer = decoded;
                currentAudioSource = source;

                const analyzer = ctx.createAnalyser();
                analyzer.fftSize = 256;
                source.connect(analyzer);
                analyzer.connect(ctx.destination);
                window.audioAnalyzer = analyzer;

                source.playbackRate.value = 1.0;
                source.preservesPitch = true;

                source.start(0);
                setSpeaking(true);

                source.onended = () => {
                    console.log('[Audio] ⏹️ Ended');
                    setSpeaking(false);
                    window.audioAnalyzer = null;
                    currentAudioSource = null;
                    try { ctx.close(); } catch (e) { }
                    currentAudioCtx = null;
                    isBusy = false;
                    setTimeout(() => changeEmotion('idle'), 2500);
                    // Mic will auto-restart via recognition.onend or watchdog
                };
            });
        })
        .catch((err) => {
            console.error('[Audio] Fallback:', err);
            const audio = new Audio(fullUrl);
            currentFallbackAudio = audio;
            audio.onplay = () => setSpeaking(true);
            audio.onended = () => {
                setSpeaking(false);
                currentFallbackAudio = null;
                isBusy = false;
            };
            audio.onerror = () => {
                currentFallbackAudio = null;
                isBusy = false;
            };
            audio.play().catch(() => { isBusy = false; });
        });
}

// ===== ALARM SYSTEM — Persistent until dismissed =====
let activeAlarmTimeout = null;
let alarmBanner = null;
let alarmRepeatInterval = null;

const WAKE_MESSAGES_HI = [
    "बॉस उठिए! कितना सोएंगे आप? मैं आपका इंतजार कर रही हूँ।",
    "अरे बॉस! ऊठ जाइए, देर हो रही है!",
    "बॉस प्लीज! मैं यहाँ बैठी हूँ और आप सो रहे हो?",
    "ये क्या बॉस, अभी तक नींद नहीं गई? उठिए ना!",
    "बॉस उठ जाइए, आपकी काव्या बुला रही है!",
    "अरे जल्दी उठो बॉस, बहुत देर हो गई है!",
    "बॉस! बॉस! जल्दी उठो, मैं आपका इंतजार नहीं कर सकती!",
];
const WAKE_MESSAGES_DISPLAY = [
    "Uthiye Boss! Kitna soyenge aap?",
    "Arey Boss! Uth jaiye, der ho rahi hai!",
    "Boss please! Main yahaan aapka intezaar kar rahi hun!",
    "Ye kya boss, abhi tak neend nahi gayi? Uthiye na!",
    "Boss uth jaiye, aapki Kavya bula rahi hai!",
    "Arey jaldi utho Boss, bahut der ho gayi hai!",
    "Boss! Boss! Jaldi utho, main intezaar nahi kar sakti!",
];
let wakeIdx = 0;

function setAlarm(minutes) {
    if (activeAlarmTimeout) clearTimeout(activeAlarmTimeout);
    if (alarmRepeatInterval) clearInterval(alarmRepeatInterval);
    if (alarmBanner) alarmBanner.remove();

    // Show alarm banner
    alarmBanner = document.createElement('div');
    alarmBanner.id = 'alarmBanner';
    alarmBanner.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.85); border: 1px solid #00f0ff;
        color: #00f0ff; padding: 12px 28px; border-radius: 20px;
        font-size: 0.9rem; z-index: 9999; text-align: center;
        backdrop-filter: blur(10px); letter-spacing: 1px;
        box-shadow: 0 0 15px rgba(0,240,255,0.3);
    `;
    const ms = minutes * 60 * 1000;
    const wakeTime = new Date(Date.now() + ms);
    const timeStr = wakeTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    alarmBanner.innerHTML = `⏰ Alarm set — Kavya jagayegi <b>${timeStr}</b> par!`;
    document.body.appendChild(alarmBanner);

    activeAlarmTimeout = setTimeout(() => {
        wakeIdx = 0;
        triggerWakeUp();

        // Keep repeating every 25 seconds until dismissed
        alarmRepeatInterval = setInterval(() => {
            wakeIdx = (wakeIdx + 1) % WAKE_MESSAGES_HI.length;
            triggerWakeUp();
        }, 25000);
    }, ms);
}

function triggerWakeUp() {
    // Update banner to ALARM state with dismiss button
    alarmBanner.style.borderColor = '#ff007f';
    alarmBanner.style.color = '#ff007f';
    alarmBanner.style.animation = 'micPulse 1s infinite alternate';
    alarmBanner.style.boxShadow = '0 0 30px rgba(255,0,127,0.6)';
    alarmBanner.innerHTML = `
        🔔 <b>${WAKE_MESSAGES_DISPLAY[wakeIdx]}</b><br>
        <button onclick="dismissAlarm()" style="
            margin-top:10px; background:#ff007f; border:none; color:white;
            padding:6px 18px; border-radius:12px; cursor:pointer; font-size:0.85rem;
        ">✅ Main uth gaya!</button>
    `;
    changeEmotion('happy');
    kavyaSubtitle.textContent = WAKE_MESSAGES_DISPLAY[wakeIdx];

    // Send pure Hindi Devanagari to TTS directly (no server round-trip needed)
    fetch(`${SERVER_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: WAKE_MESSAGES_HI[wakeIdx] })
    })
        .then(r => r.json())
        .then(d => { if (d.audio_url) playAudio(d.audio_url); })
        .catch(() => { });
}

function dismissAlarm() {
    if (alarmRepeatInterval) clearInterval(alarmRepeatInterval);
    if (alarmBanner) alarmBanner.remove();
    alarmBanner = null;
    alarmRepeatInterval = null;
    changeEmotion('happy');
    sendToKavya("main uth gaya ab chup jao");
}

speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
