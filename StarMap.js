// Ensure Three.js and OrbitControls are loaded before running
if (typeof THREE === 'undefined') {
  console.error('Three.js failed to load. Check the script source.');
  return;
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Fetch star map data from the wiki
  const wikiUrl = 'https://yourwiki.fandom.com/wiki/StarMapData?action=raw';
  fetch(wikiUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch StarMapData: ' + response.status);
      return response.text();
    })
    .then(data => {
      let starMapData;
      try {
        starMapData = JSON.parse(data);
      } catch (e) {
        throw new Error('Invalid JSON in StarMapData: ' + e.message);
      }

      // Initialize Three.js scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 600, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, 600);
      const container = document.getElementById('starMapContainer');
      if (!container) throw new Error('StarMapContainer not found in the DOM.');
      container.appendChild(renderer.domElement);

      // Add OrbitControls
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Add stars
      const starMeshes = [];
      if (!starMapData.stars || !Array.isArray(starMapData.stars)) {
        throw new Error('StarMapData.stars is missing or not an array.');
      }
      starMapData.stars.forEach(star => {
        if (!star.position || typeof star.position.x !== 'number') {
          console.warn('Invalid star position:', star);
          return;
        }
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: star.color || 0xffffff });
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
        if (star.solarSystem && star.solarSystem.planets) {
          star.solarSystem.planets.forEach(planet => {
            const geometry = new THREE.SphereGeometry(0.1, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color: planet.color || 0xffffff });
            const planetMesh = new THREE.Mesh(geometry, material);
            planetMesh.position.set(star.position.x + (planet.distance || 1), star.position.y, star.position.z);
            scene.add(planetMesh);
            currentSystem.push(planetMesh);
          });
        }
        const infoPanel = document.getElementById('infoPanel');
        if (infoPanel) {
          infoPanel.style.display = 'block';
          infoPanel.innerHTML = `
            <h3>${star.name || 'Unknown Star'}</h3>
            <p>Type: ${star.type || 'Unknown'}</p>
            <p>Planets: ${(star.solarSystem && star.solarSystem.planets) ? star.solarSystem.planets.map(p => p.name).join(', ') : 'None'}</p>
          `;
        }
      }

      container.addEventListener('click', onClick);
      const resetButton = document.getElementById('resetView');
      if (resetButton) {
        resetButton.addEventListener('click', () => {
          camera.position.set(0, 0, 20);
          controls.target.set(0, 0, 0);
          if (currentSystem) {
            currentSystem.forEach(obj => scene.remove(obj));
            currentSystem = null;
          }
          const infoPanel = document.getElementById('infoPanel');
          if (infoPanel) infoPanel.style.display = 'none';
        });
      }

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
    })
    .catch(error => {
      console.error('Star Map Error:', error.message);
      const container = document.getElementById('starMapContainer');
      if (container) {
        container.innerHTML += '<p style="color: red; text-align: center;">Error loading star map: ' + error.message + '</p>';
      }
    });
});
