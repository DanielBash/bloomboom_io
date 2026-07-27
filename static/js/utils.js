// PURPOSE:
// Provide game utils for other modules.

import * as STATE from "./state.js";
import * as THREE from 'three';
import * as SHADERS from "./shaders.js";

export function create_mesh(geometry, shapeColor, outlineColor, outlineThickness = STATE.settings.graphical.border_width) {
    const mainMat = new THREE.MeshToonMaterial({
        color: shapeColor,
        gradientMap: STATE.state.gradientMap
    });
    const mainMesh = new THREE.Mesh(geometry, mainMat);
    mainMesh.castShadow = true;

    const outlineMat = new THREE.ShaderMaterial({
        uniforms: {
            offset: { value: outlineThickness },
            outlineColor: { value: new THREE.Color(outlineColor) },
            map: { value: null },
            hasMap: { value: 0.0 }
        },
        vertexShader: SHADERS.shader_vertex_border,
        fragmentShader: SHADERS.shader_fragment_border,
        side: THREE.BackSide
    });
    const outlineMesh = new THREE.Mesh(geometry, outlineMat);

    const group = new THREE.Group();
    group.add(outlineMesh);
    group.add(mainMesh);
    return group;
}

export function apply_toon_and_outlines(object, outlineColor, outlineThickness = STATE.settings.graphical.border_width) {
    const meshes = [];
    object.traverse((child) => {
        if (child.isMesh) {
            meshes.push(child);
        }
    });

    meshes.forEach((child) => {
        const oldMat = child.material;

        const matOptions = {
            map: oldMat.map || null,
            color: oldMat.color ? oldMat.color.clone() : new THREE.Color(0xffffff),
            normalMap: oldMat.normalMap || null,
            transparent: oldMat.transparent || false,
            alphaTest: oldMat.alphaTest || 0,
            side: oldMat.side || THREE.FrontSide
        };

        if (STATE.state && STATE.state.gradientMap) {
            matOptions.gradientMap = STATE.state.gradientMap;
        }

        const toonMat = new THREE.MeshToonMaterial(matOptions);
        child.material = toonMat;
        child.castShadow = true;

        child.geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        child.geometry.boundingBox.getSize(size);

        const minDim = Math.min(size.x, size.y, size.z);
        const maxDim = Math.max(size.x, size.y, size.z);

        const isPane = maxDim > 0 && (minDim / maxDim < 0.01);

        if (!isPane) {
            const outlineMat = new THREE.ShaderMaterial({
                uniforms: {
                    offset: { value: outlineThickness },
                    outlineColor: { value: new THREE.Color(outlineColor) },
                    map: { value: oldMat.map || null },
                    hasMap: { value: oldMat.map ? 1.0 : 0.0 }
                },
                vertexShader: SHADERS.shader_vertex_border,
                fragmentShader: SHADERS.shader_fragment_border,
                side: THREE.BackSide
            });

            const outlineMesh = new THREE.Mesh(child.geometry, outlineMat);
            outlineMesh.castShadow = false;
            outlineMesh.receiveShadow = false;

            child.add(outlineMesh);
        }
    });

    return object;
}

export function play_animation(model, actionName, loopOnce = false) {
    if (!model || !model.userData.actions || !model.userData.actions[actionName]) {
        console.warn("[ERROR] Couldn't play animation " + actionName + ".");
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