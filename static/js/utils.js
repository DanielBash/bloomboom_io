// PURPOSE:
// Provide game utils for other modules.

import * as THREE from 'three';
import * as STATE from "./state.js";
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

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

export function remove_mob(identity) {
    STATE.state.object_groups.mobs.delete(identity);
    STATE.state.objects[identity].forEach((obj) => {
        STATE.state.scene.remove(obj);
    });
    delete STATE.state.objects[identity];
    console.log("[INFO] Mob deleted: " + identity);
}

export function create_mob(identity) {
    const data = STATE.state.game_state.world.mobs[identity];
    const instance = clone_model(STATE.state.models[data['type']]);
    const spacing = STATE.settings.graphical.scene_scale;

    instance.scale.set(spacing * 0.5, spacing * 0.5, spacing * 0.5);

    STATE.state.objects[identity] = [instance];
    STATE.state.scene.add(STATE.state.objects[identity][0]);
    STATE.state.object_groups.mobs.add(identity);
    play_animation(instance, "default", false);

    if (data['type'] === 'flower') {
        const username_div = document.createElement('div');
        username_div.textContent = data['name'] || identity;
        username_div.style.color = 'white';
        username_div.style.fontFamily = "'Ubuntu', sans-serif";
        username_div.style.fontSize = '20px';
        username_div.style.fontWeight = 'bold';
        username_div.style.textShadow = '1px 1px 2px black';

        const label = new CSS2DObject(username_div);
        label.name = 'mob_label';
        STATE.state.scene.add(label);
        STATE.state.objects[identity].push(label);
    }

    console.log("[INFO] Mob created: " + identity);
}

export function update_mob_positions() {
    const spacing = STATE.settings.graphical.scene_scale;
    const player_mob_identity = STATE.state.game_state?.flower?.mob?.identity;

    Object.values(STATE.state.game_state.world.mobs).forEach((mob) => {
        const identity = mob.identity;
        const modelArr = STATE.state.objects[identity];

        if (!modelArr || !modelArr[0]) return;

        const model = modelArr[0];
        const tar_z = mob.position.y * spacing;
        const tar_x = mob.position.x * spacing;

        // DO NOT lerp the local player. Their position is handled by
        // client-side prediction in the game loop to prevent stuttering.
        if (identity !== player_mob_identity) {
            // Interpolate remote mobs smoothly
            const lerpFactor = 0.2;

            const newX = model.position.x + (tar_x - model.position.x) * lerpFactor;
            const newZ = model.position.z + (tar_z - model.position.z) * lerpFactor;

            model.position.set(newX, -1, newZ);

            // Smooth rotation
            model.rotation.x = mob.rotation[0];
            model.rotation.y += (mob.rotation[1] - model.rotation.y) * lerpFactor;
            model.rotation.z = mob.rotation[2];
        } else {
            // For the local player, just ensure Y is locked.
            // X and Z are controlled strictly by loop_update_player_movement_controls
            model.position.y = -1;
        }

        // Update label/name tag position
        if (modelArr.length > 1) {
            modelArr[1].position.set(
                model.position.x,
                spacing * 0.5,
                model.position.z,
            );
        }
    });
}