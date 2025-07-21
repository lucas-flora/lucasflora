export const bubbleMapChunk = `
float bubbleMapWorld(vec2 worldPos, float cornerRadius, float size, float transition, float screenW, float screenH) {
  vec2 pos = worldPos;
  vec2 rectSize = vec2(screenW, screenH) * 0.5 * size;
  vec2 q = abs(pos) - rectSize + cornerRadius;
  float dist = length(max(q,0.0)) + min(max(q.x,q.y),0.0) - cornerRadius;
  return 1.0 - smoothstep(-transition, transition, dist);
}
`;

export const fresnelChunk = `
float fresnelTerm(vec3 normal, vec3 viewDir, float power) {
  return pow(1.0 - max(dot(normal, viewDir), 0.0), power);
}
`;

export const blendModesChunk = `
// simple additive
vec3 blendAdd(vec3 base, vec3 top, float alpha) {
  return base + top * alpha;
}
// screen blend (brightens)
vec3 blendScreen(vec3 base, vec3 top) {
  return 1.0 - (1.0 - base) * (1.0 - top);
}
// multiply blend (darkens)
vec3 blendMultiply(vec3 base, vec3 top) {
  return base * top;
}
// you can add more as needed…
`;