// PURPOSE:
// Start the client.

import * as THREE from 'three';
import * as STATE from './state.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

function init_scene(fov, near, far, background_color, antialias, shadow_map_enabled, shadow_map_type) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background_color);

    const camera = new THREE.PerspectiveCamera(
        fov, window.innerWidth / window.innerHeight, near, far
    );
    camera.position.set(12, 12, 0);

    const renderer = new THREE.WebGLRenderer({
        antialias: antialias,
        powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.shadowMap.enabled = shadow_map_enabled;
    renderer.shadowMap.type = shadow_map_type;
    renderer.domElement.style.zIndex = '9';
    document.body.appendChild(renderer.domElement);

    STATE.state.scene = scene;
    STATE.state.camera = camera;
    STATE.state.renderer = renderer;
    STATE.state.controls = new OrbitControls(camera, renderer.domElement);
    STATE.state.controls.enablePan = false;
    STATE.state.controls.minDistance = 16.0;
    STATE.state.controls.maxDistance = 150.0;
    STATE.state.controls.maxPolarAngle = Math.PI / 2.1;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none'
    labelRenderer.domElement.style.zIndex = '10';
    document.body.appendChild(labelRenderer.domElement);
    STATE.state.label_renderer = labelRenderer;
}

function init_lighting() {
    const scene = STATE.state.scene;

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(0, 0, 0);
    dirLight.castShadow = false;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;

    scene.add(dirLight);
    STATE.state.dirLight = dirLight;
}

function init_connection() {
    let connection = io();
    STATE.state.connection = connection;
}

function init_listeners() {
    Object.entries(STATE.settings.event_listeners).forEach(([eventType, handler]) => {
        if (eventType.startsWith("elem_")) {
            const parts = eventType.split('_');
            const eventName = parts.pop();
            const elementId = parts.slice(1).join('_');
            const element = document.getElementById(elementId);
            if (element) element.addEventListener(eventName, handler);
        } else if (eventType.startsWith("connection_")) {
            STATE.state.connection.on(eventType.slice(11), handler);
        } else {
            window.addEventListener(eventType, handler);
        }
    });
}

function init_clock() {
    const clock = new THREE.Clock();
    STATE.state.clock = clock;
}

export async function init_models() {
    if (!STATE.state.models) {
        STATE.state.models = {};
    }

    const modelNames = await new Promise((resolve) => {
        const socket = STATE.state.connection;
        if (!socket) {
            console.error("[ERROR] No socket.io connection available in STATE.state.connection");
            resolve([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            console.error("[ERROR] Timed out waiting for assets-response from server");
            socket.off("assets-response");
            resolve([]);
        }, 15000);

        socket.once("assets-response", (data) => {
            clearTimeout(timeoutId);

            if (!data || data['status'] === "ERROR") {
                console.error("[ERROR] Failed to fetch assets list:", data);
                resolve([]);
                return;
            }

            const models = (data['response'] && data['response']['models']) || [];
            resolve(models);
        });

        socket.emit("assets");
    });

    if (modelNames.length === 0) {
        console.warn("[WARN] No models returned from server, skipping model loading.");
        return;
    }

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const loader = new GLTFLoader();
    const modelPromises = [];

    for (const name of modelNames) {
        const url = `${baseUrl}/static/models/${name}.gltf`;

        const promise = loader.loadAsync(url)
            .then((gltf) => {
                const processedModel = gltf.scene;
                const mixer = new THREE.AnimationMixer(processedModel);

                const actions = {};
                gltf.animations.forEach((clip) => {
                    actions[clip.name] = mixer.clipAction(clip);
                });

                processedModel.userData.mixer = mixer;
                processedModel.userData.actions = actions;
                STATE.state.models[name] = processedModel;
                console.log(`[INFO] Model loaded: ${name}`);
            })
            .catch((err) => {
                console.error(`[ERROR] Failed to load model: ${name} from ${url}`, err);
                STATE.state.models[name] = null;
            });

        modelPromises.push(promise);
    }

    await Promise.all(modelPromises);
}

export function init() {
    console.log('[INFO] Engine loading.')

    init_connection();
    init_models().then();
    init_clock();
    const G = STATE.settings.graphical;
    init_scene(
        G.fov,
        G.near,
        G.far,
        G.background_color,
        G.antialias,
        false,
        THREE.PCFSoftShadowMap
    );
    init_lighting();
    init_listeners();

    console.log('[INFO] Engine loaded.')
}
