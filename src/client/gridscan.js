import * as THREE from 'three';
import { BloomEffect, ChromaticAberrationEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import * as faceapi from 'face-api.js';

// ── Vertex Shader ────────────────────────────────────────────────────────────
const vert = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// ── Fragment Shader ──────────────────────────────────────────────────────────
const frag = `
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 uSkew;
uniform float uTilt;
uniform float uYaw;
uniform float uLineThickness;
uniform vec3 uLinesColor;
uniform vec3 uScanColor;
uniform float uGridScale;
uniform float uScanOpacity;
uniform float uScanDirection;
uniform float uNoise;
uniform float uScanGlow;
uniform float uScanSoftness;
uniform float uPhaseTaper;
uniform float uScanDuration;
uniform float uScanDelay;
varying vec2 vUv;

float smoother01(float a, float b, float x){
  float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0);
    vec3 rd = normalize(vec3(p, 2.0));

    float cR = cos(uTilt), sR = sin(uTilt);
    rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;
    float cY = cos(uYaw), sY = sin(uYaw);
    rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;
    vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
    rd.xy += skew * rd.z;

    float minT = 1e20;
    float gridScale = max(1e-5, uGridScale);
    float fadeStrength = 1.6;
    vec2 gridUV = vec2(0.0);
    float hitIsY = 1.0;

    for (int i = 0; i < 4; i++) {
        float isY = float(i < 2);
        float pos = mix(-0.2, 0.2, float(i)) * isY + mix(-0.5, 0.5, float(i - 2)) * (1.0 - isY);
        float num = pos - (isY * ro.y + (1.0 - isY) * ro.x);
        float den = isY * rd.y + (1.0 - isY) * rd.x;
        float t = num / den;
        vec3 h = ro + rd * t;
        bool use = t > 0.0 && t < minT;
        gridUV = use ? mix(h.zy, h.xz, isY) / gridScale : gridUV;
        minT = use ? t : minT;
        hitIsY = use ? isY : hitIsY;
    }

    vec3 hit = ro + rd * minT;
    float dist = length(hit - ro);
    float fade = exp(-dist * fadeStrength);

    vec2 g = gridUV;
    vec2 f = fract(g);
    vec2 a = min(f, 1.0 - f);
    vec2 w = vec2(dFdx(g.x), dFdy(g.y));
    float hp = max(0.0, uLineThickness) * 0.5;
    float lx = 1.0 - smoothstep(hp * w.x, hp * w.x + abs(w.x), a.x);
    float ly = 1.0 - smoothstep(hp * w.y, hp * w.y + abs(w.y), a.y);
    float lineMask = max(lx, ly);

    float dur = max(0.05, uScanDuration);
    float del = max(0.0, uScanDelay);
    float scanZMax = 2.0;
    float sigma = max(0.001, 0.18 * uScanGlow * uScanSoftness);
    float sigmaA = sigma * 2.0;

    float cycle = dur + del;
    float tCycle = mod(iTime, cycle * 2.0);
    float phase;
    if (uScanDirection < 0.5) {
      phase = clamp((tCycle - del) / dur, 0.0, 1.0);
    } else if (uScanDirection < 1.5) {
      phase = 1.0 - clamp((tCycle - del) / dur, 0.0, 1.0);
    } else {
      phase = (tCycle < cycle)
        ? clamp((tCycle - del) / dur, 0.0, 1.0)
        : 1.0 - clamp((tCycle - cycle - del) / dur, 0.0, 1.0);
    }
    float scanZ = phase * scanZMax;
    float dz = abs(hit.z - scanZ);
    float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));
    float taper = clamp(uPhaseTaper, 0.0, 0.49);
    float phaseWindow = smoother01(0.0, taper, phase) * (1.0 - smoother01(1.0 - taper, 1.0, phase));
    float pulse = lineBand * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);
    float auraBand = exp(-0.5 * (dz * dz) / (sigmaA * sigmaA));
    float aura = auraBand * 0.35 * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

    vec3 gridCol = uLinesColor * lineMask * fade;
    vec3 scanCol = uScanColor * pulse;
    vec3 scanAura = uScanColor * aura;

    // Dark Background Base (almost pure black)
    vec3 bg = vec3(0.0, 0.0, 0.0);

    vec3 color = bg + gridCol + scanCol + scanAura;
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898,78.233))) * 43758.5453123);
    color += (n - 0.5) * uNoise;
    color = clamp(color, 0.0, 1.0);

    fragColor = vec4(color, 1.0); // Opaque
}

void main(){
  vec4 c;
  mainImage(c, vUv * iResolution.xy);
  gl_FragColor = c;
}
`;

function hexToLinear(hex) {
  const c = new THREE.Color(hex);
  return c.convertSRGBToLinear();
}

function smoothDampVec2(current, target, vel, sm, dt) {
  sm = Math.max(0.0001, sm);
  const omega = 2 / sm, x = omega * dt;
  const exp = 1 / (1 + x + 0.48*x*x + 0.235*x*x*x);
  let change = current.clone().sub(target);
  target = current.clone().sub(change);
  const temp = vel.clone().addScaledVector(change, omega).multiplyScalar(dt);
  vel.sub(temp.clone().multiplyScalar(omega)).multiplyScalar(exp);
  return target.clone().add(change.add(temp).multiplyScalar(exp));
}

function smoothDampFloat(cur, tgt, velRef, sm, dt) {
  sm = Math.max(0.0001, sm);
  const omega = 2/sm, x = omega*dt;
  const exp = 1/(1+x+0.48*x*x+0.235*x*x*x);
  let change = cur - tgt; tgt = cur - change;
  const temp = (velRef.v + omega*change)*dt;
  velRef.v = (velRef.v - omega*temp)*exp;
  return tgt + (change+temp)*exp;
}

// ── Initialize App ────────────────────────────────────────────────────────────
async function initGridScan() {
  const container = document.getElementById('gridscan-bg');
  if (!container) return;

  const renderer = new THREE.WebGLRenderer({ canvas: container, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 1);

  const uniforms = {
    iResolution:   { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
    iTime:         { value: 0 },
    uSkew:         { value: new THREE.Vector2(0, 0) },
    uTilt:         { value: 0 },
    uYaw:          { value: 0 },
    uLineThickness:{ value: 0.6 },
    uLinesColor:   { value: hexToLinear('#00E5FF') },   // Elegant Cyan/Light Blue
    uScanColor:    { value: hexToLinear('#BBE7FF') },   // Soft White-Blue Glow
    uGridScale:    { value: 0.15 },
    uScanOpacity:  { value: 0.35 },
    uNoise:        { value: 0.01 },
    uScanGlow:     { value: 0.4 },
    uScanSoftness: { value: 1.2 },
    uPhaseTaper:   { value: 0.12 },
    uScanDuration: { value: 2.2 },
    uScanDelay:    { value: 1.8 },
    uScanDirection:{ value: 2.0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: vert, fragmentShader: frag,
    depthWrite: false, depthTest: false
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  // ── Postprocessing Composer ───────────────────────────────────────────────────
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Add Bloom & Chromatic Aberration as per original React Bits
  const bloomEffect = new BloomEffect({
    intensity: 0.6,
    luminanceThreshold: 0.7,
    luminanceSmoothing: 0.1,
  });
  
  const chromEffect = new ChromaticAberrationEffect({
    offset: new THREE.Vector2(0.003, 0.003),
  });

  const effectPass = new EffectPass(camera, bloomEffect, chromEffect);
  composer.addPass(effectPass);

  // ── State for Parallax ────────────────────────────────────────────────────────
  const lookTarget = new THREE.Vector2(0, 0);
  const lookCurrent = new THREE.Vector2(0, 0);
  const lookVel = new THREE.Vector2(0, 0);
  let tiltTarget = 0, tiltCurrent = 0, tiltVel = { v: 0 };
  let yawTarget = 0,  yawCurrent = 0,  yawVel  = { v: 0 };
  const SM = 0.3;
  let useFaceTracking = false;

  document.addEventListener('mousemove', e => {
    if (useFaceTracking) return; // Overridden by face tracker
    lookTarget.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(((e.clientY / window.innerHeight) * 2 - 1))
    );
  });
  
  // Mobile Touch Support
  document.addEventListener('touchmove', e => {
    if (useFaceTracking || !e.touches.length) return;
    lookTarget.set(
      (e.touches[0].clientX / window.innerWidth) * 2 - 1,
      -(((e.touches[0].clientY / window.innerHeight) * 2 - 1))
    );
  }, { passive: true });

  // Mobile Gyroscope Support
  window.addEventListener('deviceorientation', e => {
    if (useFaceTracking || !e.gamma || !e.beta) return;
    // gamma ranges roughly [-90, 90] for left-to-right tilt
    // beta ranges roughly [-180, 180] for front-to-back tilt
    let x = e.gamma / 45.0; // scale down
    let y = (e.beta - 45) / 45.0; // assume natural hold angle is 45 deg
    lookTarget.set(
      THREE.MathUtils.clamp(x, -1, 1),
      -THREE.MathUtils.clamp(y, -1, 1)
    );
  });

  document.addEventListener('mouseleave', () => {
    if (useFaceTracking) return;
    lookTarget.set(0, 0);
    tiltTarget = 0; yawTarget = 0;
  });
  document.addEventListener('touchend', () => {
    if (useFaceTracking) return;
    lookTarget.set(0, 0);
    tiltTarget = 0; yawTarget = 0;
  });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, renderer.getPixelRatio());
  });

  // ── Face-API.js Tracking ──────────────────────────────────────────────────────
  async function initFaceTracking() {
    try {
      // Load models from CDN
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      
      const video = document.createElement('video');
      video.style.display = 'none';
      video.autoplay = true;
      video.muted = true;
      document.body.appendChild(video);
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      
      video.addEventListener('play', () => {
        useFaceTracking = true;
        const scanFaces = async () => {
          if (video.paused || video.ended) return;
          const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
          if (detection) {
            // Map face position to lookTarget
            const cx = detection.box.x + detection.box.width / 2;
            const cy = detection.box.y + detection.box.height / 2;
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            // Reverse X because webcam is mirrored
            lookTarget.set(
              -((cx / vw) * 2 - 1) * 1.5,
              -((cy / vh) * 2 - 1) * 1.5
            );
          } else {
            // Recenter smoothly if no face found
            lookTarget.set(0, 0);
          }
          requestAnimationFrame(scanFaces);
        };
        scanFaces();
      });
    } catch(err) {
      console.warn('Face tracking failed or webcam denied, falling back to mouse:', err);
    }
  }
  
  // Start Face Tracking
  initFaceTracking();

  // ── Render Loop ─────────────────────────────────────────────────────────────
  let last = performance.now();
  (function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.1); last = now;

    lookCurrent.copy(smoothDampVec2(lookCurrent, lookTarget, lookVel, SM, dt));
    tiltCurrent = smoothDampFloat(tiltCurrent, tiltTarget, tiltVel, SM, dt);
    yawCurrent  = smoothDampFloat(yawCurrent,  yawTarget,  yawVel,  SM, dt);

    uniforms.uSkew.value.set(lookCurrent.x * 0.15, -lookCurrent.y * 1.4 * 0.15);
    uniforms.uTilt.value = tiltCurrent * 0.25;
    uniforms.uYaw.value  = THREE.MathUtils.clamp(yawCurrent * 0.2, -0.6, 0.6);
    uniforms.iTime.value = now / 1000;

    composer.render();
    requestAnimationFrame(tick);
  })(performance.now());
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGridScan);
} else {
  initGridScan();
}
