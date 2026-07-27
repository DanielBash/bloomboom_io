// PURPOSE:
// Start the client.

import * as THREE from 'three';
import * as STATE from './state.js';
import {apply_toon_and_outlines} from './utils.js'; // Import the new init function
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function init_scene() {
    const G = STATE.settings.graphical;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(G.background_color);

    const camera = new THREE.PerspectiveCamera(
        G.fov, window.innerWidth / window.innerHeight, G.near, G.far
    );
    camera.position.set(12, 12, 0);

    const renderer = new THREE.WebGLRenderer({antialias: G.renderer.antialias});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = G.renderer.shadow_map_enabled;
    renderer.shadowMap.type = G.renderer.shadow_map_type;
    document.body.appendChild(renderer.domElement);

    STATE.state.scene = scene;
    STATE.state.camera = camera;
    STATE.state.renderer = renderer;
}

function init_lighting() {
    const G = STATE.settings.graphical;
    const scene = STATE.state.scene;

    const ambient = new THREE.AmbientLight(G.ambient.color, G.ambient.intensity);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(G.directional.color, G.directional.intensity);
    dirLight.position.set(
        G.directional.position.x, G.directional.position.y, G.directional.position.z
    );
    dirLight.castShadow = G.directional.cast_shadow;
    dirLight.shadow.mapSize.width = G.directional.shadow_map_size;
    dirLight.shadow.mapSize.height = G.directional.shadow_map_size;
    dirLight.shadow.camera.left = G.directional.shadow_camera.left;
    dirLight.shadow.camera.right = G.directional.shadow_camera.right;
    dirLight.shadow.camera.top = G.directional.shadow_camera.top;
    dirLight.shadow.camera.bottom = G.directional.shadow_camera.bottom;

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
                const processedModel = apply_toon_and_outlines(gltf.scene, 0x000000);

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
    init_models().then(() => {
    });
    init_clock();
    init_scene();
    init_lighting();
    init_listeners();
    console.log('[INFO] Engine loaded.')
}