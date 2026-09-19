import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';

document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // PAGE ELEMENTS
  // ============================================================

  const firstPage = document.getElementById("firstPage");
  const simulateButton = document.getElementById("simulateButton");
  const instructionsText = document.getElementById("instructionsText");
  const instructionsPopup = document.getElementById("instructionsPopup");
  const closeInstructions = document.getElementById("closeInstructions");
  const canvas = document.querySelector(".webgl");
  const backToWelcome = document.getElementById("backToWelcome");

  let isSceneInitialized = false;

  // ============================================================
  // START SIMULATOR
  // ============================================================

  simulateButton.addEventListener("click", () => {
    firstPage.style.display = "none";
    canvas.style.display = "block";
    backToWelcome.style.display = "block";

    if (!isSceneInitialized) {
      initializeScene();
      isSceneInitialized = true;
    }
  });

  // ============================================================
  // RETURN TO WELCOME PAGE
  // ============================================================

  backToWelcome.addEventListener("click", () => {
    canvas.style.display = "none";
    backToWelcome.style.display = "none";
    firstPage.style.display = "flex";
  });

  // ============================================================
  // INSTRUCTIONS
  // ============================================================

  instructionsText.addEventListener("click", () => {
    instructionsPopup.classList.remove("hidden");
  });

  closeInstructions.addEventListener("click", () => {
    instructionsPopup.classList.add("hidden");
  });

  // ============================================================
  // THREE.JS SCENE
  // ============================================================

  function initializeScene() {
    // ------------------------------------------------------------
    // SIZES
    // ------------------------------------------------------------

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // ------------------------------------------------------------
    // GUI
    // ------------------------------------------------------------

    const gui = new dat.GUI();

    gui.domElement.style.position = "fixed";
    gui.domElement.style.left = "20px";
    gui.domElement.style.top = "20px";
    gui.domElement.style.fontSize = "13px";
    gui.domElement.style.fontFamily = "'IBM Plex Mono', monospace";
    gui.domElement.style.zIndex = "20";

    // ------------------------------------------------------------
    // CANVAS
    // ------------------------------------------------------------

    const canvas = document.querySelector("canvas.webgl");

    // ==============================================================
    // THREE.JS SETUP
    // ==============================================================

    const scene = new THREE.Scene();

    // Transparent scene.
    // This allows the CSS background behind the canvas to show.
    scene.background = null;

    // ------------------------------------------------------------
    // CAMERA
    // ------------------------------------------------------------

    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    );

    // Closer default view
    camera.position.set(0, 3.5, 9);

    scene.add(camera);

    // ------------------------------------------------------------
    // RENDERER
    // ------------------------------------------------------------

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ==============================================================
    // ORBIT CONTROLS
    // ==============================================================

    const controls = new OrbitControls(camera, canvas);

    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.enableDamping = true;

    controls.target.set(0, 1, 0);

    // ==============================================================
    // LIGHTING
    // ==============================================================

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;

    scene.add(directionalLight);

    // ==============================================================
    // BALL
    // ==============================================================

    const textureLoader = new THREE.TextureLoader();

    const ballCoat = textureLoader.load(
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMDlLaRsqYBIGrnI24hdTp_VdpjUwU16Hf-Q&s"
    );

    const ballMaterial = new THREE.MeshStandardMaterial({
      map: ballCoat,
      roughness: 0.5,
      metalness: 0.5,
    });

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 32, 32),
      ballMaterial
    );

    ball.position.set(-7, 1.25, 0);
    ball.castShadow = true;

    scene.add(ball);

    // ==============================================================
    // GROUND
    // ==============================================================

    const groundMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.9,
      reflectivity: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0,
      side: THREE.DoubleSide,
    });

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 5),
      groundMaterial
    );

    ground.rotation.x = -Math.PI * 0.5;
    ground.receiveShadow = true;

    scene.add(ground);

    // ==============================================================
    // GROUND BORDERS
    // ==============================================================

    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });

    const leftBorder = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.1, 0.2),
      borderMaterial
    );

    leftBorder.position.set(0, -0.01, 2.6);

    scene.add(leftBorder);

    const rightBorder = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.1, 0.2),
      borderMaterial
    );

    rightBorder.position.set(0, -0.01, -2.6);

    scene.add(rightBorder);

    // ==============================================================
    // LAUNCH HEIGHT BOX
    // ==============================================================

    const launchBoxGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);

    const launchBoxMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8,
    });

    const launchBox = new THREE.Mesh(launchBoxGeometry, launchBoxMaterial);

    launchBox.position.set(-7, 0.5, 0);
    launchBox.castShadow = true;
    launchBox.receiveShadow = true;

    scene.add(launchBox);

    // ==============================================================
    // HEIGHT LABEL
    // ==============================================================

    const heightLabel = document.createElement("div");

    heightLabel.id = "launchHeightLabel";
    heightLabel.textContent = "100 cm";

    heightLabel.style.position = "fixed";
    heightLabel.style.transform = "translate(-50%, -50%)";
    heightLabel.style.fontFamily = "'IBM Plex Mono', monospace";
    heightLabel.style.fontSize = "14px";
    heightLabel.style.fontWeight = "600";
    heightLabel.style.color = "#000";
    heightLabel.style.background = "rgba(255,255,255,0.85)";
    heightLabel.style.padding = "4px 8px";
    heightLabel.style.borderRadius = "4px";
    heightLabel.style.pointerEvents = "none";
    heightLabel.style.zIndex = "25";

    document.body.appendChild(heightLabel);

    // ==============================================================
    // CANNON PHYSICS WORLD
    // ==============================================================

    const world = new CANNON.World();

    world.broadphase = new CANNON.SAPBroadphase(world);
    world.gravity.set(0, -9.82, 0);

    const defaultMaterial = new CANNON.Material("default");

    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.1,
        restitution: 0.7,
      }
    );

    world.defaultContactMaterial = defaultContactMaterial;

    // ==============================================================
    // PHYSICS GROUND
    // ==============================================================

    const groundShape = new CANNON.Box(new CANNON.Vec3(7.5, 0.25, 2.5));

    const groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.25, 0),
    });

    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    // ==============================================================
    // PHYSICS LAUNCH BOX
    // ==============================================================

    let launchBoxBody = null;

    function updateLaunchBoxPhysics(height) {
      // Remove previous box
      if (launchBoxBody) {
        world.removeBody(launchBoxBody);
        launchBoxBody = null;
      }

      // No box at zero height
      if (height <= 0) {
        return;
      }

      const boxShape = new CANNON.Box(
        new CANNON.Vec3(0.75, height / 2, 0.75)
      );

      launchBoxBody = new CANNON.Body({
        mass: 0,
        material: defaultMaterial,
      });

      launchBoxBody.addShape(boxShape);

      // Bottom of box = floor
      launchBoxBody.position.set(-7, height / 2, 0);

      world.addBody(launchBoxBody);
    }

    // ==============================================================
    // PHYSICS BALL
    // ==============================================================

    const ballShape = new CANNON.Sphere(0.25);

    const ballBody = new CANNON.Body({
      mass: 5,
      material: defaultMaterial,
    });

    ballBody.addShape(ballShape);
    ballBody.position.set(-7, 1.25, 0);

    world.addBody(ballBody);

    // ==============================================================
    // PROJECTILE TRAJECTORY
    // ==============================================================

    let trajectoryLine = null;

    function clearTrajectory() {
      if (trajectoryLine) {
        scene.remove(trajectoryLine);

        trajectoryLine.geometry.dispose();
        trajectoryLine.material.dispose();

        trajectoryLine = null;
      }
    }

    function drawTrajectory() {
      clearTrajectory();

      const angle = THREE.MathUtils.degToRad(settings.angle);
      const velocity = settings.velocity;
      const height = settings.launchHeight;
      const gravity = 9.82;

      // ------------------------------------------------------------
      // Initial velocity components
      // ------------------------------------------------------------

      const vx = velocity * Math.cos(angle);
      const vy = velocity * Math.sin(angle);

      // ------------------------------------------------------------
      // Determine time until projectile reaches floor
      //
      // y(t) = h + vy*t - 1/2*g*t²
      //
      // Solve y(t) = 0
      // ------------------------------------------------------------

      const discriminant = vy * vy + 2 * gravity * height;
      const flightTime = (vy + Math.sqrt(discriminant)) / gravity;

      // ------------------------------------------------------------
      // Generate trajectory points
      // ------------------------------------------------------------

      const points = [];
      const numberOfPoints = 100;

      for (let i = 0; i <= numberOfPoints; i++) {
        const t = (flightTime * i) / numberOfPoints;

        const x = -7 + vx * t;
        const y = height + vy * t - 0.5 * gravity * t * t;

        // Keep final point exactly at floor
        const finalY = Math.max(y, 0);

        points.push(new THREE.Vector3(x, finalY, 0));
      }

      // ------------------------------------------------------------
      // Create dashed line
      // ------------------------------------------------------------

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineDashedMaterial({
        color: 0x000000,
        dashSize: 0.18,
        gapSize: 0.12,
        linewidth: 1,
      });

      trajectoryLine = new THREE.Line(geometry, material);

      trajectoryLine.computeLineDistances();

      scene.add(trajectoryLine);
    }

    // ==============================================================
    // OBJECTS TO UPDATE
    // ==============================================================

    const objectsToUpdate = [
      {
        mesh: ball,
        body: ballBody,
      },
    ];

    // ==============================================================
    // GUI SETTINGS
    // ==============================================================

    const settings = {
      angle: 45,
      velocity: 10,
      mass: 5,

      // Default = 1 meter = 100 cm
      launchHeight: 1.0,

      // ------------------------------------------------------------
      // RESET
      // ------------------------------------------------------------

      reset: () => {
        clearTrajectory();

        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);
        ballBody.position.set(-7, settings.launchHeight, 0);

        ballBody.mass = settings.mass;
        ballBody.updateMassProperties();
      },

      // ------------------------------------------------------------
      // LAUNCH
      // ------------------------------------------------------------

      launch: () => {
        // Apply selected mass
        ballBody.mass = settings.mass;
        ballBody.updateMassProperties();

        // Convert degrees → radians
        const angleInRadians = THREE.MathUtils.degToRad(settings.angle);

        // IMPORTANT:
        // Velocity is NOT divided by mass.
        //
        // In ideal projectile motion,
        // mass does not affect the trajectory.
        const speed = settings.velocity;

        const vx = speed * Math.cos(angleInRadians);
        const vy = speed * Math.sin(angleInRadians);

        // Stop existing motion
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);

        // Make sure ball starts at selected height
        ballBody.position.set(-7, settings.launchHeight, 0);

        // Apply projectile velocity
        ballBody.velocity.set(vx, vy, 0);

        // Draw mathematical trajectory
        drawTrajectory();
      },
    };

    // ==============================================================
    // GUI CONTROLS
    // ==============================================================

    gui.add(settings, "angle", 0, 90, 1).name("Launch Angle (°)");
    gui.add(settings, "velocity", 0, 100, 1).name("Launch Velocity (m/s)");
    gui.add(settings, "mass", 0.1, 100, 0.1).name("Ball Mass (kg)");

    gui
      .add(settings, "launchHeight", 0, 10, 0.1)
      .name("Launch Height (m)")
      .onChange(() => {
        updateLaunchHeight();

        // Changing height invalidates
        // the old predicted trajectory.
        clearTrajectory();
      });

    gui.add(settings, "reset").name("Reset");
    gui.add(settings, "launch").name("Launch");

    // ==============================================================
    // UPDATE LAUNCH HEIGHT
    // ==============================================================

    function updateLaunchHeight() {
      const height = settings.launchHeight;

      // ------------------------------------------------------------
      // Visual box
      // ------------------------------------------------------------

      if (height <= 0) {
        launchBox.visible = false;
      } else {
        launchBox.visible = true;

        // Original box height = 1
        // Scaling Y directly makes it
        // represent the selected height.
        launchBox.scale.set(1, height, 1);

        // Bottom of box stays at y = 0
        launchBox.position.set(-7, height / 2, 0);
      }

      // ------------------------------------------------------------
      // Ball
      //
      // Ball center is placed at launch height.
      // ------------------------------------------------------------

      ballBody.velocity.set(0, 0, 0);
      ballBody.angularVelocity.set(0, 0, 0);
      ballBody.position.set(-7, height, 0);

      // ------------------------------------------------------------
      // Physics box
      // ------------------------------------------------------------

      updateLaunchBoxPhysics(height);

      // ------------------------------------------------------------
      // Height label
      // ------------------------------------------------------------

      heightLabel.textContent = `${Math.round(height * 100)} cm`;
    }

    // Initialize height
    updateLaunchHeight();

    // ==============================================================
    // ANIMATION
    // ==============================================================

    const clock = new THREE.Clock();
    let oldElapsedTime = 0;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - oldElapsedTime;
      oldElapsedTime = elapsedTime;

      // ------------------------------------------------------------
      // Physics
      // ------------------------------------------------------------

      world.step(1 / 80, deltaTime, 3);

      // ------------------------------------------------------------
      // Update meshes
      // ------------------------------------------------------------

      for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
      }

      // ------------------------------------------------------------
      // Orbit controls
      // ------------------------------------------------------------

      controls.update();

      // ==============================================================
      // HEIGHT LABEL POSITION
      // ==============================================================

      if (launchBox.visible) {
        const labelPosition = new THREE.Vector3(
          -6.1,
          settings.launchHeight / 2,
          0
        );

        labelPosition.project(camera);

        const x = (labelPosition.x * 0.5 + 0.5) * sizes.width;
        const y = (-labelPosition.y * 0.5 + 0.5) * sizes.height;

        heightLabel.style.display = "block";
        heightLabel.style.left = `${x}px`;
        heightLabel.style.top = `${y}px`;
      } else {
        heightLabel.style.display = "none";
      }

      // ------------------------------------------------------------
      // Render
      // ------------------------------------------------------------

      renderer.render(scene, camera);

      window.requestAnimationFrame(tick);
    };

    // ==============================================================
    // RESIZE
    // ==============================================================

    window.addEventListener("resize", () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // ==============================================================
    // START
    // ==============================================================

    tick();
  }
});