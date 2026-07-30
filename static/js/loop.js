// PURPOSE:
// Describe game loop.

import * as STATE from "./state.js";
import * as THREE from 'three';
import {create_mob, hide_map, remove_mob, show_map, update_mob_positions} from "./utils.js";

function loop_render() {
    STATE.state.renderer.render(STATE.state.scene, STATE.state.camera);
}

function loop_update_models() {
    const delta = STATE.state.clock.getDelta();

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
    let player_pos = STATE.state.game_state.world.mobs[player_mob_identity].position;
    const px = Math.floor(player_pos.x !== undefined ? player_pos.x : player_pos[0]);
    const py = Math.floor(player_pos.y !== undefined ? player_pos.y : player_pos[1]);
    const radius = STATE.settings.graphical.render_radius;
    const shown_map = STATE.state.object_groups['shown_map'];

    const shown_set = new Set();

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

    for (const key of shown_map) {
        if (!shown_set.has(key)) {
            const [x, y] = key.split(',').map(Number);
            hide_map(x, y);
        }
    }
}

function loop_update_camera_controls() {
    const player_mob_identity = STATE.state.game_state.flower.mob.identity;
    const flowerPos = STATE.state.game_state.world.mobs[player_mob_identity].position;
    const spacing = STATE.settings.graphical.scene_scale;

    const newTargetX = flowerPos.x * spacing;
    const newTargetZ = flowerPos.y * spacing;
    const newTargetY = 0;

    const target = STATE.state.controls.target;

    const deltaX = newTargetX - target.x;
    const deltaY = newTargetY - target.y;
    const deltaZ = newTargetZ - target.z;

    target.x += deltaX;
    target.y += deltaY;
    target.z += deltaZ;

    STATE.state.camera.position.x += deltaX;
    STATE.state.camera.position.y += deltaY;
    STATE.state.camera.position.z += deltaZ;

    STATE.state.controls.update();
}

export function loop_update_player_movement_controls() {
    const dir = new THREE.Vector3();
    STATE.state.camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3(
        dir.z,
        0,
        -dir.x
    );
    let dx = 0;
    let dy = 0;
    const keys = STATE.state.keys_pressed
    if (keys["KeyW"]) {
        dx += dir.x;
        dy += dir.z;
    }
    if (keys["KeyD"]) {
        dx -= right.x;
        dy -= right.z;
    }
    if (keys["KeyA"]) {
        dx += right.x;
        dy += right.z;
    }
    if (keys["KeyS"]) {
        dx -= dir.x;
        dy -= dir.z;
    }
    const len = Math.hypot(dx, dy);
    if (len > 0) {
        dx /= len;
        dy /= len;
    }
    const player_mob_identity = STATE.state.game_state.flower.mob.identity;
    let model = STATE.state.objects[player_mob_identity];
    if (model) {
        const angle = Math.atan2(dy, dx);

        let cam = STATE.state.camera.position
        model[0].lookAt(cam.x, -1, cam.z);
    }
    STATE.state.game_state.world.mobs[player_mob_identity].position.x += dx * 0.09
    STATE.state.game_state.world.mobs[player_mob_identity].position.y += dy * 0.09
    STATE.state.connection.emit('move', {
        'x': STATE.state.game_state.world.mobs[player_mob_identity].position.x,
        'y': STATE.state.game_state.world.mobs[player_mob_identity].position.y,
    })
}

function loop_update_controls() {
    loop_update_camera_controls();
    loop_update_player_movement_controls();
}

function loop_update_mobs() {
    const connection_mobs = new Set(
        Object.keys(STATE.state.game_state.world.mobs)
    );

    const current_mobs = STATE.state.object_groups.mobs;

    current_mobs.forEach((mob) => {
        if (!connection_mobs.has(mob)) {
            remove_mob(mob);
        }
    })
    connection_mobs.forEach((mob) => {
        if (!current_mobs.has(mob)) {
            create_mob(mob);
        }
    })
    update_mob_positions();
}

export function loop() {
    STATE.state.frames += 1
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