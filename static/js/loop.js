// PURPOSE:
// Describe game loop.

import * as STATE from "./state.js";
import {hide_map, show_map} from "./utils.js";

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
    let player_pos = STATE.state.game_state.flower.mob.position;
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

function loop_update_controls() {
    const flowerPos = STATE.state.game_state.flower.mob.position;
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

function loop_update_mobs() {
    // nothing here just yet.
}

export function loop() {
    STATE.state.frames += 1
    requestAnimationFrame(loop);

    loop_update_models();
    if (STATE.state.scene_name === "game") {
        loop_update_controls();
        loop_update_mobs();
        if (STATE.state.frames % 30 === 0) {
            loop_update_fog();
        }
    }

    loop_render();
}