// PURPOSE:
// Describe game loop.

import * as STATE from "./state.js";

function loop_render() {
    const delta = STATE.state.clock.getDelta();

    Object.values(STATE.settings.models).forEach((model) => {
        if (model && model.userData && model.userData.mixer) {
            model.userData.mixer.update(delta);
        }
    });

    if (STATE.settings.models.flower_game) {
        STATE.settings.models.flower_game.rotation.y += 0.02;
    }

    STATE.state.renderer.render(STATE.state.scene, STATE.state.camera);

}

export function loop() {
    requestAnimationFrame(loop);

    loop_render();
}