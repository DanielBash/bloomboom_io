// PURPOSE:
// Provide game utils for other modules.

import * as THREE from 'three';
import * as STATE from "./state.js";

export function play_animation(model, actionName, loopOnce = false) {
    if (!model || !model.userData.actions || !model.userData.actions[actionName]) {
        return;
    }

    const action = model.userData.actions[actionName];

    if (loopOnce) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
    } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
    }

    action.reset();
    action.play();
}

export function clone_model(model) {
    const tempUserData = model.userData;
    model.userData = {};

    const instance = model.clone();

    model.userData = tempUserData;

    instance.userData = {};

    const mixer = new THREE.AnimationMixer(instance);
    instance.userData.mixer = mixer;
    instance.userData.actions = {};

    if (tempUserData && tempUserData.actions) {
        for (const clipName in tempUserData.actions) {
            const clip = tempUserData.actions[clipName].getClip();
            instance.userData.actions[clipName] = mixer.clipAction(clip);
        }
    }
    return instance
}

export function create_map(x, y) {
    const modelName = STATE.state.game_state.world.map[y][x];
    const model = STATE.state.models[modelName];
    const instance = clone_model(model);
    const spacing = STATE.settings.graphical.scene_scale;
    const posX = x * spacing;
    const posY = -1;
    const posZ = y * spacing;
    instance.position.set(posX, posY, posZ);
    instance.scale.set(spacing, spacing, spacing);
    STATE.state.scene.add(instance);
    STATE.state.objects['map'].push(instance);
    STATE.state.object_groups.map[y][x] = instance;
    play_animation(instance, "default", false);
    return instance;
}

export function hide_map(x, y) {
    const map = STATE.state.object_groups.map;
    if (map && y >= 0 && y < map.length && x >= 0 && x < map[y].length && map[y][x] != null) {
        map[y][x].visible = false;
    }
    STATE.state.object_groups.shown_map.delete(`${x},${y}`);
}

export function show_map(x, y) {
    const map = STATE.state.object_groups['map'];

    if (map && y >= 0 && y < map.length && x >= 0 && x < map[y].length && map[y][x] != null) {
        map[y][x].visible = true;
    } else if (map && y >= 0 && y < map.length && x >= 0 && x < map[y].length) {
        create_map(x, y);
    }

    const shown_map = STATE.state.object_groups['shown_map'];
    const key = `${x},${y}`;
    if (!shown_map.has(key)) {
        shown_map.add(key);
    }
}

export function clear_map() {
    const objMap = STATE.state.objects['map'];

    for (let y = 0; y < objMap.length; y++) {
        STATE.state.scene.remove(objMap[y]);
    }
    if (STATE.state.object_groups) {
        STATE.state.object_groups['map'] = [];
        STATE.state.object_groups['shown_map'] = new Set();
        STATE.state.objects['map'] = [];
    }
}