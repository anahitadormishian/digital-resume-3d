const THREE = window.THREE;
const GLTFLoader = THREE.GLTFLoader;
const FontLoader = THREE.FontLoader;
const TextGeometry = THREE.TextGeometry;

export function createHomeScene(scene) {
  if (!scene) {
    console.warn('createHomeScene called without a valid scene.');
    return;
  }

  if (!THREE || !GLTFLoader || !FontLoader || !TextGeometry) {
    console.error('Three.js loaders/geometries are missing. Ensure the global scripts are loaded before main.js.');
    return;
  }

  const homeGroup = new THREE.Group();
  homeGroup.name = 'homeGroup';
  scene.add(homeGroup);

  // Scene lighting specific to the home view.
  const keyLight = new THREE.DirectionalLight(0xffffff, 1);
  keyLight.position.set(3, 5, 3);
  const fillLight = new THREE.AmbientLight(0xffffff, 0.4);
  homeGroup.add(keyLight, fillLight);

  // Earth sphere that sits beneath the character.
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load('images/earth_texture.jpg');
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 64, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      metalness: 0.2,
      roughness: 0.9
    })
  );
  earth.position.y = -1;
  earth.receiveShadow = true;
  homeGroup.add(earth);

  // Load the main character model.
  const loader = new GLTFLoader();
  loader.load('models/character_ready.glb', (gltf) => {
    const character = gltf.scene;
    character.name = 'homeCharacter';
    character.scale.set(1.5, 1.5, 1.5);
    character.position.set(0, 0.4, 0);
    character.traverse((obj) => {
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    homeGroup.add(character);

    const panelGroup = new THREE.Group();
    panelGroup.name = 'panelGroup';
    panelGroup.position.set(0, 1.0, 0.6);

    const panelWidth = 1.1;
    const panelHeight = 0.55;
    const panelDepth = 0.06;

    const panelBack = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth),
      new THREE.MeshStandardMaterial({ color: 0xf8ead4 })
    );
    panelBack.castShadow = true;
    panelBack.receiveShadow = true;
    panelGroup.add(panelBack);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth + 0.05, panelHeight + 0.05, panelDepth / 2),
      new THREE.MeshStandardMaterial({ color: 0xc49a6c })
    );
    frame.castShadow = true;
    frame.receiveShadow = true;
    frame.position.z = -panelDepth / 2;
    panelGroup.add(frame);

    panelGroup.position.z += 0.08;
    character.add(panelGroup);

    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      const textGeo = new TextGeometry('Welcome to Anahita portfolio', {
        font,
        size: 0.4,
        height: 0.08,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.015,
        bevelSegments: 3
      });
      textGeo.center();

      const textMat = new THREE.MeshStandardMaterial({
        color: 0xff66cc,
        metalness: 0.5,
        roughness: 0.4
      });

      const textMesh = new THREE.Mesh(textGeo, textMat);
      textMesh.position.set(0, 3.4, -1.2);
      textMesh.castShadow = true;
      textMesh.receiveShadow = true;
      homeGroup.add(textMesh);

      const boardTextGeo = new TextGeometry('Bonjour, je suis Anahita.', {
        font,
        size: 0.075,
        height: 0.02,
        bevelEnabled: false
      });
      boardTextGeo.center();

      const boardTextMat = new THREE.MeshStandardMaterial({
        color: 0x2a1f1a,
        metalness: 0.2,
        roughness: 0.7
      });

      const boardText = new THREE.Mesh(boardTextGeo, boardTextMat);
      boardText.position.set(0, 0.04, panelDepth / 2 + 0.005);
      boardText.castShadow = true;
      boardText.receiveShadow = true;
      panelGroup.add(boardText);

      const subtitleMat = new THREE.MeshStandardMaterial({
        color: 0x4a342a,
        metalness: 0.15,
        roughness: 0.75
      });

      const lineOneGeo = new TextGeometry('Ingenieure biomedicale', {
        font,
        size: 0.05,
        height: 0.015,
        bevelEnabled: false
      });
      lineOneGeo.center();
      const lineOne = new THREE.Mesh(lineOneGeo, subtitleMat);
      lineOne.position.set(0, -0.1, panelDepth / 2 + 0.004);
      lineOne.castShadow = true;
      lineOne.receiveShadow = true;

      const lineTwoGeo = new TextGeometry('& etudiante en informatique & IA', {
        font,
        size: 0.045,
        height: 0.015,
        bevelEnabled: false
      });
      lineTwoGeo.center();
      const lineTwo = new THREE.Mesh(lineTwoGeo, subtitleMat);
      lineTwo.position.set(0, -0.17, panelDepth / 2 + 0.004);
      lineTwo.castShadow = true;
      lineTwo.receiveShadow = true;

      panelGroup.add(lineOne, lineTwo);
    });

    let wave = 0;
    function animateWave() {
      requestAnimationFrame(animateWave);
      wave += 0.05;
      character.rotation.y = 0;
      earth.rotation.y += 0.0015;
    }
    animateWave();
  });

  return homeGroup;
}
