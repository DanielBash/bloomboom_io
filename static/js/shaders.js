// PURPOSE:
// Initialize shaders.

export const shader_vertex_border = `
uniform float offset;
void main() {
    vec3 newPosition = position * (1.0 + offset);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const shader_fragment_border = `
uniform vec3 outlineColor;
void main() {
    gl_FragColor = vec4(outlineColor, 1.0);
}
`;