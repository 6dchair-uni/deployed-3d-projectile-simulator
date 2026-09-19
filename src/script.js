import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';

document.addEventListener("DOMContentLoaded", () => {
  const firstPage = document.getElementById("firstPage");
  const simulateButton = document.getElementById("simulateButton");
  const instructionsText = document.getElementById("instructionsText");
  const instructionsPopup = document.getElementById("instructionsPopup");
  const closeInstructions = document.getElementById("closeInstructions");
  const canvas = document.querySelector(".webgl");
  const backToWelcome = document.getElementById("backToWelcome");

  let isSceneInitialized = false;
  let gui = null;

  // =============================================================
  // WELCOME PAGE
  // =============================================================

  simulateButton.addEventListener("click", () => {
    firstPage.style.display = "none";
    canvas.style.display = "block";
    backToWelcome.style.display = "block";

    if (!isSceneInitialized) {
      initializeScene();
      isSceneInitialized = true;
    }

    // Show GUI again
    if (gui) {
      gui.domElement.style.display = "block";
    }

    // Show height label again
    const heightLabel = document.getElementById("launchHeightLabel");

    if (heightLabel) {
      heightLabel.style.display = "block";
    }

    // Keep calculation panel hidden until Launch is clicked
    const projectileInfo = document.getElementById("projectileInfo");

    if (projectileInfo) {
      projectileInfo.style.display = "none";
    }
  });

  backToWelcome.addEventListener("click", () => {
    canvas.style.display = "none";
    backToWelcome.style.display = "none";
    firstPage.style.display = "flex";
    // hide gui
    if(gui) {
      gui.domElement.style.display = "none";
    }
    // Hide projectile calculation panel
    const projectileInfo = document.getElementById("projectileInfo");

    if (projectileInfo) {
      projectileInfo.style.display = "none";
    }

    // Hide height label
    const heightLabel = document.getElementById("launchHeightLabel");

    if (heightLabel) {
      heightLabel.style.display = "none";
    }
  });

  instructionsText.addEventListener("click", () => {
    instructionsPopup.classList.remove("hidden");
  });

  closeInstructions.addEventListener("click", () => {
    instructionsPopup.classList.add("hidden");
  });

  // =============================================================
  // MAIN SIMULATION
  // =============================================================

  function initializeScene() {
    // ===========================================================
    // CONSTANTS
    // ===========================================================
    gui = new dat.GUI();
    const GRAVITY = 9.82;

    // Radius of the visual/physics ball
    const BALL_RADIUS = 0.25;

    // Standard air density near sea level
    const AIR_DENSITY = 1.225;

    // Approximate drag coefficient for a sphere
    const DRAG_COEFFICIENT = 0.47;

    // Cross-sectional area of sphere
    const BALL_AREA = Math.PI * BALL_RADIUS * BALL_RADIUS;

    // ===========================================================
    // SIZES
    // ===========================================================

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // ===========================================================
    // GUI
    // ===========================================================

    gui = new dat.GUI();
  
    gui.domElement.style.position = "fixed";
    gui.domElement.style.left = "20px";
    gui.domElement.style.top = "20px";
    gui.domElement.style.fontSize = "13px";
    gui.domElement.style.fontFamily = "'IBM Plex Mono', monospace";
    gui.domElement.style.zIndex = "20";

    // ===========================================================
    // THREE.JS SCENE
    // ===========================================================

    const scene = new THREE.Scene();

    // Transparent background so the CSS background remains visible.
    scene.background = null;

    // ===========================================================
    // CAMERA
    // ===========================================================

    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    );

    camera.position.set(0, 4, 12);

    scene.add(camera);

    // ===========================================================
    // RENDERER
    // ===========================================================

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ===========================================================
    // ORBIT CONTROLS
    // ===========================================================

    const controls = new OrbitControls(camera, canvas);

    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.enableDamping = true;

    // ===========================================================
    // LIGHTING
    // ===========================================================

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

    // ===========================================================
    // BALL
    // ===========================================================

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
      new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
      ballMaterial
    );

    ball.castShadow = true;

    scene.add(ball);

    // ===========================================================
    // GROUND
    // ===========================================================

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

    // ===========================================================
    // GROUND BORDERS
    // ===========================================================

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

    // ===========================================================
    // LAUNCH HEIGHT BOX
    // ===========================================================

    const launchBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1.5),
      new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.7,
        metalness: 0.2,
      })
    );

    launchBox.castShadow = true;
    launchBox.receiveShadow = true;

    scene.add(launchBox);

    // ===========================================================
    // HEIGHT LABEL
    // ===========================================================

    const heightLabel = document.createElement("div");

    heightLabel.id = "launchHeightLabel";
    heightLabel.textContent = "100.0 cm";

    heightLabel.style.position = "fixed";
    heightLabel.style.transform = "translate(-50%, -50%)";
    heightLabel.style.fontFamily = "'IBM Plex Mono', monospace";
    heightLabel.style.fontSize = "14px";
    heightLabel.style.fontWeight = "600";
    heightLabel.style.color = "#111";
    heightLabel.style.background = "rgba(255,255,255,0.85)";
    heightLabel.style.padding = "4px 8px";
    heightLabel.style.borderRadius = "4px";
    heightLabel.style.pointerEvents = "none";
    heightLabel.style.zIndex = "15";

    document.body.appendChild(heightLabel);

    // ===========================================================
    // PROJECTILE INFORMATION PANEL
    // ===========================================================

    const projectileInfo = document.createElement("div");

    projectileInfo.id = "projectileInfo";

    projectileInfo.style.position = "fixed";
    projectileInfo.style.right = "20px";
    projectileInfo.style.bottom = "20px";
    projectileInfo.style.width = "290px";
    projectileInfo.style.padding = "16px";
    projectileInfo.style.background = "rgba(255,255,255,0.93)";
    projectileInfo.style.border = "1px solid rgba(0,0,0,0.15)";
    projectileInfo.style.borderRadius = "8px";
    projectileInfo.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
    projectileInfo.style.fontFamily = "'IBM Plex Mono', monospace";
    projectileInfo.style.fontSize = "12px";
    projectileInfo.style.lineHeight = "1.7";
    projectileInfo.style.color = "#111";
    projectileInfo.style.zIndex = "20";
    projectileInfo.style.display = "none";

    document.body.appendChild(projectileInfo);

    // ===========================================================
    // CANNON WORLD
    // ===========================================================

    const world = new CANNON.World();

    world.broadphase = new CANNON.SAPBroadphase(world);
    world.gravity.set(0, -GRAVITY, 0);

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

    // ===========================================================
    // PHYSICS GROUND
    // ===========================================================

    const groundShape = new CANNON.Box(new CANNON.Vec3(7.5, 0.25, 2.5));

    const groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.25, 0),
    });

    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    // ===========================================================
    // LAUNCH PLATFORM PHYSICS
    // ===========================================================

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

      // Bottom of box touches floor.
      launchBoxBody.position.set(-7, height / 2, 0);

      world.addBody(launchBoxBody);
    }

    // ===========================================================
    // PHYSICS BALL
    // ===========================================================

    const ballShape = new CANNON.Sphere(BALL_RADIUS);

    const ballBody = new CANNON.Body({
      mass: 5,
      material: defaultMaterial,
    });

    ballBody.addShape(ballShape);
    world.addBody(ballBody);

    // ===========================================================
    // TRAJECTORY
    // ===========================================================

    let trajectoryPoints = [];
    let trajectoryLine = null;
    let projectileHasLaunched = false;
    let launchStartTime = 0;
    let maximumHeightReached = 0;

    function clearTrajectory() {
      trajectoryPoints = [];

      if (trajectoryLine) {
        scene.remove(trajectoryLine);

        trajectoryLine.geometry.dispose();
        trajectoryLine.material.dispose();

        trajectoryLine = null;
      }
    }

    function updateTrajectoryLine() {
      if (trajectoryPoints.length < 2) {
        return;
      }

      if (trajectoryLine) {
        scene.remove(trajectoryLine);

        trajectoryLine.geometry.dispose();
        trajectoryLine.material.dispose();
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(
        trajectoryPoints
      );

      const material = new THREE.LineDashedMaterial({
        color: 0x111111,
        dashSize: 0.22,
        gapSize: 0.12,
        transparent: true,
        opacity: 0.8,
      });

      trajectoryLine = new THREE.Line(geometry, material);

      trajectoryLine.computeLineDistances();

      scene.add(trajectoryLine);
    }

    // ===========================================================
    // CALCULATION PANEL
    // ===========================================================

    function showInitialCalculation() {
      const angleRadians = THREE.MathUtils.degToRad(settings.angle);

      const vx = settings.velocity * Math.cos(angleRadians);
      const vy = settings.velocity * Math.sin(angleRadians);

      projectileInfo.innerHTML = `
        <div style="font-weight:600; font-size:14px; margin-bottom:8px;">
          Projectile Calculation
        </div>

        <div>Launch Height: <strong>${settings.launchHeight.toFixed(2)} m</strong></div>
        <div>Launch Height: <strong>${(settings.launchHeight * 100).toFixed(1)} cm</strong></div>
        <div>Initial Velocity: <strong>${settings.velocity.toFixed(2)} m/s</strong></div>
        <div>Launch Angle: <strong>${settings.angle.toFixed(2)}°</strong></div>
        <div>Ball Mass: <strong>${settings.mass.toFixed(2)} kg</strong></div>
        <div>Air Resistance: <strong>${settings.airResistance ? "ON" : "OFF"}</strong></div>

        ${
          settings.airResistance
            ? `
              <div>Air Density: <strong>${AIR_DENSITY.toFixed(3)} kg/m³</strong></div>
              <div>Drag Coefficient: <strong>${DRAG_COEFFICIENT.toFixed(2)}</strong></div>
              <div>Ball Area: <strong>${BALL_AREA.toFixed(4)} m²</strong></div>
            `
            : ""
        }

        <hr style="margin:8px 0; border:0; border-top:1px solid #ddd;">

        <div>Horizontal Velocity: <strong>${vx.toFixed(2)} m/s</strong></div>
        <div>Vertical Velocity: <strong>${vy.toFixed(2)} m/s</strong></div>

        <div style="margin-top:8px; font-size:10px; opacity:0.65;">
          Recording actual simulated trajectory...
        </div>
      `;

      projectileInfo.style.display = "block";
    }

    function showFinalCalculation() {
      const flightTime = performance.now() / 1000 - launchStartTime;
      const horizontalRange = ballBody.position.x + 7;
      const actualMaximumHeight = maximumHeightReached;

      projectileInfo.innerHTML = `
        <div style="font-weight:600; font-size:14px; margin-bottom:8px;">
          Projectile Calculation
        </div>

        <div>Launch Height: <strong>${settings.launchHeight.toFixed(2)} m</strong></div>
        <div>Launch Height: <strong>${(settings.launchHeight * 100).toFixed(1)} cm</strong></div>
        <div>Initial Velocity: <strong>${settings.velocity.toFixed(2)} m/s</strong></div>
        <div>Launch Angle: <strong>${settings.angle.toFixed(2)}°</strong></div>
        <div>Ball Mass: <strong>${settings.mass.toFixed(2)} kg</strong></div>
        <div>Air Resistance: <strong>${settings.airResistance ? "ON" : "OFF"}</strong></div>

        ${
          settings.airResistance
            ? `
              <div>Air Density: <strong>${AIR_DENSITY.toFixed(3)} kg/m³</strong></div>
              <div>Drag Coefficient: <strong>${DRAG_COEFFICIENT.toFixed(2)}</strong></div>
              <div>Ball Area: <strong>${BALL_AREA.toFixed(4)} m²</strong></div>
            `
            : ""
        }

        <hr style="margin:8px 0; border:0; border-top:1px solid #ddd;">

        <div>Actual Flight Time: <strong>${flightTime.toFixed(2)} s</strong></div>
        <div>Actual Maximum Height: <strong>${actualMaximumHeight.toFixed(2)} m</strong></div>
        <div>Actual Range: <strong>${horizontalRange.toFixed(2)} m</strong></div>

        <div style="margin-top:8px; font-size:10px; opacity:0.65;">
          Values measured from the physics simulation.
        </div>
      `;
    }

    // ===========================================================
    // AIR RESISTANCE
    // ===========================================================

    function applyAirResistance() {
      if (!settings.airResistance) {
        return;
      }

      const velocity = ballBody.velocity;
      const speed = velocity.length();

      if (speed <= 0) {
        return;
      }

      /*
       * Quadratic drag:
       *
       * Fd = 1/2 * rho * Cd * A * v²
       *
       * The force points opposite
       * the velocity vector.
       */

      const dragMagnitude =
        0.5 * AIR_DENSITY * DRAG_COEFFICIENT * BALL_AREA * speed * speed;

      const dragForce = new CANNON.Vec3(
        (-velocity.x / speed) * dragMagnitude,
        (-velocity.y / speed) * dragMagnitude,
        (-velocity.z / speed) * dragMagnitude
      );

      ballBody.applyForce(dragForce, ballBody.position);
    }

    // ===========================================================
    // SETTINGS
    // ===========================================================

    const settings = {
      angle: 45,
      velocity: 10,
      mass: 5,

      // 100 cm default
      launchHeight: 1.0,

      airResistance: false,

      reset: () => {
        projectileHasLaunched = false;

        clearTrajectory();

        projectileInfo.style.display = "none";

        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);

        updateLaunchHeight();
      },

      launch: () => {
        // Apply selected mass.
        ballBody.mass = settings.mass;
        ballBody.updateMassProperties();

        // Clear old path.
        clearTrajectory();

        // Reset the ball to the selected launch height.
        updateLaunchHeight();

        // Initial velocity.
        const angleRadians = THREE.MathUtils.degToRad(settings.angle);

        ballBody.velocity.set(
          settings.velocity * Math.cos(angleRadians),
          settings.velocity * Math.sin(angleRadians),
          0
        );

        // Start trajectory recording.
        projectileHasLaunched = true;
        launchStartTime = performance.now() / 1000;
        maximumHeightReached = ballBody.position.y;

        showInitialCalculation();
      },
    };

    // ===========================================================
    // GUI CONTROLS
    // ===========================================================

    gui.add(settings, "angle", 0, 90, 1).name("Launch Angle (°)");
    gui.add(settings, "velocity", 0, 100, 0.1).name("Velocity (m/s)");
    gui.add(settings, "mass", 0.1, 100, 0.1).name("Mass (kg)");

    gui
      .add(settings, "launchHeight", 0, 10, 0.01)
      .name("Height (m)")
      .onChange(() => {
        updateLaunchHeight();
        clearTrajectory();

        projectileHasLaunched = false;

        projectileInfo.style.display = "none";
      });

    gui.add(settings, "airResistance").name("Air Resistance");
    gui.add(settings, "reset").name("Reset");
    gui.add(settings, "launch").name("Launch");

    // ===========================================================
    // UPDATE LAUNCH HEIGHT
    // ===========================================================

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

        // Bottom touches floor.
        launchBox.position.set(-7, height / 2, 0);
      }

      // ---------------------------------------------------------
      // BALL
      // ---------------------------------------------------------

      ballBody.velocity.set(0, 0, 0);
      ballBody.angularVelocity.set(0, 0, 0);

      /*
       * Launch height represents the
       * height of the ball's bottom
       * above the floor.
       *
       * Ball center therefore sits
       * at height + radius.
       */

      ballBody.position.set(-7, height + BALL_RADIUS, 0);

      ball.position.copy(ballBody.position);

      // ---------------------------------------------------------
      // PHYSICS PLATFORM
      // ---------------------------------------------------------

      updateLaunchBoxPhysics(height);

      // ---------------------------------------------------------
      // LABEL
      // ---------------------------------------------------------

      heightLabel.textContent = `${(height * 100).toFixed(1)} cm`;
    }

    // Initial state: 100 cm launch height.
    updateLaunchHeight();

    // ===========================================================
    // ANIMATION LOOP
    // ===========================================================

    const clock = new THREE.Clock();
    let oldElapsedTime = 0;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - oldElapsedTime;
      oldElapsedTime = elapsedTime;

      // =========================================================
      // AIR RESISTANCE
      // =========================================================

      applyAirResistance();

      // =========================================================
      // PHYSICS
      // =========================================================

      world.step(1 / 120, deltaTime, 5);

      // =========================================================
      // UPDATE BALL
      // =========================================================

      ball.position.copy(ballBody.position);
      ball.quaternion.copy(ballBody.quaternion);

      // =========================================================
      // RECORD ACTUAL TRAJECTORY
      // =========================================================

      if (projectileHasLaunched) {
        trajectoryPoints.push(
          new THREE.Vector3(
            ballBody.position.x,
            ballBody.position.y,
            ballBody.position.z
          )
        );

        // Track maximum height.
        if (ballBody.position.y > maximumHeightReached) {
          maximumHeightReached = ballBody.position.y;
        }

        // Update visible dashed path.
        updateTrajectoryLine();

        /*
         * Ball center reaches 0.25 m
         * when the bottom of the ball
         * touches the floor.
         */

        if (ballBody.position.y <= BALL_RADIUS + 0.01) {
          projectileHasLaunched = false;

          showFinalCalculation();
        }
      }

      // =========================================================
      // CONTROLS
      // =========================================================

      controls.update();

      // =========================================================
      // HEIGHT LABEL
      // =========================================================

      if (launchBox.visible) {
        const labelPosition = new THREE.Vector3(
          -6.1,
          settings.launchHeight / 2,
          0
        );

        labelPosition.project(camera);

        const x = (labelPosition.x * 0.5 + 0.5) * sizes.width;
        const y = (-labelPosition.y * 0.5 + 0.5) * sizes.height;

        heightLabel.style.left = `${x}px`;
        heightLabel.style.top = `${y}px`;
        heightLabel.style.display = "block";
      } else {
        heightLabel.style.display = "none";
      }

      // =========================================================
      // RENDER
      // =========================================================

      renderer.render(scene, camera);

      requestAnimationFrame(tick);
    };

    // ===========================================================
    // RESIZE
    // ===========================================================

    window.addEventListener("resize", () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    tick();
  }
});