// PURPOSE:
// Describe game loop.

import * as STATE from "./state.js";

function loop_render() {
    STATE.state.renderer.render(STATE.state.scene, STATE.state.camera);
}

function loop_update_models() {
    const delta = STATE.state.clock.getDelta();

    Object.values(STATE.state.objects).forEach((model) => {
        if (model && model.userData && model.userData.mixer) {
            model.userData.mixer.update(delta);
        }
    });
}

export function loop() {
    requestAnimationFrame(loop);

    loop_update_models();
    loop_render();
}