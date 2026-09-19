import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';

document.addEventListener("DOMContentLoaded", () => {
  // =============================================================
  // PAGE ELEMENTS
  // =============================================================

  const firstPage = document.getElementById("firstPage");
  const simulateButton = document.getElementById("simulateButton");
  const instructionsText = document.getElementById("instructionsText");
  const instructionsPopup = document.getElementById("instructionsPopup");
  const closeInstructions = document.getElementById("closeInstructions");
  const canvas = document.querySelector(".webgl");
  const backToWelcome = document.getElementById("backToWelcome");

  let isSceneInitialized = false;

  // =============================================================
  // ENTER SIMULATOR
  // =============================================================

  simulateButton.addEventListener("click", () => {
    firstPage.style.display = "none";
    canvas.style.display = "block";
    backToWelcome.style.display = "block";

    if (!isSceneInitialized) {
      initializeScene();
      isSceneInitialized = true;
    }
  });

  // =============================================================
  // RETURN TO WELCOME PAGE
  // =============================================================

  backToWelcome.addEventListener("click", () => {
    canvas.style.display = "none";
    backToWelcome.style.display = "none";
    firstPage.style.display = "flex";
  });

  backToWelcome.addEventListener("click", () => {
  // Hide simulator
  canvas.style.display = "none";
  backToWelcome.style.display = "none";

  // Show home page
  firstPage.style.display = "flex";

  // Hide simulator UI
  if (isSceneInitialized) {
    const guiElement = document.querySelector(".lil-gui");

    if (guiElement) {
      guiElement.style.display = "none";
    }

    const projectileInfo = document.getElementById("projectileInfo");

    if (projectileInfo) {
      projectileInfo.style.display = "none";
    }

    const heightLabel = document.getElementById("launchHeightLabel");

    if (heightLabel) {
      heightLabel.style.display = "none";
    }
  }
});

  

  // =============================================================
  // INSTRUCTIONS
  // =============================================================

  instructionsText.addEventListener("click", () => {
    instructionsPopup.classList.remove("hidden");
  });

  closeInstructions.addEventListener("click", () => {
    instructionsPopup.classList.add("hidden");
  });

  // =============================================================
  // THREE.JS SCENE
  // =============================================================

  function initializeScene() {
    // -----------------------------------------------------------
    // SIZES
    // -----------------------------------------------------------

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // -----------------------------------------------------------
    // GUI
    // -----------------------------------------------------------

    const gui = new dat.GUI();

    gui.domElement.style.position = "fixed";
    gui.domElement.style.left = "20px";
    gui.domElement.style.top = "20px";
    gui.domElement.style.fontSize = "13px";
    gui.domElement.style.fontFamily = "'IBM Plex Mono', monospace";
    gui.domElement.style.zIndex = "20";

    // =============================================================
    // MAKE GUI DRAGGABLE
    // =============================================================

    let isDraggingGUI = false;
    let guiOffsetX = 0;
    let guiOffsetY = 0;

    const guiTitle = gui.domElement.querySelector(".title");

    if (guiTitle) {
      guiTitle.style.cursor = "move";

      guiTitle.addEventListener("mousedown", (event) => {
        isDraggingGUI = true;

        const rect = gui.domElement.getBoundingClientRect();

        guiOffsetX = event.clientX - rect.left;
        guiOffsetY = event.clientY - rect.top;

        event.preventDefault();
      });
    }

    document.addEventListener("mousemove", (event) => {
      if (!isDraggingGUI) return;

      const newLeft = event.clientX - guiOffsetX;
      const newTop = event.clientY - guiOffsetY;

      gui.domElement.style.left = `${newLeft}px`;
      gui.domElement.style.top = `${newTop}px`;
    });

    document.addEventListener("mouseup", () => {
      isDraggingGUI = false;
    });

    // -----------------------------------------------------------
    // CANVAS
    // -----------------------------------------------------------

    const canvas = document.querySelector("canvas.webgl");

    // =============================================================
    // THREE.JS SETUP
    // =============================================================

    const scene = new THREE.Scene();

    // Transparent scene so the CSS background is visible
    scene.background = null;

    // -----------------------------------------------------------
    // CAMERA
    // -----------------------------------------------------------

    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      150
    );

    camera.position.set(0, 4, 12);

    scene.add(camera);

    // -----------------------------------------------------------
    // RENDERER
    // -----------------------------------------------------------

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // =============================================================
    // ORBIT CONTROLS
    // =============================================================

    const controls = new OrbitControls(camera, canvas);

    controls.minDistance = 5;
    controls.maxDistance = 60;
    controls.enableDamping = true;

    // =============================================================
    // LIGHTING
    // =============================================================

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;

    scene.add(directionalLight);

    // =============================================================
    // BALL
    // =============================================================

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

    // =============================================================
    // LONGER GROUND
    // =============================================================

    const FLOOR_LENGTH = 30;
    const FLOOR_WIDTH = 5;

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
      new THREE.PlaneGeometry(FLOOR_LENGTH, FLOOR_WIDTH),
      groundMaterial
    );

    ground.rotation.x = -Math.PI * 0.5;
    ground.receiveShadow = true;

    scene.add(ground);

    // =============================================================
    // FLOOR BORDERS
    // =============================================================

    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });

    const leftBorder = new THREE.Mesh(
      new THREE.BoxGeometry(FLOOR_LENGTH, 0.1, 0.2),
      borderMaterial
    );

    leftBorder.position.set(0, -0.01, 2.6);

    scene.add(leftBorder);

    const rightBorder = new THREE.Mesh(
      new THREE.BoxGeometry(FLOOR_LENGTH, 0.1, 0.2),
      borderMaterial
    );

    rightBorder.position.set(0, -0.01, -2.6);

    scene.add(rightBorder);

    // =============================================================
    // LAUNCH HEIGHT BOX
    // =============================================================

    const launchBoxMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.2,
      transparent: true,
      opacity: 0.75,
    });

    const launchBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1.5),
      launchBoxMaterial
    );

    launchBox.position.set(-7, 0.5, 0);
    launchBox.castShadow = true;
    launchBox.receiveShadow = true;

    scene.add(launchBox);

    // =============================================================
    // HEIGHT LABEL
    // =============================================================

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
    heightLabel.style.zIndex = "19";

    document.body.appendChild(heightLabel);

    // =============================================================
    // PHYSICS WORLD
    // =============================================================

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

    // =============================================================
    // PHYSICS FLOOR
    // =============================================================

    const groundShape = new CANNON.Box(
      new CANNON.Vec3(FLOOR_LENGTH / 2, 0.25, FLOOR_WIDTH / 2)
    );

    const groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.25, 0),
    });

    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    // =============================================================
    // LAUNCH PLATFORM PHYSICS
    // =============================================================

    let launchBoxBody = null;

    function updateLaunchBoxPhysics(height) {
      if (launchBoxBody) {
        world.removeBody(launchBoxBody);
        launchBoxBody = null;
      }

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

    // =============================================================
    // PHYSICS BALL
    // =============================================================

    const ballShape = new CANNON.Sphere(0.25);

    const ballBody = new CANNON.Body({
      mass: 1,
      material: defaultMaterial,
    });

    ballBody.addShape(ballShape);
    ballBody.position.set(-7, 1.25, 0);

    world.addBody(ballBody);

    // =============================================================
    // PROJECTILE TRAJECTORY
    // =============================================================

    const trajectoryPoints = [];

    const trajectoryGeometry = new THREE.BufferGeometry();

    const trajectoryMaterial = new THREE.LineDashedMaterial({
      color: 0x111111,
      dashSize: 0.25,
      gapSize: 0.15,
    });

    const trajectoryLine = new THREE.Line(
      trajectoryGeometry,
      trajectoryMaterial
    );

    trajectoryLine.computeLineDistances();

    scene.add(trajectoryLine);

    function clearTrajectory() {
      trajectoryPoints.length = 0;

      trajectoryGeometry.setFromPoints([]);
    }

    function updateTrajectory() {
      if (trajectoryPoints.length < 2) {
        return;
      }

      trajectoryGeometry.setFromPoints(trajectoryPoints);

      trajectoryLine.computeLineDistances();
    }

    // =============================================================
    // COMPUTED INFORMATION
    // =============================================================

    const projectileInfo = document.createElement("div");

    projectileInfo.id = "projectileInfo";

    projectileInfo.style.position = "fixed";
    projectileInfo.style.right = "20px";
    projectileInfo.style.bottom = "20px";
    projectileInfo.style.background = "rgba(255,255,255,0.9)";
    projectileInfo.style.color = "#111";
    projectileInfo.style.padding = "12px 16px";
    projectileInfo.style.borderRadius = "6px";
    projectileInfo.style.fontFamily = "'IBM Plex Mono', monospace";
    projectileInfo.style.fontSize = "12px";
    projectileInfo.style.lineHeight = "1.6";
    projectileInfo.style.zIndex = "20";
    projectileInfo.style.display = "none";

    document.body.appendChild(projectileInfo);

    // =============================================================
    // SETTINGS
    // =============================================================

    const settings = {
      angle: 45,
      velocity: 10,
      mass: 5,
      launchHeight: 1.0,
      airResistance: false,

      reset: () => {
        clearTrajectory();

        projectileInfo.style.display = "none";

        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);

        updateLaunchHeight();
      },

      launch: () => {
        clearTrajectory();

        projectileInfo.style.display = "block";

        // ---------------------------------------------------------
        // MASS
        // ---------------------------------------------------------

        ballBody.mass = settings.mass;
        ballBody.updateMassProperties();

        // ---------------------------------------------------------
        // INITIAL VELOCITY
        // ---------------------------------------------------------

        const angleInRadians = (settings.angle * Math.PI) / 180;
        const speed = settings.velocity;

        // Preserve your existing mass-based velocity adjustment.
        const adjustedSpeed = speed / Math.sqrt(settings.mass);

        const vx = adjustedSpeed * Math.cos(angleInRadians);
        const vy = adjustedSpeed * Math.sin(angleInRadians);

        ballBody.velocity.set(vx, vy, 0);

        // ---------------------------------------------------------
        // AIR RESISTANCE
        // ---------------------------------------------------------

        ballBody.linearDamping = settings.airResistance ? 0.01 : 0;

        // ---------------------------------------------------------
        // INITIAL TRAJECTORY POINT
        // ---------------------------------------------------------

        trajectoryPoints.push(
          new THREE.Vector3(
            ballBody.position.x,
            ballBody.position.y,
            ballBody.position.z
          )
        );

        // ---------------------------------------------------------
        // DISPLAY VALUES
        // ---------------------------------------------------------

        projectileInfo.innerHTML = `
          <strong>PROJECTILE</strong><br><br>
          Launch Angle: ${settings.angle.toFixed(1)}°<br>
          Launch Velocity: ${settings.velocity.toFixed(2)} m/s<br>
          Effective Velocity: ${adjustedSpeed.toFixed(2)} m/s<br>
          Launch Height: ${settings.launchHeight.toFixed(2)} m<br>
          Mass: ${settings.mass.toFixed(2)} kg<br>
          Air Resistance: ${settings.airResistance ? "ON" : "OFF"}
        `;
      },
    };

    // =============================================================
    // UPDATE LAUNCH HEIGHT
    // =============================================================

    function updateLaunchHeight() {
      const height = settings.launchHeight;

      // ---------------------------------------------------------
      // VISUAL BOX
      // ---------------------------------------------------------

      if (height <= 0) {
        launchBox.visible = false;
      } else {
        launchBox.visible = true;

        launchBox.scale.y = height;

        // Bottom remains at floor
        launchBox.position.y = height / 2;
      }

      // ---------------------------------------------------------
      // BALL
      // ---------------------------------------------------------

      ballBody.velocity.set(0, 0, 0);
      ballBody.angularVelocity.set(0, 0, 0);

      ballBody.position.set(-7, height + 0.25, 0);

      // ---------------------------------------------------------
      // PHYSICS BOX
      // ---------------------------------------------------------

      updateLaunchBoxPhysics(height);

      // ---------------------------------------------------------
      // LABEL
      // ---------------------------------------------------------

      heightLabel.textContent = `${Math.round(height * 100)} cm`;
    }

    // =============================================================
    // GUI CONTROLS
    // =============================================================

    gui.add(settings, "angle", 0, 90, 1).name("Launch Angle");
    gui.add(settings, "velocity", 0, 100, 1).name("Launch Velocity");
    gui.add(settings, "mass", 0.1, 100, 0.1).name("Ball Mass");

    gui
      .add(settings, "launchHeight", 0, 10, 0.1)
      .name("Launch Height (m)")
      .onChange(() => {
        updateLaunchHeight();
        clearTrajectory();
      });

    gui.add(settings, "airResistance").name("Air Resistance");
    gui.add(settings, "reset").name("Reset");
    gui.add(settings, "launch").name("Launch");

    // Initial state
    updateLaunchHeight();

    // =============================================================
    // ANIMATION
    // =============================================================

    const clock = new THREE.Clock();
    let oldElapsedTime = 0;
    let wasLaunched = false;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - oldElapsedTime;
      oldElapsedTime = elapsedTime;

      // ---------------------------------------------------------
      // PHYSICS
      // ---------------------------------------------------------

      world.step(1 / 80, deltaTime, 3);

      // ---------------------------------------------------------
      // UPDATE BALL
      // ---------------------------------------------------------

      ball.position.copy(ballBody.position);
      ball.quaternion.copy(ballBody.quaternion);

      // ---------------------------------------------------------
      // RECORD ACTUAL PATH
      // ---------------------------------------------------------

      const speed = ballBody.velocity.length();

      if (speed > 0.01 && ballBody.position.y > 0.25) {
        trajectoryPoints.push(
          new THREE.Vector3(
            ballBody.position.x,
            ballBody.position.y,
            ballBody.position.z
          )
        );

        updateTrajectory();

        wasLaunched = true;
      }

      // ---------------------------------------------------------
      // STOP RECORDING AFTER LANDING
      // ---------------------------------------------------------

      if (wasLaunched && ballBody.position.y <= 0.25 && speed < 0.1) {
        ballBody.velocity.set(0, 0, 0);

        wasLaunched = false;
      }

      // ---------------------------------------------------------
      // ORBIT CONTROLS
      // ---------------------------------------------------------

      controls.update();

      // ---------------------------------------------------------
      // HEIGHT LABEL
      // ---------------------------------------------------------

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

      // ---------------------------------------------------------
      // RENDER
      // ---------------------------------------------------------

      renderer.render(scene, camera);

      requestAnimationFrame(tick);
    };

    // =============================================================
    // RESIZE
    // =============================================================

    window.addEventListener("resize", () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Start
    tick();
  }
});