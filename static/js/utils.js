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
            outlineColor: { value: new THREE.Color(outlineColor) }
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
