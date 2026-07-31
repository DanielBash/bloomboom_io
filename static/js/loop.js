// PURPOSE:
// Describe game loop.

import * as STATE from "./state.js";
import * as THREE from 'three';
import {create_mob, hide_map, remove_mob, show_map, update_mob_positions} from "./utils.js";

// Network throttling variables
let last_move_emit_time = 0;
const MOVE_EMIT_INTERVAL = 0.1; // Emit movement to server 10 times per second

function loop_render() {
    STATE.state.renderer.render(STATE.state.scene, STATE.state.camera);
    STATE.state.label_renderer.render(STATE.state.scene, STATE.state.camera);
}

function loop_update_models() {
    const delta = STATE.state.clock.getDelta();
    STATE.state.delta = delta;

    for (const category of Object.values(STATE.state.objects)) {
        for (const model of category) {
            if (model?.userData?.mixer && model.visible) {
                model.userData.mixer.update(delta);
            }
        }
    }
}

function loop_update_fog() {
    const player_mob_identity = STATE.state.game_state.flower.mob.identity;
    const modelArr = STATE.state.objects[player_mob_identity];

    if (!modelArr || !modelArr[0]) {
        return;
    }

    const spacing = STATE.settings.graphical.scene_scale;

    // Calculate grid position based on the VISUAL 3D model position.
    // This prevents desync with the delayed network state.
    const px = Math.floor(modelArr[0].position.x / spacing);
    const py = Math.floor(modelArr[0].position.z / spacing);

    const radius = STATE.settings.graphical.render_radius;
    const shown_map = STATE.state.object_groups['shown_map'];
    const shown_set = new Set();

    // Show maps within radius
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = px + dx;
            const y = py + dy;
            const key = `${x},${y}`;
            shown_set.add(key);
            if (!shown_map.has(key)) {
                show_map(x, y);
            }
        }
    }

    // Hide maps out of radius (Safe iteration to avoid mutating Set while iterating)
    const keys_to_hide = [];
    for (const key of shown_map) {
        if (!shown_set.has(key)) {
            const [x, y] = key.split(',').map(Number);
            keys_to_hide.push({ x, y });
        }
    }

    keys_to_hide.forEach(({ x, y }) => {
        hide_map(x, y);
    });
}

function loop_update_camera_controls() {
    const player_mob_identity = STATE.state.game_state.flower.mob.identity;
    if (!STATE.state.objects[player_mob_identity] || !STATE.state.objects[player_mob_identity][0]) {
        return;
    }

    const flowerModel = STATE.state.objects[player_mob_identity][0];
    const target = STATE.state.controls.target;

    // Hard snap camera to target to keep player perfectly centered
    const deltaX = flowerModel.position.x - target.x;
    const deltaZ = flowerModel.position.z - target.z;

    target.x += deltaX;
    target.y = 0;
    target.z += deltaZ;

    STATE.state.camera.position.x += deltaX;
    STATE.state.camera.position.z += deltaZ;

    STATE.state.controls.update();
}

export function loop_update_player_movement_controls() {
    const dir = new THREE.Vector3();
    STATE.state.camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    const right = new THREE.Vector3(dir.z, 0, -dir.x);

    let dx = 0;
    let dz = 0;
    const keys = STATE.state.keys_pressed;

    if (keys["KeyW"]) { dx += dir.x;   dz += dir.z; }
    if (keys["KeyS"]) { dx -= dir.x;   dz -= dir.z; }
    if (keys["KeyA"]) { dx += right.x; dz += right.z; }
    if (keys["KeyD"]) { dx -= right.x; dz -= right.z; }

    const len = Math.hypot(dx, dz);
    if (len > 0) {
        dx /= len;
        dz /= len;
    }

    const player_mob_identity = STATE.state.game_state.flower.mob.identity;
    const modelArr = STATE.state.objects[player_mob_identity];

    if (modelArr && modelArr[0]) {
        const model = modelArr[0];
        const cam = STATE.state.camera.position;
        const spacing = STATE.settings.graphical.scene_scale;
        const speed = 5;
        const delta = STATE.state.delta;

        model.position.x += dx * speed * delta * spacing;
        model.position.z += dz * speed * delta * spacing;
        model.position.y = -1;

        model.lookAt(cam.x, -1, cam.z);

        if (STATE.state.clock.elapsedTime - last_move_emit_time >= MOVE_EMIT_INTERVAL) {
            last_move_emit_time = STATE.state.clock.elapsedTime;

            STATE.state.connection.emit('move', {
                'x': model.position.x / spacing,
                'y': model.position.z / spacing,
                'rotation': [model.rotation.x, model.rotation.y, model.rotation.z]
            });
        }
    }
}

function loop_update_controls() {
    loop_update_camera_controls();
    loop_update_player_movement_controls();
}

function loop_update_mobs() {
    const connection_mobs = new Set(Object.keys(STATE.state.game_state.world.mobs));
    const current_mobs = STATE.state.object_groups.mobs;

    current_mobs.forEach((mob) => {
        if (!connection_mobs.has(mob)) {
            remove_mob(mob);
        }
    });

    connection_mobs.forEach((mob) => {
        if (!current_mobs.has(mob)) {
            create_mob(mob);
        }
    });

    update_mob_positions();
}

export function loop() {
    STATE.state.frames += 1;
    requestAnimationFrame(loop);

    loop_update_models();

    if (STATE.state.scene_name === "game" && STATE.state.game_state.scene_name === "game") {
        loop_update_controls();
        loop_update_mobs();
        if (STATE.state.frames % 30 === 0) {
            loop_update_fog();
        }
    }

    loop_render();
}