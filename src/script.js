import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';

document.addEventListener( "DOMContentLoaded", () => {
    const firstPage = document.getElementById( "firstPage" );
    const simulateButton = document.getElementById( "simulateButton" );
    const instructionsText = document.getElementById( "instructionsText" );
    const instructionsPopup = document.getElementById( "instructionsPopup" );
    const closeInstructions = document.getElementById( "closeInstructions" );
    const canvas = document.querySelector( ".webgl" );
    const backToWelcome = document.getElementById("backToWelcome");

    // Flag to check if the scene has been initialized
    let isSceneInitialized = false;
    // Initialize Three.js scene when the simulate button is clicked
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

    // Handle instructionsText
    instructionsText.addEventListener( "click", () => {
        instructionsPopup.classList.remove( "hidden" );
    });

    closeInstructions.addEventListener( "click", () => {
        instructionsPopup.classList.add( "hidden" );
    });

    // Function to initialize Three.js scene
    function initializeScene() {
        // SIZES
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // DEBUG GUI
        const gui = new dat.GUI();
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.left = '10px';
        gui.domElement.style.top = '10px';
        gui.domElement.style.fontSize = '10px';


        // CANVAS
        const canvas = document.querySelector( 'canvas.webgl' );


        // THREE.JS SETUP
        const scene = new THREE.Scene();
       //scene.background = new THREE.Color( 0xb9d3ff ); // Light sky blue background
       scene.background = null;
       
       // Camera
        const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 100 );
        camera.position.set( 0, 5, 20 );
        scene.add( camera );

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setSize( sizes.width, sizes.height );
        renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
        
        /*
        const gridHelper = new THREE.GridHelper(5, 20);  // X-axis size = 15, Z-axis divisions = 10
        scene.add(gridHelper);
        // Adjust the grid to be rectangular
        gridHelper.scale.set(3, 2, 1);  // Stretch the grid along Z (creating rectangular shape)
        */

        // ORBIT CONTROLS
        const controls = new OrbitControls( camera, canvas );
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.enableDamping = true;


        // LIGHTING
        const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
        scene.add( ambientLight );

        const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLight.position.set( 5, 10, 5 );
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        scene.add( directionalLight );


        // MESHES
        // Ball
        const textureLoader = new THREE.TextureLoader();
        const ballCoat = textureLoader.load( 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMDlLaRsqYBIGrnI24hdTp_VdpjUwU16Hf-Q&s' );
        const ballMaterial = new THREE.MeshStandardMaterial( {
            map: ballCoat,  // Apply texture to the material
            roughness: 0.5,  // Adjust roughness for lighting effects
            metalness: 0.5   // Adjust metalness for realistic appearance
        } );
        const ball = new THREE.Mesh( new THREE.SphereGeometry( 0.25, 32, 32 ), ballMaterial );
        ball.position.set( -7, 1.25, 0 );
        ball.castShadow = true;
        scene.add( ball );

        // Ground
        const groundMaterial = new THREE.MeshPhysicalMaterial( {
            color: 0xaaaaaa,       // Light gray
            transparent: true,     // Enable transparency
            opacity: 0.4,          // Adjust transparency level
            roughness: 0.1,        // Smooth surface
            metalness: 0.9,        // Reflective surface
            reflectivity: 0.8,     // High reflectivity for a glassy look
            clearcoat: 1,          // Add a glossy finish
            clearcoatRoughness: 0, // Smooth clear coat
            side: THREE.DoubleSide
        } );

        const ground = new THREE.Mesh( new THREE.PlaneGeometry( 15, 5 ), groundMaterial );
        ground.rotation.x = -Math.PI * 0.5; // Rotate to horizontal
        ground.receiveShadow = true;
        scene.add( ground );

        // Add borders on both sides of the ground
        const borderMaterial = new THREE.MeshStandardMaterial( { color: 0x000000 } ); // Black color

        // Left border
        const leftBorder = new THREE.Mesh( new THREE.BoxGeometry( 15, 0.1, 0.2 ), borderMaterial );
        leftBorder.position.set( 0, -0.01, 2.6 ); // Align with the ground (left side)
        scene.add( leftBorder );

        // Right border
        const rightBorder = new THREE.Mesh(new THREE.BoxGeometry( 15, 0.1, 0.2 ), borderMaterial);
        rightBorder.position.set( 0, -0.01, -2.6 ); // Align with the ground (right side)
        scene.add( rightBorder );


        // CANNON WORLD
        const world = new CANNON.World();
        world.broadphase = new CANNON.SAPBroadphase( world );
        //world.allowSleep = true;
        world.gravity.set( 0, -9.82, 0 );

        const defaultMaterial = new CANNON.Material( 'default' );
        const defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            {
                friction: 0.1,
                restitution: 0.7
            }
        );
        world.defaultContactMaterial = defaultContactMaterial;

        // Physics Ground
        const groundShape = new CANNON.Box( new CANNON.Vec3( 7.5, 0.25, 2.5 ) ); // Adjust size to match the visual ground
        const groundBody = new CANNON.Body( {
            mass: 0,
            position: new CANNON.Vec3( 0, -0.25, 0 )
        } );
        groundBody.addShape( groundShape );
        world.addBody( groundBody );

        // Physics Ball
        const ballShape = new CANNON.Sphere( 0.25 );
        const ballBody = new CANNON.Body( {
            mass: 1,
            material: defaultMaterial
        } );
        ballBody.addShape( ballShape );
        ballBody.position.set( -7, 1.25, 0 );
        world.addBody( ballBody );

        // Track objects to update
        const objectsToUpdate = [
            { mesh: ball, body: ballBody }
        ];


        // GUI CONTROLS
        const settings = {
            angle: 45,        // Launch angle
            velocity: 10,     // Initial velocity (speed) of the ball
            mass: 5,          // Ball mass
            launchHeight: 1.25, // Launch height
            //airResistance: true, // Air resistance on/off
            reset: () => {
                ballBody.velocity.set( 0, 0, 0 ); // Reset velocity
                ballBody.angularVelocity.set( 0, 0, 0 );
                ballBody.position.set( -7, settings.launchHeight, 0 ); // Set ball to launch height
            },
            launch: () => {
                ballBody.mass = settings.mass; // Set the ball's mass dynamically
                ballBody.updateMassProperties(); // Update mass properties to recalculate inertia tensor
   
                const angleInRadians = ( settings.angle * Math.PI ) / 180;
                const speed = settings.velocity;
   
                // Apply a scaled velocity based on mass:
                // The higher the mass, the more force it would take to achieve the same velocity
                const adjustedSpeed = speed * ( 1 / Math.sqrt( settings.mass ) ); // Optional: Adjust based on mass
   
                // Set velocity with a directional calculation (based on angle)
                ballBody.velocity.set(
                adjustedSpeed * Math.cos( angleInRadians ),
                adjustedSpeed * Math.sin( angleInRadians ),
                0
                );
            }
        };

        // Add GUI controls
        gui.add( settings, 'angle', 0, 90, 1 ).name( 'Launch Angle' );
        gui.add(settings, 'velocity', 0, 100, 1).name( 'Launch Velocity' );
        gui.add( settings, 'mass', 0.1, 100, 0.1 ).name( 'Ball Mass' );
        gui.add( settings, 'launchHeight', 0.5, 10, 0.1 ).name( 'Launch Height' ); // Launch height control
        //gui.add( settings, 'airResistance' ).name( 'Air Resistance' );
        gui.add( settings, 'reset' ).name( 'Reset' );
        gui.add( settings, 'launch' ).name( 'Launch' );


        // ANIMATION LOOP
        const clock = new THREE.Clock();
        let oldElapsedTime = 0;

        const tick = () => {
            const elapsedTime = clock.getElapsedTime();
            const deltaTime = elapsedTime - oldElapsedTime;
            oldElapsedTime = elapsedTime;
            
            // Update physics
            world.step( 1 / 80, deltaTime, 3 );

            // Update objects
            for( const object of objectsToUpdate ) {
                object.mesh.position.copy( object.body.position );
                object.mesh.quaternion.copy( object.body.quaternion );
            }

            // Update controls
            controls.update();

            // Render
            renderer.render( scene, camera );

            // Call tick again on the next frame
            window.requestAnimationFrame( tick );
        };

        // Handle resizing
        window.addEventListener( 'resize', () => {
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;

            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();

            renderer.setSize( sizes.width, sizes.height );
            renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
        } );
        
        tick()
    }
} );

