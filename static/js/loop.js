// PURPOSE:
// Describe game loop.

import * as STATE from "./state.js";
import {hide_map, show_map} from "./utils.js";

function loop_render() {
    STATE.state.renderer.render(STATE.state.scene, STATE.state.camera);
}

function loop_update_models() {
    const delta = STATE.state.clock.getDelta();

    Object.values(STATE.state.objects).forEach((model) => {
        if (model && model.userData && model.userData.mixer && model.visible) {
            model.userData.mixer.update(delta);
        }
    });
}

function loop_update_fog() {
    console.log('[INFO] Updating the fog.')
    if (!STATE.state.game_state.world.map) {
        return;
    }
    let player_pos = STATE.state.game_state.world.flower.position;

    const px = Math.floor(player_pos.x !== undefined ? player_pos.x : player_pos[0]);
    const py = Math.floor(player_pos.y !== undefined ? player_pos.y : player_pos[1]);

    const radius = STATE.settings.graphical.render_radius;
    const shown_map = STATE.state.object_groups['shown_map'];

    const shown_set = new Set();

    for (const cell of shown_map) {
        const [x, y] = cell;
        shown_set.add(`${x},${y}`);

        if (Math.abs(x - px) > radius || Math.abs(y - py) > radius) {
            hide_map(x, y);
        }
    }

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = px + dx;
            const y = py + dy;

            if (!shown_set.has(`${x},${y}`)) {
                show_map(x, y);
            }
        }
    }
}

export function loop() {
    STATE.state.frames += 1
    requestAnimationFrame(loop);

    loop_update_models();
    loop_render();
    if (STATE.state.frames % 30 === 0) {
        loop_update_fog();
    }
}