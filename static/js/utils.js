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
    const mapData = STATE.state.game_state.world.map;
    if (!mapData[y] || !mapData[y][x]) return null;

    const modelName = mapData[y][x];
    const models = STATE.state.models;
    const spacing = STATE.settings.graphical.scene_scale;

    const originalModel = models ? models[modelName] : null;
    if (!originalModel) {
        console.warn(`[WARN] Model "${modelName}" not found in STATE.state.models.`);
        return null;
    }

    const instance = clone_model(originalModel);

    const { rows, maxCols } = STATE.state.game_state.world.dimensions;

    const posX = x * spacing - ((maxCols - 1) * spacing) / 2;
    const posY = -1;
    const posZ = y * spacing - ((rows - 1) * spacing) / 2;

    instance.position.set(posX, posY, posZ);
    instance.scale.set(spacing, spacing, spacing);

    if (STATE.state.scene) {
        STATE.state.scene.add(instance);
    }

    if (!STATE.state.objects) {
        STATE.state.objects = [];
    }
    STATE.state.objects.push(instance);

    STATE.state.object_groups.map[y][x] = instance;

    play_animation(instance, "default", false);

    return instance;
}

export function hide_map(x, y) {
    try {
        if (STATE.state.object_groups.map[y] && STATE.state.object_groups.map[y][x]) {
            STATE.state.object_groups.map[y][x].visible = false;
        }
    } catch (e) {}
}

export function show_map(x, y) {
    try {
        if (STATE.state.object_groups.map[y] && STATE.state.object_groups.map[y][x]) {
            STATE.state.object_groups.map[y][x].visible = true;
        } else {
            create_map(x, y);
        }

        const shown_map = STATE.state.object_groups.shown_map;
        let exists = false;
        for (let i = 0; i < shown_map.length; i++) {
            if (shown_map[i][0] === x && shown_map[i][1] === y) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            shown_map.push([x, y]);
        }
    } catch (e) {}
}
export function clear_map() {
    const objMap = STATE.state.object_groups?.map;

    if (objMap) {
        for (let y = 0; y < objMap.length; y++) {
            if (objMap[y]) {
                for (let x = 0; x < objMap[y].length; x++) {
                    const obj = objMap[y][x];
                    if (obj) {
                        if (STATE.state.scene) {
                            STATE.state.scene.remove(obj);
                        }
                    }
                }
            }
        }
    }
    if (STATE.state.object_groups) {
        STATE.state.object_groups.map = [];
        STATE.state.object_groups.shown_map = [];
    }
}