#include ../perlin3d.glsl;

uniform sampler2D tDiffuse;
uniform sampler2D tTrail;
uniform float uSize;
uniform float uShardStep;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uNoiseScale;
uniform float uEdge1;
uniform float uEdge2;
uniform float uTime;

varying vec2 vUv;

void main() {

  vec2 aspect = uResolution / uResolution.xx;
  vec2 size = vec2(uResolution.x / uSize) * aspect;
  vec2 uv = floor(vUv * size) / size;
  vec2 sUv = fract(vUv * size);

  vec4 diffuse = texture(tDiffuse, uv);
  vec4 trail = texture(tTrail, uv);
  diffuse.rgb = max(diffuse.rgb, trail.rgb);
  diffuse.rgb = min(diffuse.rgb, vec3(1. - 1. / uShardStep));
  float l = diffuse.r * 0.2125 + diffuse.g * 0.7154 + diffuse.b * 0.0721;
  float lEdge = floor(l * uShardStep) / uShardStep;
  lEdge -= 1. / uShardStep;

  float dotShape = step(lEdge,distance(vec2(0.5,0.5), sUv) * 1.5);
  float squareShape = step(lEdge,max(abs(sUv.x - 0.5), abs(sUv.y - 0.5)) * 1.5);
  float lineShape = step(0.1,abs(sUv.y - 0.5));

  float uvX = abs(sUv.x - 0.5);
  float t = step(lEdge,uvX);

  float perlin = cnoise(vec3(uv * uNoiseScale,uTime * 0.5)) * 0.5 + 0.5;

  float shape = mix(lineShape, dotShape, step(uEdge1,perlin));
  shape = mix(shape, squareShape, step(uEdge2,perlin));

  float trailMix = smoothstep(0.2,0.25,trail.r);
  t = mix(t, shape, trailMix);
  // t = dotShape;
  // color.rgb = vec3(lEdge);
  // color.rgb = vec3(uvX);

  vec3 c = mix(vec3(0.2), uColor2, step(uEdge1,perlin));
  c = mix(c, uColor3, step(uEdge2,perlin));
  c = mix(uColor, c, trailMix);

  vec3 color = mix(c,vec3(1), t * 2.);


  // color.rgb = trail.rgb;
  // l = 1.0;

  gl_FragColor = vec4(color,l);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>
}