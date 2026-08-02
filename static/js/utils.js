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
    const posY = 0;
    const posZ = y * spacing;
    instance.position.set(posX, posY, posZ);
    instance.scale.set(spacing, spacing, spacing);
    STATE.state.scene.add(instance);

    const key = 'tile_' + x + '_' + y;
    STATE.state.objects[key] = [instance];

    if (!STATE.state.object_groups.map[y]) {
        STATE.state.object_groups.map[y] = [];
    }
    STATE.state.object_groups.map[y][x] = instance;

    play_animation(instance, "default", false);
    return instance;
}

export function hide_map(x, y) {
    const map = STATE.state.object_groups.map;
    const key = 'tile_' + x + '_' + y;

    if (map && y >= 0 && y < map.length && x >= 0 && x < map[y].length) {
        const instance = map[y][x];
        if (instance) {
            if (instance.userData && instance.userData.mixer) {
                instance.userData.mixer.stopAllAction();
                instance.userData.mixer = null;
                instance.userData.actions = {};
            }
            STATE.state.scene.remove(instance);
            map[y][x] = null;
        }
        if (STATE.state.objects[key]) {
            delete STATE.state.objects[key];
        }
    }
    STATE.state.object_groups.shown_map.delete(`${x},${y}`);
}

export function clear_map() {
    const objects = STATE.state.objects;

    const tileKeys = Object.keys(objects).filter((k) => k.startsWith('tile_'));

    for (const key of tileKeys) {
        const arr = objects[key];
        if (arr) {
            for (const obj of arr) {
                if (!obj) continue;
                if (obj.userData && obj.userData.mixer) {
                    obj.userData.mixer.stopAllAction();
                    obj.userData.mixer = null;
                    obj.userData.actions = {};
                }
                STATE.state.scene.remove(obj);
            }
        }
        delete objects[key];
    }

    if (STATE.state.object_groups) {
        const ogMap = STATE.state.object_groups['map'];
        if (ogMap) {
            for (let y = 0; y < ogMap.length; y++) {
                if (ogMap[y]) {
                    for (let x = 0; x < ogMap[y].length; x++) {
                        ogMap[y][x] = null;
                    }
                }
            }
        }
        STATE.state.object_groups['shown_map'] = new Set();
    }
}

export function show_map(x, y) {
    const map = STATE.state.object_groups['map'];
    const key = 'tile_' + x + '_' + y;

    if (map && y >= 0 && y < map.length && x >= 0 && x < map[y].length) {
        const existing = STATE.state.objects[key];
        if (existing && existing[0]) {
        } else {
            create_map(x, y);
        }
    }

    const shown_map = STATE.state.object_groups['shown_map'];
    const shownKey = `${x},${y}`;
    if (!shown_map.has(shownKey)) {
        shown_map.add(shownKey);
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
    instance.scale.set(spacing * 0.5 * data['rarity'], spacing * 0.5 * data['rarity'], spacing * 0.5 * data['rarity']);
    instance.position.set(spacing * data['position']['x'], -1, spacing * data['position']['y'])

    STATE.state.objects[identity] = [instance];
    STATE.state.scene.add(STATE.state.objects[identity][0]);
    STATE.state.object_groups.mobs.add(identity);
    play_animation(instance, "default", false);

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.pointerEvents = 'none';

    const username_div = document.createElement('div');
    username_div.textContent = data['name'] || identity;
    if (data["type"] === "flower") {
        username_div.style.color = '#fff767';
    } else {
        username_div.style.color = 'white';
    }
    username_div.style.fontFamily = "'Ubuntu', sans-serif";
    username_div.style.fontSize = '20px';
    username_div.style.fontWeight = 'bold';
    username_div.style.textShadow = '1px 1px 2px black';

    const health_bar_div = document.createElement('div');
    health_bar_div.style.width = '60px';
    health_bar_div.style.height = '6px';
    health_bar_div.style.backgroundColor = '#333';
    health_bar_div.style.borderRadius = '3px';
    health_bar_div.style.overflow = 'hidden';
    health_bar_div.style.marginTop = '4px';

    const health_div = document.createElement('div');
    health_div.style.width = '100%';
    health_div.style.height = '100%';
    health_div.style.backgroundColor = '#3cb163';
    health_div.style.transition = 'width 0.2s';
    health_div.id = 'health-fill-' + identity;

    health_bar_div.appendChild(health_div);
    container.appendChild(username_div);
    container.appendChild(health_bar_div);

    health_bar_div.appendChild(health_div);
    container.appendChild(username_div);
    container.appendChild(health_bar_div);

    const label = new CSS2DObject(container);
    label.name = 'mob_label';
    label.health_bar = health_div;
    STATE.state.scene.add(label);
    STATE.state.objects[identity].push(label);

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
        const tar_y = mob.position.height * spacing;

        const lerpFactor = 0.03;

        const newX = model.position.x + (tar_x - model.position.x) * lerpFactor;
        const newZ = model.position.z + (tar_z - model.position.z) * lerpFactor;
        const newY = model.position.y + (tar_y - model.position.y) * lerpFactor;

        model.position.set(newX, newY, newZ);
        if (!(identity === player_mob_identity)) {
            model.rotation.x = mob.rotation[0];
            model.rotation.y = mob.rotation[1];
            model.rotation.z = mob.rotation[2];
        }

        if (modelArr.length > 1) {
            modelArr[1].position.set(
                model.position.x,
                spacing * 0.7 + model.position.y,
                model.position.z,
            );

            const percent = Math.max(0, Math.min(100, (mob.health / mob.max_health) * 100));

            modelArr[1].health_bar.style.width = percent + '%';

            if (percent > 60) {
                modelArr[1].health_bar.style.backgroundColor = '#3CB163FF';
            } else if (percent > 30) {
                modelArr[1].health_bar.style.backgroundColor = '#ba9c38';
            } else {
                modelArr[1].health_bar.style.backgroundColor = '#bf443a';
            }
        }
    });
}