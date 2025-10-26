import { createHomeScene } from './home.js';

const THREE = window.THREE;
if (!THREE) {
  throw new Error('THREE.js failed to load');
}
if (!THREE.OrbitControls) {
  throw new Error('OrbitControls is missing. Ensure the OrbitControls script is loaded before main.js.');
}

const bioCard = document.getElementById('bio-card');
const skillsOverlay = document.getElementById('skills-cards');
const languagesOverlay = document.getElementById('languages-cards');
const experienceOverlay = document.getElementById('experience-cards');
const educationOverlay = document.getElementById('education-cards');
const projectsOverlay = document.getElementById('projects-cards');
let bioCardCurrentlyVisible = false;
let skillsOverlayVisible = false;
let languagesOverlayVisible = false;
let experienceOverlayVisible = false;
let educationOverlayVisible = false;
let projectsOverlayVisible = false;
const docElement = document.documentElement;
const navScrollLinks = document.querySelectorAll('[data-scroll-progress]');

const existingCanvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({
  canvas: existingCanvas ?? undefined,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

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

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.enableZoom = false; // prevent mouse wheel from blocking page scroll
controls.enablePan = false;
controls.enableRotate = false;
controls.update();

// 🪄 اضافه کردن صحنه‌ی اصلی
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
let scrollProgress = 0;
let smoothedProgress = 0;

const CAMERA_ZOOM_PHASE_END = 0.24;
const HERO_HIDE_PROGRESS = 0.34;
const HERO_FADE_RANGE = 0.08;

const bioTimings = {
  start: 0.45,
  fadeInEnd: 0.65,
  fadeOutStart: 0.86,
  end: 1.0
};

const skillsTimings = {
  start: 0.82,
  fadeInEnd: 0.97,
  fadeOutStart: 1.18,
  end: 1.32
};

const languagesTimings = {
  start: 1.12,
  fadeInEnd: 1.28,
  fadeOutStart: 1.5,
  end: 1.64
};

const experienceTimings = {
  start: 2.05,
  fadeInEnd: 2.25,
  fadeOutStart: 2.52,
  end: 2.72
};

const educationTimings = {
  start: 2.38,
  fadeInEnd: 2.58,
  fadeOutStart: 2.86,
  end: 3
};

const projectsTimings = {
  start: 3.45,
  fadeInEnd: 3.72,
  fadeOutStart: 3.98,
  end: 4.2
};

const VIEWPORT_CONFIGS = [
  {
    id: 'mobile',
    maxWidth: 640,
    start: new THREE.Vector3(0, 3.25, 10.4),
    board: new THREE.Vector3(0, 1.68, 3.55),
    languages: new THREE.Vector3(0, 2.3, 5.9)
  },
  {
    id: 'tablet',
    maxWidth: 1024,
    start: new THREE.Vector3(0, 3.18, 9.6),
    board: new THREE.Vector3(0, 1.74, 3.05),
    languages: new THREE.Vector3(0, 2.2, 5.1)
  },
  {
    id: 'desktop',
    maxWidth: Infinity,
    start: new THREE.Vector3(0, 3, 9),
    board: new THREE.Vector3(0, 1.82, 2.35),
    languages: new THREE.Vector3(0, 2.1, 4.15)
  }
];

let currentViewportId = null;

function applyViewportTweaks(options = {}) {
  const width = window.innerWidth;
  const config =
    VIEWPORT_CONFIGS.find(cfg => width <= cfg.maxWidth) ??
    VIEWPORT_CONFIGS[VIEWPORT_CONFIGS.length - 1];
  if (!config) {
    return;
  }

  const initial = options.initial === true;
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

applyViewportTweaks({ initial: true });


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

navScrollLinks.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const targetValue = parseFloat(link.dataset.scrollProgress ?? '');
    if (!Number.isFinite(targetValue)) {
      return;
    }
    scrollToProgress(targetValue);
  });
});

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

  if (!panelGroupRef) {
    panelGroupRef = scene.getObjectByName('panelGroup');
  }

  if (panelGroupRef) {
    panelGroupRef.getWorldPosition(panelWorldPos);
    panelLookTarget.copy(panelWorldPos);
    panelLookTarget.z += 0.025; // aim slightly in front of the board
  } else {
    panelLookTarget.copy(boardTargetFallback);
  }

  // Stretch scroll progress so later overlays (experience, education, projects) can reach their timing windows.
  const overlayProgress = smoothedProgress * 3;
  const projectsProgress = smoothedProgress * 4;

  const bioAlpha = computePhaseAlpha(overlayProgress, bioTimings);
  const skillsAlpha = computePhaseAlpha(overlayProgress, skillsTimings);
  const languagesAlpha = computePhaseAlpha(overlayProgress, languagesTimings);
  const experienceAlpha = computePhaseAlpha(overlayProgress, experienceTimings);
  const educationAlpha = computePhaseAlpha(overlayProgress, educationTimings);
  let projectsAlpha = computePhaseAlpha(projectsProgress, projectsTimings);
  const educationInfluence = THREE.MathUtils.clamp(1 - educationAlpha, 0, 1);
  projectsAlpha *= educationInfluence;
  const overlayBlend = Math.max(
    bioAlpha,
    skillsAlpha,
    languagesAlpha,
    experienceAlpha,
    educationAlpha,
    projectsAlpha
  );

  const homeGroup = scene.getObjectByName('homeGroup');
  if (homeGroup) {
    const heroFadeT =
      HERO_FADE_RANGE > 0
        ? THREE.MathUtils.clamp((smoothedProgress - HERO_HIDE_PROGRESS) / HERO_FADE_RANGE, 0, 1)
        : smoothedProgress > HERO_HIDE_PROGRESS ? 1 : 0;
    const heroVisibilityFactor = 1 - heroFadeT;
    const baseOpacity = THREE.MathUtils.clamp(1 - overlayBlend * 1.4, 0, 1);
    const homeOpacity = THREE.MathUtils.clamp(baseOpacity * heroVisibilityFactor, 0, 1);
    homeGroup.visible = homeOpacity > 0.02;
    homeGroup.traverse(obj => {
      if (obj.material) {
        obj.material.transparent = true;
        obj.material.opacity = homeOpacity;
      }
    });
  }

  if (bioCard) {
    bioCard.style.opacity = bioAlpha.toFixed(3);
    const shouldBeVisible = bioAlpha > 0.05;
    if (shouldBeVisible !== bioCardCurrentlyVisible) {
      bioCard.classList.toggle('bio-card--visible', shouldBeVisible);
      bioCardCurrentlyVisible = shouldBeVisible;
    }
    bioCard.setAttribute('aria-hidden', shouldBeVisible ? 'false' : 'true');
  }

  if (skillsOverlay) {
    skillsOverlay.style.opacity = skillsAlpha.toFixed(3);
    const shouldShowSkills = skillsAlpha > 0.05;
    if (shouldShowSkills !== skillsOverlayVisible) {
      skillsOverlay.classList.toggle('skills-overlay--visible', shouldShowSkills);
      skillsOverlayVisible = shouldShowSkills;
    }
    skillsOverlay.setAttribute('aria-hidden', shouldShowSkills ? 'false' : 'true');
  }

  if (languagesOverlay) {
    languagesOverlay.style.opacity = languagesAlpha.toFixed(3);
    const shouldShowLanguages = languagesAlpha > 0.05;
    if (shouldShowLanguages !== languagesOverlayVisible) {
      languagesOverlay.classList.toggle('languages-overlay--visible', shouldShowLanguages);
      languagesOverlayVisible = shouldShowLanguages;
    }
    languagesOverlay.setAttribute('aria-hidden', shouldShowLanguages ? 'false' : 'true');
  }

  if (experienceOverlay) {
    experienceOverlay.style.opacity = experienceAlpha.toFixed(3);
    const shouldShowExperience = experienceAlpha > 0.05;
    if (shouldShowExperience !== experienceOverlayVisible) {
      experienceOverlay.classList.toggle('experience-overlay--visible', shouldShowExperience);
      experienceOverlayVisible = shouldShowExperience;
    }
    experienceOverlay.setAttribute('aria-hidden', shouldShowExperience ? 'false' : 'true');
  }

  if (educationOverlay) {
    educationOverlay.style.opacity = educationAlpha.toFixed(3);
    const shouldShowEducation = educationAlpha > 0.05;
    if (shouldShowEducation !== educationOverlayVisible) {
      educationOverlay.classList.toggle('education-overlay--visible', shouldShowEducation);
      educationOverlayVisible = shouldShowEducation;
    }
    educationOverlay.setAttribute('aria-hidden', shouldShowEducation ? 'false' : 'true');
  }

  if (projectsOverlay) {
    projectsOverlay.style.opacity = projectsAlpha.toFixed(3);
    const shouldShowProjects = projectsAlpha > 0.05;
    if (shouldShowProjects !== projectsOverlayVisible) {
      projectsOverlay.classList.toggle('projects-overlay--visible', shouldShowProjects);
      projectsOverlayVisible = shouldShowProjects;
    }
    projectsOverlay.setAttribute('aria-hidden', shouldShowProjects ? 'false' : 'true');
  }

  const normalizedZoom = CAMERA_ZOOM_PHASE_END > 0 ? smoothedProgress / CAMERA_ZOOM_PHASE_END : 1;
  const zoomT = THREE.MathUtils.clamp(normalizedZoom, 0, 1);
  const easedZoomT = easeInOutCubic(zoomT);
  desiredCameraPos.copy(startCameraPos).lerp(boardCameraPos, easedZoomT);
  desiredTarget.copy(startTarget).lerp(panelLookTarget, easedZoomT);

  camera.position.lerp(desiredCameraPos, 0.12);
  controls.target.lerp(desiredTarget, 0.12);
  controls.update();
  


  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  applyViewportTweaks();
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  updateScrollProgress();
});

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
