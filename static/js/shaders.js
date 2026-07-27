// PURPOSE:
// Initialize shaders.

export const shader_vertex_border = `
uniform float offset;
varying vec2 vUv;
void main() {
    vUv = uv;
    
    // Transform vertex and normal to view space
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 viewNormal = normalize(normalMatrix * normal);
    
    // Extrude outward in view-space. 
    // Multiply by -mvPosition.z to keep thickness consistent in screen-space.
    // Multiply by 0.1 so you can use larger numbers like 1.0 or 2.0 for offset without exploding.
    float extrude = offset * 0.1 * (-mvPosition.z);
    mvPosition.xyz += viewNormal * extrude;
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const shader_fragment_border = `
uniform sampler2D map;
uniform float hasMap;
uniform vec3 outlineColor;
varying vec2 vUv;
void main() {
    // Discard transparent pixels so textures with cutouts don't have black borders
    if (hasMap > 0.5) {
        vec4 texColor = texture2D(map, vUv);
        if (texColor.a < 0.5) discard;
    }
    gl_FragColor = vec4(outlineColor, 1.0);
}
`;