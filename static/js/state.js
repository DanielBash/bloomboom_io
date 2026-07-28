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
    event_scene_game,
    event_scene_lobby,
    event_scene_login,
    event_state,
    event_window_resize,
    event_world_map
} from "./events.js";
import {action_login, action_play} from "./actions.js";

export const settings = {
    graphical: {
        background_color: 0x87CEEB,
        fov: 60,
        near: 0.1,
        far: 1000,
        scene_scale: 32,
        render_radius: 11,

        renderer: {
            antialias: true,
            shadow_map_enabled: false,
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
            position: {x: 0, y: 0, z: 0},
            cast_shadow: false,
            shadow_map_size: 2048,
            shadow_camera: {
                left: -30,
                right: 30,
                top: 30,
                bottom: -30
            }
        },
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
        'connection_state': event_state,

        // - scene events
        'scene_name_login': event_scene_login,
        'scene_name_lobby': event_scene_lobby,
        'scene_name_game': event_scene_game,

        // - element events
        'elem_loginbutton_click': action_login,
        'elem_playbutton_click': action_play,

        // - state changes
        'statechange_world_map': event_world_map,
    },
};

export let state = {
    frames: 0,
    camera: null,
    renderer: null,
    scene: null,
    dirLight: null,
    scene_name: "loading",
    connection: null,
    clock: null,
    objects: [],
    models: {},
    game_state: {
        'world': {
            'map': [],
            'flower': {
                'position': {
                    'x': 0,
                    'y': 0
                }
            }
        }
    },
    object_groups: {
        'map': [[]],
        'shown_map': new Set(),
    }
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