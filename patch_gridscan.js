const fs = require('fs');
const path = require('path');

const viewsPath = path.join(__dirname, 'src', 'views.js');
let content = fs.readFileSync(viewsPath, 'utf8');

// Find the GridScan block boundaries
const START_MARKERS = [
  '<!-- GridScan WebGL -->',
  '<!-- GridScan WebGL Background -->',
  '<!-- ═══════════════ GridScan WebGL Shader ═══════════════ -->'
];
let start = -1;
for (const m of START_MARKERS) {
  start = content.indexOf(m);
  if (start !== -1) break;
}
if (start === -1) { console.error('GridScan start marker not found!'); process.exit(1); }

// Find closing </script> after the marker
let end = content.indexOf('</script>', start);
if (end === -1) { console.error('No </script> found!'); process.exit(1); }
end += '</script>'.length;

// ═══════════════════════════════════════════════════════════════════════════
// The full GridScan block using Three.js via CDN esm.sh
// Uses the EXACT shaders from the React Bits GridScan component
// ═══════════════════════════════════════════════════════════════════════════
const GRIDSCAN_BLOCK = `<!-- GridScan Three.js Background -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
  }
}
<\/script>
<script type="module">
import * as THREE from 'three';

const container = document.getElementById('gridscan-bg');

// ── Vertex Shader ────────────────────────────────────────────────────────────
const vert = \`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
\`;

// ── Fragment Shader (exact React Bits GridScan frag) ─────────────────────────
const frag = \`
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
uniform float uBloomOpacity;
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
    float fadeStrength = 2.0;
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
    float aura = auraBand * 0.3 * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

    vec3 gridCol = uLinesColor * lineMask * fade;
    vec3 scanCol = uScanColor * pulse;
    vec3 scanAura = uScanColor * aura;

    vec3 color = gridCol + scanCol + scanAura;
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898,78.233))) * 43758.5453123);
    color += (n - 0.5) * uNoise;
    color = clamp(color, 0.0, 1.0);

    float alpha = clamp(max(lineMask * fade, pulse + aura), 0.0, 1.0);
    fragColor = vec4(color, alpha);
}

void main(){
  vec4 c;
  mainImage(c, vUv * iResolution.xy);
  gl_FragColor = c;
}
\`;

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  const out = target.clone().add(change.add(temp).multiplyScalar(exp));
  return out;
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

// ── Scene Setup ───────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0x000000, 0);

const uniforms = {
  iResolution:   { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
  iTime:         { value: 0 },
  uSkew:         { value: new THREE.Vector2(0, 0) },
  uTilt:         { value: 0 },
  uYaw:          { value: 0 },
  uLineThickness:{ value: 1.0 },
  uLinesColor:   { value: hexToLinear('#7B2FD4') },   // bright purple
  uScanColor:    { value: hexToLinear('#FF60FF') },   // hot pink
  uGridScale:    { value: 0.10 },
  uScanOpacity:  { value: 0.6 },
  uNoise:        { value: 0.008 },
  uBloomOpacity: { value: 0.0 },
  uScanGlow:     { value: 0.7 },
  uScanSoftness: { value: 2.0 },
  uPhaseTaper:   { value: 0.12 },
  uScanDuration: { value: 2.2 },
  uScanDelay:    { value: 1.8 },
  uScanDirection:{ value: 2.0 }  // pingpong
};

const material = new THREE.ShaderMaterial({
  uniforms, vertexShader: vert, fragmentShader: frag,
  transparent: true, depthWrite: false, depthTest: false
});

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

// ── Smooth-damp mouse parallax ────────────────────────────────────────────────
const lookTarget = new THREE.Vector2(0, 0);
const lookCurrent = new THREE.Vector2(0, 0);
const lookVel = new THREE.Vector2(0, 0);
let tiltTarget = 0, tiltCurrent = 0, tiltVel = { v: 0 };
let yawTarget = 0,  yawCurrent = 0,  yawVel  = { v: 0 };
const SM = 0.3;

document.addEventListener('mousemove', e => {
  lookTarget.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(((e.clientY / window.innerHeight) * 2 - 1))
  );
});
document.addEventListener('mouseleave', () => {
  lookTarget.set(0, 0);
  tiltTarget = 0; yawTarget = 0;
});

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, renderer.getPixelRatio());
});

// ── Render Loop ───────────────────────────────────────────────────────────────
let last = performance.now();
(function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;

  lookCurrent.copy(smoothDampVec2(lookCurrent, lookTarget, lookVel, SM, dt));
  tiltCurrent = smoothDampFloat(tiltCurrent, tiltTarget, tiltVel, SM, dt);
  yawCurrent  = smoothDampFloat(yawCurrent,  yawTarget,  yawVel,  SM, dt);

  uniforms.uSkew.value.set(lookCurrent.x * 0.13, -lookCurrent.y * 1.4 * 0.13);
  uniforms.uTilt.value = tiltCurrent * 0.22;
  uniforms.uYaw.value  = THREE.MathUtils.clamp(yawCurrent * 0.18, -0.6, 0.6);
  uniforms.iTime.value = now / 1000;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
})(performance.now());
<\/script>`;

const newContent = content.slice(0, start) + GRIDSCAN_BLOCK + content.slice(end);
fs.writeFileSync(viewsPath, newContent, 'utf8');
console.log('SUCCESS: Three.js GridScan applied. Lines:', newContent.split('\n').length);
