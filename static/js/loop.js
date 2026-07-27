// PURPOSE:
// Describe game loop.

import * as STATE from "./state.js";

function loop_render() {
    STATE.state.renderer.render(STATE.state.scene, STATE.state.camera);
}

function loop_control() {
    // pass
}

export function loop() {
    requestAnimationFrame(loop);

    loop_control();
    loop_render();
}