// PURPOSE:
// Store app state.

// -- imports
import {
    event_connect,
    event_connection_login_response,
    event_connection_signup_response, event_death,
    event_disconnect,
    event_keydown, event_keyup,
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
        far: 500,
        scene_scale: 32,
        render_radius: 11,
        antialias: true,
    },

    keybindings: {
        'Space': () => {
        }
    },
    event_listeners: {
        // - default events
        'keydown': event_keydown,
        'resize': event_window_resize,
        'keyup': event_keyup,

        // - connection events
        'connection_connect': event_connect,
        'connection_disconnect': event_disconnect,
        'connection_login-response': event_connection_login_response,
        'connection_signup-response': event_connection_signup_response,
        'connection_state': event_state,
        'connection_death': event_death,

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
    controls: 0,
    frames: 0,
    camera: null,
    renderer: null,
    scene: null,
    dirLight: null,
    scene_name: "loading",
    connection: null,
    clock: null,
    label_renderer: null,
    objects: {
        'map': [],
        'mobs': []
    },
    models: {},
    game_state: {
        'world': {
            'map': [],
            'mobs': {}
        },
        'flower': {
            'account': {},
            'mob': {
                'position': {
                    'x': 50,
                    'y': 50
                },
                'identity': null,
            }
        },
        'scene_name': 'login',
    },
    object_groups: {
        'map': [[]],
        'shown_map': new Set(),
        'mobs': new Set(),
    },
    keys_pressed: {},
    delta: 0.01,
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