import {FBXAnimationControls} from "./FBXAnimationControls";

const renderingContainer = document.querySelector(".container");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	10000
);
const clock = new THREE.Clock();
camera.position.set(0, 250, 250);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderingContainer.appendChild(renderer.domElement);

const orbitControls = new THREE.OrbitControls(
	camera,
	renderer.domElement
);
orbitControls.update();

const animationControls = new FBXAnimationControls(
	renderingContainer,
	clock,
	{}
);

scene.background = new THREE.Color(0xa0a0a0);
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

const light2 = new THREE.DirectionalLight(0xffffff);
light2.castShadow = true;
light2.shadow.camera.top = 180;
light2.shadow.camera.bottom = -100;
light2.shadow.camera.left = -120;
light2.shadow.camera.right = 120;
scene.add(light2);

const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
grid.material.opacity = 0.2;
grid.material.transparent = true;
scene.add(grid);

const loader = new THREE.FBXLoader();
const now = performance.now();
loader.load(
	"../models/Samba Dancing.fbx",
	function (fbx) {
		window.fbx = fbx;
		scene.add(fbx);
		animationControls.attach(fbx, { needPlay: true });
		console.log(`time left: ${performance.now() - now}`);
	},
	undefined,
	(e) => console.log(e)
);

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

const animate = function () {
	requestAnimationFrame(animate);
	orbitControls.update();
	animationControls.update();
	renderer.render(scene, camera);
};

animate();
