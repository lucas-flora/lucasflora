export const chromaticAberrationChunk = `
vec3 applyChromaticAberration(sampler2D screenTex, vec2 uv, float strength,
                              float blackLevel, float whiteLevel,
                              vec2 redShift, vec2 greenShift, vec2 blueShift) {
  float map = 1.0 - bubbleMapWorld(
          vWorldPos,
          mix(0.01, 0.3, cornerRoundness),  // corner-radius
          bubbleSize,                       // bubble size
          edgeTransition,                   // edge falloff
          screenWidth,                      // quad width in world units
          screenHeight                      // quad height in world units
      );
  float norm = clamp((map - blackLevel)/(whiteLevel - blackLevel),0.0,1.0);
  float eff = norm * strength * 0.01;

  vec3 c;
  c.r = texture2D(screenTex, uv + redShift * eff).r;
  c.g = texture2D(screenTex, uv + greenShift * eff).g;
  c.b = texture2D(screenTex, uv + blueShift * eff).b;
  return c;
}
`;

export const reflectionChunk = `
vec3 applyReflection(samplerCube envMap, vec3 normal, vec3 viewDir,
                     float strength, float clampVal, float fresnelPow) {
  vec3 refDir = reflect(-viewDir, normalize(normal));
  vec3 env = textureCube(envMap, refDir).rgb;
  float fres = fresnelTerm(normal, viewDir, fresnelPow);
  // Compute inverted bubble map for reflection falloff
  float cornerRadius = mix(0.01, 0.3, cornerRoundness);
  float bubble = bubbleMapWorld(vWorldPos, cornerRadius,
                              bubbleSize, edgeTransition,
                              screenWidth, screenHeight);
  float invBubble = 1.0 - bubble;
  float amount = max(invBubble, clampVal) 
                * strength * (0.5 + 0.5 * fres);
  return env * amount;
}
`;