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

  // --------------------------------------------------
  // PAGE NAVIGATION
  // --------------------------------------------------

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

  // --------------------------------------------------
  // THREE.JS SCENE
  // --------------------------------------------------

  function initializeScene() {
    // --------------------------------------------------
    // SIZES
    // --------------------------------------------------

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // --------------------------------------------------
    // GUI
    // --------------------------------------------------

    const gui = new dat.GUI();

    gui.domElement.style.position = "fixed";
    gui.domElement.style.left = "20px";
    gui.domElement.style.top = "20px";
    gui.domElement.style.fontSize = "13px";
    gui.domElement.style.fontFamily = "'IBM Plex Mono', monospace";
    gui.domElement.style.zIndex = "20";

    // --------------------------------------------------
    // SCENE
    // --------------------------------------------------

    const scene = new THREE.Scene();

    // Transparent scene so the CSS background can show through
    scene.background = null;

    // --------------------------------------------------
    // CAMERA
    // --------------------------------------------------

    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    );

    // Closer default view
    camera.position.set(0, 4, 10);

    scene.add(camera);

    // --------------------------------------------------
    // RENDERER
    // --------------------------------------------------

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --------------------------------------------------
    // ORBIT CONTROLS
    // --------------------------------------------------

    const controls = new OrbitControls(camera, canvas);

    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.enableDamping = true;

    // --------------------------------------------------
    // LIGHTING
    // --------------------------------------------------

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

    // --------------------------------------------------
    // BALL
    // --------------------------------------------------

    const textureLoader = new THREE.TextureLoader();

    const ballCoat = textureLoader.load(
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMDlLaRsqYBIGrnI24hdTp_VdpjUwU16Hf-Q&s"
    );

    const ballMaterial = new THREE.MeshStandardMaterial({
      map: ballCoat,
      roughness: 0.5,
      metalness: 0.5,
    });

    const BALL_RADIUS = 0.25;

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
      ballMaterial
    );

    ball.castShadow = true;

    scene.add(ball);

    // --------------------------------------------------
    // GROUND
    // --------------------------------------------------

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

    // --------------------------------------------------
    // GROUND BORDERS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // LAUNCH HEIGHT BOX
    // --------------------------------------------------

    const launchBoxMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.2,
    });

    const launchBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1.5),
      launchBoxMaterial
    );

    launchBox.castShadow = true;
    launchBox.receiveShadow = true;

    scene.add(launchBox);

    // --------------------------------------------------
    // HEIGHT LABEL
    // --------------------------------------------------

    const heightLabel = document.createElement("div");

    heightLabel.id = "launchHeightLabel";
    heightLabel.textContent = "100 cm";

    heightLabel.style.position = "fixed";
    heightLabel.style.transform = "translate(-50%, -50%)";
    heightLabel.style.fontFamily = "'IBM Plex Mono', monospace";
    heightLabel.style.fontSize = "16px";
    heightLabel.style.fontWeight = "600";
    heightLabel.style.color = "#000";
    heightLabel.style.background = "rgba(255,255,255,0.85)";
    heightLabel.style.padding = "4px 8px";
    heightLabel.style.borderRadius = "4px";
    heightLabel.style.pointerEvents = "none";
    heightLabel.style.zIndex = "21";

    document.body.appendChild(heightLabel);

    // --------------------------------------------------
    // CANNON PHYSICS WORLD
    // --------------------------------------------------

    const world = new CANNON.World();

    world.broadphase = new CANNON.SAPBroadphase(world);
    world.gravity.set(0, -9.82, 0);

    // --------------------------------------------------
    // MATERIALS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // PHYSICS GROUND
    // --------------------------------------------------

    const groundShape = new CANNON.Box(new CANNON.Vec3(7.5, 0.25, 2.5));

    const groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.25, 0),
    });

    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    // --------------------------------------------------
    // PHYSICS LAUNCH BOX
    // --------------------------------------------------

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

      // Bottom of box touches floor
      launchBoxBody.position.set(-7, height / 2, 0);

      world.addBody(launchBoxBody);
    }

    // --------------------------------------------------
    // PHYSICS BALL
    // --------------------------------------------------

    const ballShape = new CANNON.Sphere(BALL_RADIUS);

    const ballBody = new CANNON.Body({
      mass: 1,
      material: defaultMaterial,
    });

    ballBody.addShape(ballShape);
    world.addBody(ballBody);

    // --------------------------------------------------
    // SETTINGS
    // --------------------------------------------------

    const settings = {
      angle: 45,
      velocity: 10,
      mass: 5,

      // DEFAULT = 1 METRE = 100 CM
      launchHeight: 1.0,

      // --------------------------------------------------
      // RESET
      // --------------------------------------------------

      reset: () => {
        updateLaunchHeight();
      },

      // --------------------------------------------------
      // LAUNCH
      // --------------------------------------------------

      launch: () => {
        ballBody.mass = settings.mass;
        ballBody.updateMassProperties();

        const angleInRadians = (settings.angle * Math.PI) / 180;
        const speed = settings.velocity;
        const adjustedSpeed = speed * (1 / Math.sqrt(settings.mass));

        ballBody.velocity.set(
          adjustedSpeed * Math.cos(angleInRadians),
          adjustedSpeed * Math.sin(angleInRadians),
          0
        );
      },
    };

    // --------------------------------------------------
    // UPDATE LAUNCH HEIGHT
    // --------------------------------------------------

    function updateLaunchHeight() {
      const height = settings.launchHeight;

      // -------------------------------
      // VISUAL BOX
      // -------------------------------

      if (height <= 0) {
        launchBox.visible = false;
      } else {
        launchBox.visible = true;

        /*
         * The original geometry is 1 unit tall.
         * Scaling Y by height makes its
         * actual height = height.
         */
        launchBox.scale.set(1, height, 1);

        /*
         * Center the box at half its height.
         *
         * Bottom = 0
         * Top = height
         */
        launchBox.position.set(-7, height / 2, 0);
      }

      // -------------------------------
      // BALL POSITION
      // -------------------------------

      ballBody.velocity.set(0, 0, 0);
      ballBody.angularVelocity.set(0, 0, 0);

      /*
       * The ball center is one radius
       * above the top of the box.
       *
       * height = 1.0
       *
       * ball center = 1.0 + 0.25
       */
      ballBody.position.set(-7, height + BALL_RADIUS, 0);

      // -------------------------------
      // PHYSICS BOX
      // -------------------------------

      updateLaunchBoxPhysics(height);

      // -------------------------------
      // HEIGHT LABEL
      // -------------------------------

      heightLabel.textContent = `${Math.round(height * 100)} cm`;
    }

    // --------------------------------------------------
    // GUI CONTROLS
    // --------------------------------------------------

    gui.add(settings, "angle", 0, 90, 1).name("Launch Angle");
    gui.add(settings, "velocity", 0, 100, 1).name("Launch Velocity");
    gui.add(settings, "mass", 0.1, 100, 0.1).name("Ball Mass");

    gui
      .add(settings, "launchHeight", 0, 10, 0.1)
      .name("Launch Height (m)")
      .onChange(() => {
        updateLaunchHeight();
      });

    gui.add(settings, "reset").name("Reset");
    gui.add(settings, "launch").name("Launch");

    // Set initial height
    updateLaunchHeight();

    // --------------------------------------------------
    // OBJECTS TO UPDATE
    // --------------------------------------------------

    const objectsToUpdate = [
      {
        mesh: ball,
        body: ballBody,
      },
    ];

    // --------------------------------------------------
    // ANIMATION LOOP
    // --------------------------------------------------

    const clock = new THREE.Clock();
    let oldElapsedTime = 0;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - oldElapsedTime;
      oldElapsedTime = elapsedTime;

      // Physics
      world.step(1 / 80, deltaTime, 3);

      // Update meshes
      for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
      }

      // Controls
      controls.update();

      // --------------------------------------------------
      // HEIGHT LABEL POSITION
      // --------------------------------------------------

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

      // Render
      renderer.render(scene, camera);

      requestAnimationFrame(tick);
    };

    // --------------------------------------------------
    // RESIZE
    // --------------------------------------------------

    window.addEventListener("resize", () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Start animation
    tick();
  }
});