/**
 * GLSL ES 1.00 so the same source runs on a WebGL1 fallback context.
 * Keep uniform names in sync with `scroll-shader.ts`.
 */

export const VERTEX = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

/**
 * A slow fbm field whose warp and palette are driven by scroll progress. It is
 * intentionally low-contrast: this sits behind text, so it has to stay quiet at
 * every scroll position rather than look impressive in isolation.
 */
export const FRAGMENT = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Correct for aspect ratio so the field is not stretched on wide viewports.
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (vUv - 0.5) * aspect * 2.2;

    float drift = uTime * 0.04;
    vec2 warp = vec2(fbm(p + drift), fbm(p.yx - drift));
    float field = fbm(p * 1.4 + warp * 0.8 + vec2(0.0, uProgress * 1.6));

    float mixed = smoothstep(-0.55, 0.55, field + (uProgress - 0.5) * 0.5);
    vec3 color = mix(uColorA, uColorB, mixed);

    // Vignette keeps the edges from competing with the page chrome.
    float vignette = smoothstep(1.25, 0.25, length(vUv - 0.5) * 1.6);

    gl_FragColor = vec4(color, vignette * uIntensity);
  }
`;
