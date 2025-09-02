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
uniform float uContrast;
uniform float uBrightness;

varying vec2 vUv;

void main() {

  vec3 bg = uInvert ? vec3(0.03) : vec3(0.96);
  vec2 aspect = uResolution / uResolution.xx;
  vec2 size = vec2(uResolution.x / uSize) * aspect;
  vec2 uv = floor(vUv * size) / size;
  vec2 sUv = fract(vUv * size);

  ivec2 tSize = textureSize(uTexture,0);
  vec2 tScale = vec2(1.);
  tScale.y *= float(tSize.x) / float(tSize.y);
  tScale.y *= aspect.y;
  vec2 uvImage = (uv - 0.5) * tScale + 0.5;
  vec4 image = texture(uTexture, uvImage);

  if(uvImage.x > 1. || uvImage.x < 0. || uvImage.y > 1.0 || uvImage.y < 0.) {
    if(uInvert) {
      image.rgb = bg;
    }
  }
  
  vec4 diffuse = uImage ? image : texture(tDiffuse, uv);
  diffuse.rgb = min(diffuse.rgb, vec3(1.0));
  
  diffuse.rgb = (diffuse.rgb - 0.5) * uContrast + 0.5 + uBrightness;

  vec4 trail = texture(tTrail, uv);
  // diffuse.rgb = max(diffuse.rgb, trail.rgb * 1.5);
  float gap = 10. / uShardStep;
  diffuse.rgb = min(diffuse.rgb, vec3(1. - gap));
  float l = diffuse.r * 0.2125 + diffuse.g * 0.7154 + diffuse.b * 0.0721;
  // l *= 1. - gap;
  float xOffset = (l - 1.) * 1.;
  // l *= 1. - 1. / uShardStep;
  float lEdge = floor(l * uShardStep) / uShardStep;
  lEdge -= gap;

  float shapeEdge = uInvert ? 0.3 : 0.5;
  float dotShape = step(max(shapeEdge,lEdge),distance(vec2(0.5,0.5), sUv) * 2.5);
  float squareShape = step(max(shapeEdge * 1.5,lEdge),max(abs(sUv.x - 0.5), abs(sUv.y - 0.5)) * 2.5);
  float lineShape = step(lEdge,abs(sUv.y - 0.5) * 2.);

  float speed = uInvert ?  uTime * 0.3 : uTime * 0.4;
  float offsetPerlin = cnoise(vec3(uv * 5. + vec2(0.,speed),speed)) * 0.5 + 0.2;

  // float uvX = abs(fract(sUv.x + offsetPerlin * xOffset) - 0.5 ) * 2.;
  float offsetScale = uInvert ? 1. : 1.5;
  float uvX = sUv.x + offsetPerlin * xOffset * offsetScale;
  float shard = step(lEdge,uvX);

  float perlin = cnoise(vec3(uv * uNoiseScale,uTime * 0.25));
  // perlin *= 0.5;
  // perlin += 0.5;

  float shapeMix = l + perlin * 0.3;

  float shape = mix(lineShape, dotShape, step(uEdge1,shapeMix));
  shape = mix(shape, squareShape, step(uEdge2,shapeMix));

  float trailMix = smoothstep(0.20,0.20,trail.r);
  float t = mix(shard, shape, trailMix);
  // t = dotShape;
  // color.rgb = vec3(lEdge);
  // color.rgb = vec3(uvX);

  vec3 c = mix(vec3(uInvert ? 0.15 : 0.5), uColor2, step(uEdge1,shapeMix));
  c = mix(c, uColor3, step(uEdge2,shapeMix));
  c = mix(uInvert ? uColor * 0.2 : uColor, c, trailMix);
  // c *= l;

  c = mix(bg, c, l);
  c = mix(bg, c, 1. - t);

  float alpha = min(l, offsetPerlin);
  // vec3 color = bg * (1. - alpha);
  // color += mix(c,bg, t * 2.) * alpha;


  vec3 color = uInvert ? max(c,bg) : min(c,bg);
  

  // color.rgb = trail.rgb;
  // l = 1.0;

  gl_FragColor = vec4(color,1.);

  #include <tonemapping_fragment>
	#include <colorspace_fragment>
}