window.addEventListener('DOMContentLoaded', () => {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5); // ⬅ Start farther away
  // camera.position.set(0, 2, 10); // ⬅ Start farther away

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const container = document.getElementById("viewer-container");
  if (!container) {
    console.error("❌ #viewer-container not found in HTML!");
    return;
  }
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0xffffff, 2);
  spotLight.position.set(5, 10, 5);
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  scene.add(spotLight);

  // Shadow ground
  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
  const shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Load model
  const loader = new THREE.GLTFLoader();
  let model;
  loader.load(
    // '/3d/donat.glb',
    '/3d/Mobile_Milk_Cart_0529075840_texture.glb',
    (gltf) => {
      console.log("✅ Model loaded successfully.");
      model = gltf.scene;
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      model.position.set(0, -1, -.5);   // model position
      // model.position.set(0, -1, -1.5);   // model position
      model.scale.set(1.5, 1.5, 1.5);
      scene.add(model);
    },
    undefined,
    (error) => {
      console.error('❌ Model loading error:', error);
    }
  );

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false; // Disable scroll zoom to avoid conflicts
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 10;
  controls.minPolarAngle = 0; // Full vertical rotation
  controls.maxPolarAngle = Math.PI; // Full vertical rotation

  // Manual Zoom Buttons
  const zoomControls = document.createElement('div');
  zoomControls.innerHTML = `
    <style>
      .zoom-btns {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
      }
      .zoom-btns button {
        padding: 10px 15px;
        background: #333;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 18px;
      }
      .zoom-btns button:hover {
        background: #555;
      }
    </style>
    <div class="zoom-btns">
      <button id="zoom-in">＋</button>
      <button id="zoom-out">－</button>
    </div>
  `;
  document.body.appendChild(zoomControls);

  document.getElementById('zoom-in').addEventListener('click', () => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    camera.position.addScaledVector(direction, -0.5); // zoom in
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    camera.position.addScaledVector(direction, 0.5); // zoom out
  });

  // Animate
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Responsive
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
