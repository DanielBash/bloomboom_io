// PURPOSE:
// Handle events.

import * as STATE from './state.js'

// - DOM events
export function event_window_resize() {
    console.log('[INFO] The window is resized.')
    STATE.state.camera.aspect = window.innerWidth / window.innerHeight;
    STATE.state.camera.updateProjectionMatrix();
    STATE.state.renderer.setSize(window.innerWidth, window.innerHeight);
}

export function event_keydown(event) {
    const action = STATE.settings.keybindings[event.code];
    if (action) {
        event.preventDefault();
        action(event);
    }
}

// - scene switching
export function event_scene_login() {
    console.log('[INFO] Switching scene to login.')
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';
}

// - connection events
export function event_connection_login_response(data) {
    const error_text = document.getElementById('loginerror');
    if (data["status"] === "OK") {
        console.log("[INFO] Login successful.");
        error_text.innerText = "";
    } else {
        error_text.innerText = data["response"];
    }
}

export function event_connection_signup_response(data) {
    const error_text = document.getElementById('loginerror');
    if (data["status"] === "OK") {
        console.log("[INFO] Signup successful. Attempting login now.");
        STATE.state.connection.emit('login', {
            "username": data["response"]["username"],
            "password": data["response"]["password"]
        });
    } else {
        error_text.innerText = data["response"];
    }
}

export function event_connect() {
    console.log('[INFO] The client is connected.')
    STATE.state.scene_name = "login";
}

export function event_disconnect() {
    console.log('[INFO] The client is disconnected.')
    window.location.reload();
}