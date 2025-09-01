uniform sampler2D tDiffuse;
uniform float uSize;
uniform float uShardStep;
uniform vec2 uResolution;
uniform vec3 uColor;

varying vec2 vUv;

void main() {

  vec2 aspect = uResolution / uResolution.xx;
  vec2 size = vec2(uResolution.x / uSize) * aspect;
  vec2 uv = floor(vUv * size) / size;
  vec2 sUv = fract(vUv * size);

  vec4 diffuse = texture(tDiffuse, uv);
  float l = diffuse.r * 0.2125 + diffuse.g * 0.7154 + diffuse.b * 0.0721;
  float lEdge = floor(l * uShardStep) / uShardStep;
  lEdge -= 1. / uShardStep;

  float uvX = abs(sUv.x - 0.5);
  float t = step(lEdge,uvX);
  // color.rgb = vec3(lEdge);
  // color.rgb = vec3(uvX);

  vec3 color = mix(uColor,vec3(1), t * 2.);

  gl_FragColor = vec4(color,l);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>
}