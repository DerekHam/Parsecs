import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg') });
renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.set(0, 0, 20);

const systems = [
  { name: 'Alpha', pos: [0, 0, 0] },
  { name: 'Beta', pos: [10, 5, -5] },
  { name: 'Gamma', pos: [-8, 3, 7] }
];

systems.forEach(s => {
  const geom = new THREE.SphereGeometry(0.3, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const star = new THREE.Mesh(geom, mat);
  star.position.set(...s.pos);
  star.userData = { name: s.name };
  scene.add(star);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selected = [];

function drawLine(a, b) {
  const geom = new THREE.BufferGeometry().setFromPoints([a, b]);
  const mat = new THREE.LineBasicMaterial({ color: 0x00ffff });
  const line = new THREE.Line(geom, mat);
  scene.add(line);
  setTimeout(() => scene.remove(line), 3000);
}

function showLabel(text, x, y) {
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = text;
  label.style.left = `${x}px`;
  label.style.top = `${y}px`;
  document.body.appendChild(label);
  setTimeout(() => label.remove(), 3000);
}

window.addEventListener('click', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    const star = intersects[0].object;
    selected.push(star);
    if (selected.length === 2) {
      const [a, b] = selected.map(s => s.position);
      const dist = a.distanceTo(b).toFixed(2);
      drawLine(a, b);
      showLabel(`Distance: ${dist} ly`, e.clientX, e.clientY);
      selected = [];
    }
  }
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
