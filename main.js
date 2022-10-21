/**
 * This program generates a fractal tree like structure in 3D
 */

import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// actual width and height of a window
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// initial properties for a tree
const treeColour = new THREE.Color("rgb(165, 42, 42)");
const angle = Math.PI / 3;
const radius = 0.6;
const segmentLength = 40;

// configurations of a tree that can be changed later via GUI
const configurations = {
  totalDepth: 4,
  numBranches: 3,
  isAnimated: true,
};

// Set up a scene
const scene = new THREE.Scene();

// Place a camera at (0, 100, 200)
const camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 1000);
camera.position.set(0, 100, 200);

// Hemisphere light with lightblue and brownish orange colour, and 0.8 intensity
const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.8);
scene.add(hemisphereLight);

// Spotlight at (-100, 200, 50)
const spotLight = new THREE.SpotLight(0xffa95c, 1);
spotLight.position.set(-100, 200, 50);
spotLight.castShadow = true;
scene.add(spotLight);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);

// Mouse/touch control to rotate scene
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

// load texture image for the ground plane
const texture = new THREE.TextureLoader().load("ground.jpeg");

// create a ground using plane geometry and apply texturing
const groundGeometry = new THREE.PlaneGeometry(150, 150);
const groundMaterial = new THREE.MeshStandardMaterial({
  map: texture,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(ground);

// rotate the ground and apply shadow receive property to true
ground.rotation.x = -0.5 * Math.PI;
ground.receiveShadow = true;

/**
 * This functions creates a cylinder of a given height
 *
 * @param {number} height The height of the cylinder
 * @returns The cylinder mesh
 */
function createCylinder(height) {
  // cylinder geometry with narrower radius at one end
  const cylinderGeometry = new THREE.CylinderGeometry(
    Math.pow(radius, 2),
    radius,
    height,
    32
  );
  const cylinderMaterial = new THREE.MeshBasicMaterial({ color: treeColour });
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

  // change castShadow property to true
  cylinder.castShadow = true;

  // cylinder is drawn from -y/2 to +y/2. Therefore, adding height/2
  cylinder.position.y = cylinder.position.y + height / 2;

  return cylinder;
}

/**
 * This function creates a group and adds a cylinder to it
 *
 * @param {Mesh} object Cylinder
 * @param {Vector3} position The coordinate as Vector3
 * @returns The Group with mesh object in it
 */
function createGroup(object, position) {
  const group = new THREE.Group();
  group.add(object);
  group.position.set(position.x, position.y, position.z);
  return group;
}

/**
 * This function generates the branches of the tree recursively
 *
 * @param {Group} tree The parent group for the current branch
 * @param {number} depth The current depth of the branch
 * @param {number} lenBranch The length of the branch
 */
function buildTree(tree, depth, lenBranch) {
  // if current depth is less than total Depth
  if (depth <= configurations.totalDepth) {
    let i = 1;
    while (i <= configurations.numBranches) {
      // Using decay formula to get the next branch length
      let newBranchLength = lenBranch * Math.pow(Math.E, -0.1 * (i + depth));

      // create a branch
      const branch = createCylinder(newBranchLength);
      const branchPosition = new THREE.Vector3(
        0,
        (branch.position.y + i * lenBranch) / (configurations.numBranches + 1),
        0
      );

      // create a branch group
      const group = createGroup(branch, branchPosition);

      // rotate group around Y and Z-axis
      group.rotateY(2 * i * angle);
      group.rotateZ(angle);

      // add branch group to the parent branch group
      tree.add(group);

      // create more branches by recursively calling the method
      buildTree(group, depth + 1, newBranchLength);

      // increase the value of i by 1
      i++;
    }
  }
}

// create parent group and trunk of the tree
const fractalTree = new THREE.Group();
const trunk = createCylinder(segmentLength);

// add trunk to the tree
fractalTree.add(trunk);
// add tree to the scene
scene.add(fractalTree);

/**
 * This function clears the children first and generates again
 *
 * This functionality is needed to make depth and braches gui interaction working.
 * Otherwise, branches/tree would be generated on top of the previous tree.
 */
function clearAndBuildTree() {
  // get the children of a fractalTree
  let children = fractalTree.children;
  // remove all branches
  for (let child of children) {
    child.remove(...child.children);
  }

  // once tree is cleared, add trunk to tree
  fractalTree.add(trunk);

  // build tree
  buildTree(fractalTree, 0, segmentLength);
}

clearAndBuildTree();

/**
 * This function animates the child branches recursively
 * by rotating around y-axis
 *
 * @param {Group} fractalTree The parent tree
 */
function startTreeAnimation(fractalTree) {
  // get the children of a fractalTree
  let children = fractalTree.children;
  for (let child of children) {
    startTreeAnimation(child);
    // set the rotation around y-axis
    child.rotation.y += 0.004;
  }
}

// setting up the (depth, branch, animation) GUI for user interaction
const gui = new dat.GUI();

// GUI for Depth
gui
  .add(configurations, "totalDepth", 0, 5, 1)
  .onFinishChange(clearAndBuildTree)
  .name("Depth");

// GUI for Branch
gui
  .add(configurations, "numBranches", 0, 10, 1)
  .onFinishChange(clearAndBuildTree)
  .name("Branch");

// GUI for tree rotation/animation
gui.add(configurations, "isAnimated").name("Animation");

/**
 * This function renders the scene
 */
function animate() {
  renderer.render(scene, camera);
  if (configurations.isAnimated == true) startTreeAnimation(fractalTree);
}
renderer.setAnimationLoop(animate);

// maintain the aspect ratio when window is resized
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
