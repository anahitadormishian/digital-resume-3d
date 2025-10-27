import { createHomeScene } from './home.js';

const THREE = window.THREE;
if (!THREE) {
  throw new Error('THREE.js failed to load');
}

const OrbitControlsCtor = THREE.OrbitControls ?? window.OrbitControls;
if (!OrbitControlsCtor) {
  throw new Error(
    'OrbitControls is missing. Ensure the OrbitControls script is loaded before main.js.'
  );
}

const overlayElements = {
  bio: document.getElementById('bio-card'),
  skills: document.getElementById('skills-cards'),
  languages: document.getElementById('languages-cards'),
  experience: document.getElementById('experience-cards'),
  education: document.getElementById('education-cards'),
  projects: document.getElementById('projects-cards')
};

const docElement = document.documentElement;
const navScrollLinks = Array.from(document.querySelectorAll('[data-scroll-progress]'));

const existingCanvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({
  canvas: existingCanvas ?? undefined,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.domElement.style.pointerEvents = 'none';

document.documentElement.style.overflowY = 'auto';
document.body.style.overflowY = 'auto';

if (!existingCanvas) {
  renderer.domElement.id = 'canvas';
  document.body.appendChild(renderer.domElement);
}

const scene = new THREE.Scene();
renderer.setClearColor(0x000000, 0);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 9);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 5);
scene.add(mainLight);

const controls = new OrbitControlsCtor(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableRotate = false;
controls.update();

createHomeScene(scene);

const startTarget = controls.target.clone();
const boardTargetFallback = new THREE.Vector3(0, 1.3, 0.1);
const startCameraPos = new THREE.Vector3();
const boardCameraPos = new THREE.Vector3();
const desiredCameraPos = new THREE.Vector3();
const desiredTarget = new THREE.Vector3().copy(startTarget);
const panelWorldPos = new THREE.Vector3();
const panelLookTarget = new THREE.Vector3().copy(boardTargetFallback);

let panelGroupRef = null;
let currentViewportId = null;
let scrollProgress = 0;
let smoothedProgress = 0;

const CAMERA_ZOOM_PHASE_END = 0.24;
const HERO_HIDE_PROGRESS = 0.34;
const HERO_FADE_RANGE = 0.08;

const timingConfigs = {
  bio: { start: 0.45, fadeInEnd: 0.65, fadeOutStart: 0.86, end: 1 },
  skills: { start: 0.82, fadeInEnd: 0.97, fadeOutStart: 1.18, end: 1.32 },
  languages: { start: 1.12, fadeInEnd: 1.28, fadeOutStart: 1.5, end: 1.64 },
  experience: { start: 2.05, fadeInEnd: 2.25, fadeOutStart: 2.52, end: 2.72 },
  education: { start: 2.38, fadeInEnd: 2.58, fadeOutStart: 2.86, end: 3 },
  projects: { start: 3.45, fadeInEnd: 3.72, fadeOutStart: 3.98, end: 4.2 }
};

const overlayDescriptors = [
  {
    key: 'bio',
    element: overlayElements.bio,
    visibleClass: 'bio-card--visible',
    timings: timingConfigs.bio,
    scale: 3
  },
  {
    key: 'skills',
    element: overlayElements.skills,
    visibleClass: 'skills-overlay--visible',
    timings: timingConfigs.skills,
    scale: 3
  },
  {
    key: 'languages',
    element: overlayElements.languages,
    visibleClass: 'languages-overlay--visible',
    timings: timingConfigs.languages,
    scale: 3
  },
  {
    key: 'experience',
    element: overlayElements.experience,
    visibleClass: 'experience-overlay--visible',
    timings: timingConfigs.experience,
    scale: 3
  },
  {
    key: 'education',
    element: overlayElements.education,
    visibleClass: 'education-overlay--visible',
    timings: timingConfigs.education,
    scale: 3
  },
  {
    key: 'projects',
    element: overlayElements.projects,
    visibleClass: 'projects-overlay--visible',
    timings: timingConfigs.projects,
    scale: 4,
    adjust(alpha, context) {
      const educationAlpha = Math.min(context.education ?? 0, 1);
      return alpha * (1 - educationAlpha);
    }
  }
];

const overlayVisibility = Object.fromEntries(
  overlayDescriptors.map(descriptor => [descriptor.key, false])
);

const VIEWPORT_CONFIGS = [
  {
    id: 'mobile',
    maxWidth: 640,
    start: new THREE.Vector3(0, 3.25, 10.4),
    board: new THREE.Vector3(0, 1.68, 3.55)
  },
  {
    id: 'tablet',
    maxWidth: 1024,
    start: new THREE.Vector3(0, 3.18, 9.6),
    board: new THREE.Vector3(0, 1.74, 3.05)
  },
  {
    id: 'desktop',
    maxWidth: Infinity,
    start: new THREE.Vector3(0, 3, 9),
    board: new THREE.Vector3(0, 1.82, 2.35)
  }
];

applyViewportTweaks(true);

function applyViewportTweaks(initial = false) {
  const width = window.innerWidth;
  const config =
    VIEWPORT_CONFIGS.find(candidate => width <= candidate.maxWidth) ??
    VIEWPORT_CONFIGS[VIEWPORT_CONFIGS.length - 1];
  if (!config) {
    return;
  }

  const viewportChanged = config.id !== currentViewportId;
  currentViewportId = config.id;

  startCameraPos.copy(config.start);
  boardCameraPos.copy(config.board);

  if (initial) {
    camera.position.copy(startCameraPos);
    desiredCameraPos.copy(startCameraPos);
    desiredTarget.copy(startTarget);
    controls.target.copy(startTarget);
  } else if (viewportChanged) {
    desiredCameraPos.copy(camera.position);
    desiredTarget.copy(controls.target);
  }

  controls.update();
}

function scrollToProgress(progress) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  const maxScroll = docElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) {
    return;
  }
  const targetTop = clamped * maxScroll;
  scrollProgress = clamped;
  window.scrollTo({
    top: targetTop,
    behavior: 'smooth'
  });
}

for (const link of navScrollLinks) {
  link.addEventListener('click', event => {
    event.preventDefault();
    const targetValue = parseFloat(link.dataset.scrollProgress ?? '');
    if (!Number.isFinite(targetValue)) {
      return;
    }
    scrollToProgress(targetValue);
  });
}

function updateScrollProgress() {
  const maxScroll = docElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) {
    scrollProgress = 0;
    return;
  }
  scrollProgress = Math.min(window.scrollY / maxScroll, 1);
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

function animate() {
  requestAnimationFrame(animate);
  smoothedProgress += (scrollProgress - smoothedProgress) * 0.08;

  updatePanelTarget();

  const overlayContext = {};
  let overlayBlend = 0;

  for (const descriptor of overlayDescriptors) {
    const { key, element, timings, scale = 3, adjust } = descriptor;
    if (!element) {
      overlayContext[key] = 0;
      continue;
    }

    const scaledProgress = smoothedProgress * scale;
    let alpha = computePhaseAlpha(scaledProgress, timings);
    if (adjust) {
      alpha = adjust(alpha, overlayContext);
    }

    overlayContext[key] = alpha;
    overlayBlend = Math.max(overlayBlend, alpha);
    applyOverlayState(descriptor, alpha);
  }

  updateHeroVisibility(overlayBlend);
  updateCameraTargets();

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', handleResize);

function handleResize() {
  applyViewportTweaks();
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  updateScrollProgress();
}

function updatePanelTarget() {
  if (!panelGroupRef) {
    panelGroupRef = scene.getObjectByName('panelGroup');
  }

  if (panelGroupRef) {
    panelGroupRef.getWorldPosition(panelWorldPos);
    panelLookTarget.copy(panelWorldPos);
    panelLookTarget.z += 0.025;
  } else {
    panelLookTarget.copy(boardTargetFallback);
  }
}

function applyOverlayState(descriptor, alpha) {
  const { key, element, visibleClass } = descriptor;
  if (!element) {
    return;
  }

  element.style.opacity = alpha.toFixed(3);
  const shouldShow = alpha > 0.05;
  if (shouldShow !== overlayVisibility[key]) {
    element.classList.toggle(visibleClass, shouldShow);
    overlayVisibility[key] = shouldShow;
  }
  element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
}

function updateHeroVisibility(overlayBlend) {
  const homeGroup = scene.getObjectByName('homeGroup');
  if (!homeGroup) {
    return;
  }

  const fadeT =
    HERO_FADE_RANGE > 0
      ? THREE.MathUtils.clamp((smoothedProgress - HERO_HIDE_PROGRESS) / HERO_FADE_RANGE, 0, 1)
      : smoothedProgress > HERO_HIDE_PROGRESS
        ? 1
        : 0;

  const heroVisibilityFactor = 1 - fadeT;
  const baseOpacity = THREE.MathUtils.clamp(1 - overlayBlend * 1.4, 0, 1);
  const homeOpacity = THREE.MathUtils.clamp(baseOpacity * heroVisibilityFactor, 0, 1);
  const isVisible = homeOpacity > 0.02;
  homeGroup.visible = isVisible;

  homeGroup.traverse(object3D => {
    const { material } = object3D;
    if (!material) {
      return;
    }

    if (Array.isArray(material)) {
      material.forEach(mat => setMaterialOpacity(mat, homeOpacity));
    } else {
      setMaterialOpacity(material, homeOpacity);
    }
  });
}

function setMaterialOpacity(material, opacity) {
  if (!material || typeof material.opacity !== 'number') {
    return;
  }
  if (!material.transparent) {
    material.transparent = true;
  }
  material.opacity = opacity;
}

function updateCameraTargets() {
  const normalizedZoom = CAMERA_ZOOM_PHASE_END > 0 ? smoothedProgress / CAMERA_ZOOM_PHASE_END : 1;
  const zoomT = THREE.MathUtils.clamp(normalizedZoom, 0, 1);
  const easedZoomT = easeInOutCubic(zoomT);

  desiredCameraPos.copy(startCameraPos).lerp(boardCameraPos, easedZoomT);
  desiredTarget.copy(startTarget).lerp(panelLookTarget, easedZoomT);

  camera.position.lerp(desiredCameraPos, 0.12);
  controls.target.lerp(desiredTarget, 0.12);
  controls.update();
}

function computePhaseAlpha(progress, timings) {
  if (!timings || progress <= timings.start || progress >= timings.end) {
    return 0;
  }

  if (progress <= timings.fadeInEnd) {
    return THREE.MathUtils.clamp(
      (progress - timings.start) / (timings.fadeInEnd - timings.start || 0.0001),
      0,
      1
    );
  }

  if (progress >= timings.fadeOutStart) {
    return THREE.MathUtils.clamp(
      1 - (progress - timings.fadeOutStart) / (timings.end - timings.fadeOutStart || 0.0001),
      0,
      1
    );
  }

  return 1;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
// ✅ Fix viewport height for mobile browsers
function updateViewportHeight() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
updateViewportHeight();
window.addEventListener('resize', updateViewportHeight);
