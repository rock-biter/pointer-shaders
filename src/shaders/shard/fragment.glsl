#include ../rand.glsl;
#include ../perlin3d.glsl;

uniform sampler2D tDiffuse;
uniform sampler2D uTexture;
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
uniform bool uInvert;
uniform bool uImage;

varying vec2 vUv;

void main() {

  vec3 bg = uInvert ? vec3(0.03) : vec3(0.96);
  vec2 aspect = uResolution / uResolution.xx;
  vec2 size = vec2(uResolution.x / uSize) * aspect;
  vec2 uv = floor(vUv * size) / size;
  vec2 sUv = fract(vUv * size);

  vec4 diffuse = uImage ? texture(uTexture, uv) : texture(tDiffuse, uv);
  diffuse.rgb = min(diffuse.rgb, vec3(1.0));
  vec4 trail = texture(tTrail, uv);
  diffuse.rgb = max(diffuse.rgb, trail.rgb * 1.5);
  diffuse.rgb = min(diffuse.rgb, vec3(1. - 1. / uShardStep));
  float l = diffuse.r * 0.2125 + diffuse.g * 0.7154 + diffuse.b * 0.0721;
  float gap = 10. / uShardStep;
  // l *= 1. - gap;
  float xOffset = (l - 1.) * 1.;
  // l *= 1. - 1. / uShardStep;
  float lEdge = floor(l * uShardStep) / uShardStep;
  lEdge -= gap;

  float dotShape = step(lEdge,distance(vec2(0.5,0.5), sUv) * 3.);
  float squareShape = step(lEdge,max(abs(sUv.x - 0.5), abs(sUv.y - 0.5)) * 3.);
  float lineShape = step(0.1,abs(sUv.y - 0.5));

  float offsetPerlin = cnoise(vec3(uv * 5. + vec2(0.,uTime * 0.25),uTime * 0.3)) * 0.5 + 0.3;

  // float uvX = abs(fract(sUv.x + offsetPerlin * xOffset) - 0.5 ) * 2.;
  float uvX = sUv.x + offsetPerlin * xOffset;
  float shard = step(lEdge,uvX);

  float perlin = cnoise(vec3(uv * uNoiseScale,uTime * 0.25));
  perlin *= 0.5;
  perlin += 0.5;

  float shape = mix(lineShape, dotShape, step(uEdge1,perlin));
  shape = mix(shape, squareShape, step(uEdge2,perlin));

  float trailMix = smoothstep(0.10,0.10,trail.r);
  float t = mix(shard, shape, trailMix);
  // t = dotShape;
  // color.rgb = vec3(lEdge);
  // color.rgb = vec3(uvX);

  vec3 c = mix(vec3(uInvert ? 0.15 : 0.5), uColor2, step(uEdge1,perlin));
  c = mix(c, uColor3, step(uEdge2,perlin));
  c = mix(uInvert ? uColor * 0.2 : uColor, c, trailMix);
  // c *= l;

  c = mix(bg, c, l);
  c = mix(bg, c, 1. - t);

  float alpha = min(l, offsetPerlin);
  vec3 color = bg * (1. - alpha);
  color += mix(c,bg, t * 2.) * alpha;

  color = c;
  

  // color.rgb = trail.rgb;
  // l = 1.0;

  gl_FragColor = vec4(color,1.);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>
}