// PURPOSE:
// Store app state.

// -- imports
import * as THREE from 'three';
import {
    event_connect,
    event_connection_login_response,
    event_connection_signup_response,
    event_disconnect,
    event_keydown,
    event_scene_login,
    event_window_resize
} from "./events.js";
import {action_login} from "./actions.js";

export const settings = {
    graphical: {
        background_color: 0x87CEEB,
        fov: 60,
        near: 0.1,
        far: 1000,
        border_width: 0.05,

        renderer: {
            antialias: true,
            shadow_map_enabled: true,
            shadow_map_type: THREE.PCFSoftShadowMap,
            clear_color: 0x87CEEB
        },
        ambient: {
            color: 0xffffff,
            intensity: 0.6
        },
        directional: {
            color: 0xffffff,
            intensity: 1.2,
            position: {x: 10, y: 20, z: 10},
            cast_shadow: true,
            shadow_map_size: 2048,
            shadow_camera: {
                left: -30,
                right: 30,
                top: 30,
                bottom: -30
            }
        },
        floor: {
            size: 100,
            color: 0x90EE90,
            rotation_x: -Math.PI / 2
        },
        outline: {
            thickness: 0.05,
            gradient_steps: [80, 255]
        }
    },

    keybindings: {
        'Space': () => {
        }
    },
    event_listeners: {
        // - default events
        'keydown': event_keydown,
        'resize': event_window_resize,

        // - connection events
        'connection_connect': event_connect,
        'connection_disconnect': event_disconnect,
        'connection_login-response': event_connection_login_response,
        'connection_signup-response': event_connection_signup_response,

        // - scene events
        'scene_name_login': event_scene_login,

        // - element events
        'elem_loginbutton_click': action_login,
    }
};

export let state = {
    camera: null,
    renderer: null,
    scene: null,
    dirLight: null,
    scene_name: "loading",
    connection: null,
    flower: null,
};

state = new Proxy(state, {
    set(target, property, value) {
        target[property] = value;

        if (property === 'scene_name') {
            const eventName = `scene_name_${value}`;
            window.dispatchEvent(new CustomEvent(eventName, {
                detail: {newScene: value}
            }));
        }
        return true;
    }
});