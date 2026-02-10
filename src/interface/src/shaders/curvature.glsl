// Curvature visualization shader
// Height (z) = local scalar curvature
// Color = liquidity density (blue=low, red=high, purple=singularity)

#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;

uniform sampler2D uCurvatureTexture;
uniform sampler2D uLiquidityTexture;
uniform sampler2D uFlowTexture;

uniform float uCurvatureScale;
uniform float uLiquidityThreshold;
uniform int uVisualizationMode;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vCurvature;
varying float vLiquidity;

#define PI 3.14159265359
#define PHI 1.61803398875

float noise3D(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

float simplexNoise3D(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * simplexNoise3D(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value;
}

vec3 liquidityToColor(float liquidity, float curvature) {
    float t = clamp(liquidity, 0.0, 1.0);
    vec3 color;

    if (curvature > uLiquidityThreshold) {
        color = mix(vec3(0.5, 0.0, 0.5), vec3(0.0), curvature);
    } else if (t < 0.25) {
        color = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), t * 4.0);
    } else if (t < 0.5) {
        color = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.25) * 4.0);
    } else if (t < 0.75) {
        color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.5) * 4.0);
    } else {
        color = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.75) * 4.0);
    }

    return color;
}

vec3 thermalColor(float t) {
    t = clamp(t, 0.0, 1.0);
    return mix(
        vec3(0.0, 0.0, 1.0),
        mix(
            vec3(0.0, 1.0, 0.0),
            mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), t * 2.0 - 1.0),
            t * 2.0
        ),
        t
    );
}

vec3 phongLighting(vec3 position, vec3 normal, vec3 color, vec3 lightDir) {
    vec3 ambient = 0.1 * color;
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * color;

    vec3 viewDir = normalize(uCameraPos - position);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(0.5) * spec;

    return ambient + diffuse + specular;
}

#ifdef VERTEX_SHADER

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

void main() {
    vUv = uv;
    vNormal = normal;

    float curvature = texture2D(uCurvatureTexture, uv).r;
    vCurvature = curvature;

    vec3 displacedPosition = position + normal * curvature * uCurvatureScale;
    vPosition = displacedPosition;
    vLiquidity = texture2D(uLiquidityTexture, uv).r;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}

#endif

#ifdef FRAGMENT_SHADER

void main() {
    vec3 baseColor = liquidityToColor(vLiquidity, vCurvature);
    baseColor += fbm(vPosition * 2.0 + uTime * 0.1, 4) * 0.1;

    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    vec3 litColor = phongLighting(vPosition, vNormal, baseColor, lightDir);

    // Singularity pulse effect
    if (vCurvature > uLiquidityThreshold) {
        float pulse = sin(uTime * 10.0) * 0.5 + 0.5;
        litColor = mix(litColor, vec3(1.0, 0.0, 1.0), pulse * 0.3);
    }

    // Distance fog
    float dist = length(vPosition - uCameraPos);
    float fog = 1.0 - exp(-dist * 0.01);
    litColor = mix(litColor, vec3(0.02, 0.02, 0.05), fog);

    gl_FragColor = vec4(litColor, 1.0);
}

#endif

#ifdef GEODESIC_WIREFRAME
#ifdef FRAGMENT_SHADER

void main() {
    vec3 lineColor = vec3(1.0, 0.8, 0.0);
    float intensity = smoothstep(0.0, uLiquidityThreshold, vCurvature);
    vec3 finalColor = mix(vec3(0.1, 0.1, 0.2), lineColor, intensity);
    finalColor += vec3(0.2) * sin(uTime * 2.0 + vPosition.x * 0.1);

    gl_FragColor = vec4(finalColor, 0.8);
}

#endif
#endif
