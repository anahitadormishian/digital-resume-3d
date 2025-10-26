// === Languages Scene ===
const THREE = window.THREE;

export function createLanguagesScene(scene) {
  if (!scene || !THREE) {
    console.warn('createLanguagesScene called without required Three.js context.');
    return;
  }

  // 🎯 گروه جدا برای زبان‌ها
  const languagesGroup = new THREE.Group();
  languagesGroup.name = 'languagesGroup';
  languagesGroup.visible = false;
  languagesGroup.position.set(0, 0.25, 0.45);
  scene.add(languagesGroup);

  // 🌄 نور مخصوص صحنه زبان‌ها
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(3, 5, 5);
  languagesGroup.add(ambient, dirLight);

  // 🌌 پس‌زمینه (اختیاری)
  const textureLoader = new THREE.TextureLoader();
  const bg = textureLoader.load('images/space-bg.jpg');
  scene.background = bg;

  // 🌍 سیاره‌های زبان‌ها
  const langs = [
    { label: 'French', proficiency: 'B1 - B2', x: -2.4, flag: '🇫🇷' },
    { label: 'English', proficiency: 'B2', x: 0, flag: '🇬🇧' },
    { label: 'Persian', proficiency: 'langue maternelle', x: 2.3, flag: '🇮🇷' },
  ];

  langs.forEach((lang) => {
    // ✨ برچسب روی هر زبان
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 720;
    canvas.height = 260;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // خط اول: پرچم + نام زبان
    ctx.font = '700 66px "Poppins", sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${lang.flag}  ${lang.label}`, canvas.width / 2, canvas.height * 0.4);

    // خط دوم: سطح مهارت
    ctx.font = '600 44px "Nunito", "Poppins", sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffd166';
    ctx.fillText(lang.proficiency, canvas.width / 2, canvas.height * 0.84);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false
      })
    );
    label.scale.set(3.2, 1.7, 1);
    label.position.set(lang.x, 1.0, 0.6);
    label.renderOrder = 5;
    languagesGroup.add(label);
  });

  // 🔁 انیمیشن نرم برای لیبل‌ها
  function animatePlanets() {
    requestAnimationFrame(animatePlanets);
    const time = performance.now() * 0.001;
    languagesGroup.children.forEach((child) => {
      if (child.isSprite) {
        child.position.y = 1.4 + Math.sin(time + child.position.x) * 0.08;
      }
    });
  }
  animatePlanets();
}
