// Load star map data from the wiki
$.get('https://parsecs.fandom.com/wiki/StarMapData?action=raw', function(data) {
  const starMapData = JSON.parse(data);

  // Initialize Three.js scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 600, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, 600);
  document.getElementById('starMapContainer').appendChild(renderer.domElement);

  // Add OrbitControls for navigation
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Add stars
  const starMeshes = [];
  starMapData.stars.forEach(star => {
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: star.color });
    const starMesh = new THREE.Mesh(geometry, material);
    starMesh.position.set(star.position.x, star.position.y, star.position.z);
    starMesh.userData = star;
    scene.add(starMesh);
    starMeshes.push(starMesh);
  });

  // Add background stars
  const starFieldGeometry = new THREE.BufferGeometry();
  const starFieldPositions = new Float32Array(1000 * 3);
  for (let i = 0; i < 1000; i++) {
    starFieldPositions[i * 3] = (Math.random() - 0.5) * 100;
    starFieldPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    starFieldPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }
  starFieldGeometry.setAttribute('position', new THREE.BufferAttribute(starFieldPositions, 3));
  const starFieldMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
  const starField = new THREE.Points(starFieldGeometry, starFieldMaterial);
  scene.add(starField);

  // Camera setup
  camera.position.z = 20;

  // Raycaster for clicking stars
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let currentSystem = null;

  function onClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / 600) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(starMeshes);
    if (intersects.length > 0) {
      const star = intersects[0].object.userData;
      showSolarSystem(star);
    }
  }

  function showSolarSystem(star) {
    if (currentSystem) {
      currentSystem.forEach(obj => scene.remove(obj));
    }
    currentSystem = [];
    camera.position.set(star.position.x, star.position.y, star.position.z + 5);
    controls.target.set(star.position.x, star.position.y, star.position.z);
    star.solarSystem.planets.forEach(planet => {
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: planet.color });
      const planetMesh = new THREE.Mesh(geometry, material);
      planetMesh.position.set(star.position.x + planet.distance, star.position.y, star.position.z);
      scene.add(planetMesh);
      currentSystem.push(planetMesh);
    });
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.style.display = 'block';
    infoPanel.innerHTML = `
      <h3>${star.name}</h3>
      <p>Type: ${star.type}</p>
      <p>Planets: ${star.solarSystem.planets.map(p => p.name).join(', ')}</p>
    `;
  }

  document.getElementById('starMapContainer').addEventListener('click', onClick);
  document.getElementById('resetView').addEventListener('click', () => {
    camera.position.set(0, 0, 20);
    controls.target.set(0, 0, 0);
    if (currentSystem) {
      currentSystem.forEach(obj => scene.remove(obj));
      currentSystem = null;
    }
    document.getElementById('infoPanel').style.display = 'none';
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / 600;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, 600);
  });
});
