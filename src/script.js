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

  simulateButton.addEventListener("click", () => {
    firstPage.style.display = "none";
    canvas.style.display = "block";
    backToWelcome.style.display = "block";

    if (!isSceneInitialized) {
      initializeScene();
      isSceneInitialized = true;
    }
  });

  backToWelcome.addEventListener("click", () => {
    canvas.style.display = "none";
    backToWelcome.style.display = "none";
    firstPage.style.display = "flex";
  });

  instructionsText.addEventListener("click", () => {
    instructionsPopup.classList.remove("hidden");
  });

  closeInstructions.addEventListener("click", () => {
    instructionsPopup.classList.add("hidden");
  });

  function initializeScene() {
    // =============================================================
    // SIZES
    // =============================================================

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // =============================================================
    // GUI
    // =============================================================

    const gui = new dat.GUI();

    gui.domElement.style.position = "fixed";
    gui.domElement.style.left = "20px";
    gui.domElement.style.top = "20px";
    gui.domElement.style.fontSize = "13px";
    gui.domElement.style.fontFamily = "'IBM Plex Mono', monospace";
    gui.domElement.style.zIndex = "20";

    // =============================================================
    // THREE.JS SCENE
    // =============================================================

    const scene = new THREE.Scene();

    // Transparent so the CSS background remains visible.
    scene.background = null;

    // =============================================================
    // CAMERA
    // =============================================================

    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    );

    // Closer default view
    camera.position.set(0, 4, 12);

    scene.add(camera);

    // =============================================================
    // RENDERER
    // =============================================================

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
    controls.maxDistance = 50;
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
    directionalLight.shadow.camera.far = 50;

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

    ball.castShadow = true;

    scene.add(ball);

    // =============================================================
    // GROUND
    // =============================================================

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

    // =============================================================
    // GROUND BORDERS
    // =============================================================

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

    // =============================================================
    // LAUNCH PLATFORM
    // =============================================================

    const launchBoxGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);

    const launchBoxMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.2,
    });

    const launchBox = new THREE.Mesh(launchBoxGeometry, launchBoxMaterial);

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
    heightLabel.style.color = "#111";
    heightLabel.style.background = "rgba(255,255,255,0.85)";
    heightLabel.style.padding = "4px 8px";
    heightLabel.style.borderRadius = "4px";
    heightLabel.style.pointerEvents = "none";
    heightLabel.style.zIndex = "15";

    document.body.appendChild(heightLabel);

    // =============================================================
    // PROJECTILE INFORMATION PANEL
    // =============================================================

    const projectileInfo = document.createElement("div");

    projectileInfo.id = "projectileInfo";

    projectileInfo.style.position = "fixed";
    projectileInfo.style.right = "20px";
    projectileInfo.style.bottom = "20px";
    projectileInfo.style.width = "280px";
    projectileInfo.style.padding = "16px";
    projectileInfo.style.background = "rgba(255,255,255,0.92)";
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

    // =============================================================
    // CANNON WORLD
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
    // PHYSICS GROUND
    // =============================================================

    const groundShape = new CANNON.Box(new CANNON.Vec3(7.5, 0.25, 2.5));

    const groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.25, 0),
    });

    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    // =============================================================
    // PHYSICS LAUNCH PLATFORM
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

      // Bottom of platform touches y = 0
      launchBoxBody.position.set(-7, height / 2, 0);

      world.addBody(launchBoxBody);
    }

    // =============================================================
    // PHYSICS BALL
    // =============================================================

    const ballShape = new CANNON.Sphere(0.25);

    const ballBody = new CANNON.Body({
      mass: 5,
      material: defaultMaterial,
    });

    ballBody.addShape(ballShape);

    world.addBody(ballBody);

    // =============================================================
    // PROJECTILE PATH
    // =============================================================

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

      const angleRadians = THREE.MathUtils.degToRad(settings.angle);
      const velocity = settings.velocity;
      const height = settings.launchHeight;
      const gravity = 9.82;

      // Starting position is the ball center.
      const x0 = -7;
      const y0 = height + 0.25;

      const vx = velocity * Math.cos(angleRadians);
      const vy = velocity * Math.sin(angleRadians);

      /*
       * The ball touches the ground when
       * its CENTER reaches y = 0.25.
       *
       * Therefore:
       *
       * y(t) = y0 + vy*t - 0.5*g*t²
       *
       * and we solve:
       *
       * y(t) = 0.25
       */

      const relativeHeight = height;

      const discriminant = vy * vy + 2 * gravity * relativeHeight;
      const flightTime = (vy + Math.sqrt(discriminant)) / gravity;

      const points = [];
      const numberOfPoints = 100;

      for (let i = 0; i <= numberOfPoints; i++) {
        const t = flightTime * (i / numberOfPoints);

        const x = x0 + vx * t;
        const y = y0 + vy * t - 0.5 * gravity * t * t;

        points.push(new THREE.Vector3(x, Math.max(y, 0.25), 0));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineDashedMaterial({
        color: 0x111111,
        dashSize: 0.25,
        gapSize: 0.15,
        transparent: true,
        opacity: 0.75,
      });

      trajectoryLine = new THREE.Line(geometry, material);

      trajectoryLine.computeLineDistances();

      scene.add(trajectoryLine);

      // ===========================================================
      // COMPUTED VALUES
      // ===========================================================

      const maximumHeight = y0 + (vy * vy) / (2 * gravity);
      const range = vx * flightTime;
      const finalX = x0 + range;

      projectileInfo.innerHTML = `
        <div style="font-weight:600; font-size:14px; margin-bottom:8px;">
          Projectile Calculation
        </div>

        <div>Launch Height: <strong>${height.toFixed(2)} m</strong></div>
        <div>Launch Height: <strong>${(height * 100).toFixed(1)} cm</strong></div>
        <div>Initial Velocity: <strong>${velocity.toFixed(2)} m/s</strong></div>
        <div>Launch Angle: <strong>${settings.angle.toFixed(2)}°</strong></div>
        <div>Ball Mass: <strong>${settings.mass.toFixed(2)} kg</strong></div>
        <div>Gravity: <strong>${gravity.toFixed(2)} m/s²</strong></div>

        <hr style="margin:8px 0; border:0; border-top:1px solid #ddd;">

        <div>Horizontal Velocity: <strong>${vx.toFixed(2)} m/s</strong></div>
        <div>Vertical Velocity: <strong>${vy.toFixed(2)} m/s</strong></div>
        <div>Time of Flight: <strong>${flightTime.toFixed(2)} s</strong></div>
        <div>Maximum Height: <strong>${maximumHeight.toFixed(2)} m</strong></div>
        <div>Horizontal Range: <strong>${range.toFixed(2)} m</strong></div>
        <div>Landing X: <strong>${finalX.toFixed(2)} m</strong></div>

        <div style="margin-top:8px; font-size:10px; opacity:0.65;">
          Air resistance: neglected
        </div>
      `;

      projectileInfo.style.display = "block";
    }

    // =============================================================
    // GUI SETTINGS
    // =============================================================

    const settings = {
      angle: 45,
      velocity: 10,
      mass: 5,

      // 100 cm default
      launchHeight: 1.0,

      reset: () => {
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);

        updateLaunchHeight();
        clearTrajectory();

        projectileInfo.style.display = "none";
      },

      launch: () => {
        // Mass is still assigned to the
        // physics body, but does not affect
        // trajectory because air resistance
        // is neglected.

        ballBody.mass = settings.mass;
        ballBody.updateMassProperties();

        const angleRadians = THREE.MathUtils.degToRad(settings.angle);
        const speed = settings.velocity;

        // IMPORTANT:
        // No mass-based speed adjustment.
        //
        // In ideal projectile motion:
        //
        // vx = v cos(theta)
        // vy = v sin(theta)

        ballBody.velocity.set(
          speed * Math.cos(angleRadians),
          speed * Math.sin(angleRadians),
          0
        );

        // Draw the theoretical
        // trajectory using the
        // exact same values.

        drawTrajectory();
      },
    };

    // =============================================================
    // GUI CONTROLS
    // =============================================================

    gui.add(settings, "angle", 0, 90, 1).name("Launch Angle (°)");
    gui.add(settings, "velocity", 0, 100, 0.1).name("Velocity (m/s)");
    gui.add(settings, "mass", 0.1, 100, 0.1).name("Mass (kg)");

    gui
      .add(settings, "launchHeight", 0, 10, 0.01)
      .name("Height (m)")
      .onChange(() => {
        updateLaunchHeight();
        clearTrajectory();

        projectileInfo.style.display = "none";
      });

    gui.add(settings, "reset").name("Reset");
    gui.add(settings, "launch").name("Launch");

    // =============================================================
    // UPDATE LAUNCH HEIGHT
    // =============================================================

    function updateLaunchHeight() {
      const height = settings.launchHeight;

      // -------------------------------------------------------------
      // VISUAL BOX
      // -------------------------------------------------------------

      if (height <= 0) {
        launchBox.visible = false;
      } else {
        launchBox.visible = true;

        launchBox.scale.y = height;

        // Bottom touches floor
        launchBox.position.set(-7, height / 2, 0);
      }

      // -------------------------------------------------------------
      // BALL
      // -------------------------------------------------------------

      ballBody.velocity.set(0, 0, 0);
      ballBody.angularVelocity.set(0, 0, 0);

      /*
       * The launch height is the height
       * of the BALL'S CENTER above
       * the top of the platform.
       *
       * Therefore the center of the ball
       * is:
       *
       * platform height + radius
       */

      ballBody.position.set(-7, height + 0.25, 0);

      // Keep visual ball synchronized
      ball.position.copy(ballBody.position);

      // -------------------------------------------------------------
      // PHYSICS PLATFORM
      // -------------------------------------------------------------

      updateLaunchBoxPhysics(height);

      // -------------------------------------------------------------
      // HEIGHT LABEL
      // -------------------------------------------------------------

      heightLabel.textContent = `${(height * 100).toFixed(1)} cm`;
    }

    // Initial state = 100 cm
    updateLaunchHeight();

    // =============================================================
    // ANIMATION
    // =============================================================

    const clock = new THREE.Clock();
    let oldElapsedTime = 0;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - oldElapsedTime;
      oldElapsedTime = elapsedTime;

      // Physics
      world.step(1 / 80, deltaTime, 3);

      // Synchronize visual objects
      ball.position.copy(ballBody.position);
      ball.quaternion.copy(ballBody.quaternion);

      // Orbit controls
      controls.update();

      // ===========================================================
      // HEIGHT LABEL POSITION
      // ===========================================================

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

      // Render
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

    tick();
  }
});