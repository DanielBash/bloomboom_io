// PURPOSE:
// Handle events.

import * as STATE from './state.js'
import {clear_map} from "./utils.js";

const eventEmitter = {
    emit(eventName, data) {
        const event = new CustomEvent(eventName, {detail: data});
        window.dispatchEvent(event);
    }
};

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
    STATE.state.keys_pressed[event.code] = true;
}

export function event_keyup(event) {
    STATE.state.keys_pressed[event.code] = false;
}

// - scene switching
export function event_scene_login() {
    console.log('[INFO] Switching scene to login.')
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('game-screen').style.display = 'none';
}

export function event_scene_lobby() {
    console.log('[INFO] Switching scene to lobby.')
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
}

export function event_scene_game() {
    console.log('[INFO] Switching scene to game.')
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    document.getElementById('lobby-screen').style.display = 'none';
}

// - connection events
export function event_connection_login_response(data) {
    const error_text = document.getElementById('loginerror');
    if (data["status"] === "OK") {
        console.log("[INFO] Login successful.");
        error_text.innerText = "";
        STATE.state.scene_name = "lobby";
        document.getElementById('lobbynickname').innerText = data["response"]["username"];
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

function isPlainObject(val) {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function event_state(data) {
    const response = data['response'];
    if (!response) return;

    deepUpdate(STATE.state.game_state, response, 'statechange');
}

function deepUpdate(target, newData, pathPrefix) {
    for (const key in newData) {
        if (!Object.prototype.hasOwnProperty.call(newData, key)) continue;

        const newValue = newData[key];
        const oldValue = target[key];
        const eventName = `${pathPrefix}_${key}`;

        if (isPlainObject(newValue) && isPlainObject(oldValue)) {
            deepUpdate(oldValue, newValue, eventName);
        } else {
            if (oldValue !== newValue) {
                target[key] = newValue;

                eventEmitter.emit(eventName, {
                    newValue: newValue,
                    oldValue: oldValue
                });
            }
        }
    }
}

export function event_world_map() {
    console.log('[INFO] Map changed.');

    const mapData = STATE.state.game_state.world.map;
    clear_map();
    STATE.state.game_state.world.map = mapData;

    const rows = mapData.length;
    const cols = mapData[0].length;

    STATE.state.object_groups.map = [];
    for (let row = 0; row < rows; row++) {
        STATE.state.object_groups.map.push(new Array(cols).fill(null));
    }
}
