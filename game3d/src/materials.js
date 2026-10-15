// Shader materials: layered refractive glass, tea/water that stays inside its vessel, pour streams, gas flame, steam.
import * as THREE from 'three';

const DISPLAY = /* glsl */ `
vec3 acesDisplay(vec3 x){ x*=0.8; x=clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); return pow(x,vec3(1./2.2)); }
`;

/** The one cube/frame state every glass shader shares. */
export function makeShared() {
  return {
    tFrame: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    tEnv: { value: null },
    uTime: { value: 0 },
  };
}

/** Pass 2: front faces of glass. Samples the already-rendered scene with a refraction offset, tints the edges, adds reflections. */
export function glassFront(shared, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uTint: { value: new THREE.Color(opts.tint ?? 0xbfe6d6) },
      uRefr: { value: opts.refr ?? 0.05 },
      uEnvI: { value: opts.env ?? 2.2 },
      uEdgeDark: { value: opts.edgeDark ?? 0.2 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN; varying vec3 vVN;
      void main(){
        vec4 w = modelMatrix*vec4(position,1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
        vVN = normalize(normalMatrix*normal);
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tFrame; uniform vec2 uRes; uniform samplerCube tEnv;
      uniform vec3 uTint; uniform float uRefr; uniform float uEnvI; uniform float uEdgeDark;
      varying vec3 vW; varying vec3 vN; varying vec3 vVN;
      ${DISPLAY}
      void main(){
        vec3 N = normalize(vN); vec3 vn = normalize(vVN);
        vec3 V = normalize(cameraPosition - vW);
        if(!gl_FrontFacing){ N=-N; vn=-vn; }
        float ndv = clamp(dot(N,V),0.,1.);
        float edge = 1.-ndv;
        vec2 uv = gl_FragCoord.xy/uRes;
        vec2 off = vn.xy*uRefr*(0.18+edge*edge*1.8);
        vec3 bg;
        bg.r = texture2D(tFrame, clamp(uv+off*0.94,0.002,0.998)).r;
        bg.g = texture2D(tFrame, clamp(uv+off,0.002,0.998)).g;
        bg.b = texture2D(tFrame, clamp(uv+off*1.06,0.002,0.998)).b;
        float F = 0.045+0.955*pow(edge,4.5);
        vec3 R = reflect(-V,N);
        vec3 env = textureCube(tEnv, R).rgb;
        vec3 absorb = mix(vec3(1.), uTint, pow(edge,1.4)*0.95);
        vec3 col = bg*absorb*(1.-uEdgeDark*pow(edge,2.2)) * (1.-F*0.55);
        col += acesDisplay(env*F*uEnvI);
        col += vec3(0.82,1.0,0.92)*pow(edge,7.)*0.22;
        gl_FragColor = vec4(col,1.);
      }`,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
    toneMapped: false,
  });
}

/** Pass 1: back faces of glass; a cheap far wall so the glass has body even in the scene pass. */
export function glassBack(shared, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uTint: { value: new THREE.Color(opts.tint ?? 0xbfe6d6) }, uEnvI: { value: (opts.env ?? 2.2) * 0.55 } },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN;
      void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */ `
      uniform samplerCube tEnv; uniform vec3 uTint; uniform float uEnvI;
      varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 N = -normalize(vN); vec3 V = normalize(cameraPosition-vW);
        float ndv = clamp(dot(N,V),0.,1.); float edge = 1.-ndv;
        float F = 0.045+0.955*pow(edge,4.5);
        vec3 env = textureCube(tEnv, reflect(-V,N)).rgb;
        vec3 rgb = env*F*uEnvI*0.5 + uTint*0.05*edge;
        float a = 0.03+edge*0.2;
        gl_FragColor = vec4(rgb,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    transparent: true,
    premultipliedAlpha: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
  });
}

/** Liquid volume. Clipped by a horizontal world plane so the surface stays level when the vessel tilts. */
export function makeLiquidUniforms(shared) {
  return {
    ...shared,
    uLevel: { value: -1e3 },
    uCore: { value: new THREE.Color(0x4a1a05) },
    uEdge: { value: new THREE.Color(0xc4741a) },
    uSurf: { value: new THREE.Color(0xd98a2a) },
    uOpacity: { value: 0.9 },
    uBoil: { value: 0 },
    uBrew: { value: 0 },
  };
}

const LIQ_VERT = /* glsl */ `
  varying vec3 vW; varying vec3 vN;
  void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`;

const LIQ_FRAG = (back) => /* glsl */ `
  uniform samplerCube tEnv; uniform float uTime; uniform float uLevel; uniform vec3 uCore; uniform vec3 uEdge; uniform vec3 uSurf;
  uniform float uOpacity; uniform float uBoil; uniform float uBrew;
  varying vec3 vW; varying vec3 vN;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
  void main(){
    if(vW.y > uLevel) discard;
    vec3 V = normalize(cameraPosition - vW);
    ${back ? `
    // we are looking through the cut: shade the level surface where the view ray crosses the plane
    vec3 dir = -V;
    float t = (uLevel - cameraPosition.y)/min(dir.y,-0.0001);
    vec3 P = cameraPosition + dir*t;
    vec2 q = P.xz*1.7;
    float rip = (noise(q*1.3+uTime*1.4)-.5)*uBoil*0.55 + (noise(q*3.1-uTime*2.3)-.5)*uBoil*0.3;
    vec3 Ns = normalize(vec3(rip, 1., (noise(q*1.1-uTime)-.5)*uBoil*0.45));
    float ndv = clamp(dot(Ns,V),0.,1.);
    float F = 0.03+0.97*pow(1.-ndv,4.);
    vec3 env = textureCube(tEnv, reflect(-V,Ns)).rgb;
    float rim = pow(1.-clamp(dot(normalize(vN)*-1.,V),0.,1.),2.);
    vec3 base = mix(uSurf, uCore*1.6, 0.25);
    vec3 col = base*(0.85+0.25*rim) + env*F*0.85;
    col += vec3(1.,0.9,0.75)*uBoil*pow(noise(q*5.+uTime*3.),6.)*0.5;
    gl_FragColor = vec4(col, min(1., uOpacity+0.05));
    ` : `
    vec3 N = normalize(vN);
    float ndv = clamp(dot(N,V),0.,1.);
    float thick = pow(ndv,0.65);
    vec3 col = mix(uEdge, uCore, thick);
    col *= 0.78+0.3*smoothstep(0.,1.,(vW.y - (uLevel-9.))/9.);
    col += uEdge*pow(1.-ndv,3.)*0.35;
    float vein = noise(vec2(atan(N.z,N.x)*3.+uTime*0.4, vW.y*0.6))*uBoil*0.18;
    col *= 1.+vein;
    gl_FragColor = vec4(col, uOpacity);
    `}
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function liquidMaterials(uniforms) {
  const common = { uniforms, vertexShader: LIQ_VERT, transparent: true, depthWrite: true };
  const front = new THREE.ShaderMaterial({ ...common, fragmentShader: LIQ_FRAG(false), side: THREE.FrontSide });
  const back = new THREE.ShaderMaterial({ ...common, fragmentShader: LIQ_FRAG(true), side: THREE.BackSide });
  return { front, back };
}

/** A falling stream (water from the tap, tea from the spout). uv.y runs along the stream. */
export function streamMaterial(shared, color) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0.85 }, uFlow: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN; varying vec2 vUv;
      void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */ `
      uniform samplerCube tEnv; uniform vec3 uColor; uniform float uAlpha; uniform float uFlow; uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying vec2 vUv;
      void main(){
        vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
        float ndv=clamp(abs(dot(N,V)),0.,1.);
        float F=0.04+0.96*pow(1.-ndv,3.);
        vec3 env=textureCube(tEnv,reflect(-V,N)).rgb;
        float bands = 0.5+0.5*sin(vUv.y*38.-uFlow*16.+sin(vUv.y*9.+uFlow*5.)*2.);
        vec3 col = uColor*(0.55+0.55*bands) + env*F*1.2;
        float a = uAlpha*(0.55+0.45*(1.-ndv*0.6));
        gl_FragColor = vec4(col,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

/** One gas jet: a tapered flame that flickers, blue at the root and warm at the tip. */
export function flameMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 }, uSeed: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vH; uniform float uTime; uniform float uPower; uniform float uSeed;
      void main(){
        vUv=uv; vH=position.y;
        vec3 p=position;
        float h=clamp(p.y/1.4,0.,1.);
        float fl=sin(uTime*18.+uSeed*6.+h*5.)*0.5+sin(uTime*29.+uSeed*3.)*0.5;
        p.x+=fl*0.07*h; p.z+=cos(uTime*23.+uSeed*5.)*0.06*h;
        p.y*=uPower*(0.88+0.12*sin(uTime*21.+uSeed*9.));
        p.xz*=uPower;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying float vH; uniform float uPower;
      void main(){
        float h=clamp(vH/1.4,0.,1.);
        vec3 blue=vec3(0.18,0.38,1.0), cyan=vec3(0.55,0.85,1.0), warm=vec3(1.0,0.62,0.22);
        vec3 col=mix(blue,cyan,smoothstep(0.,0.3,h));
        col=mix(col,warm,smoothstep(0.62,1.,h));
        float a=(1.-smoothstep(0.55,1.,h))*smoothstep(0.,0.06,h)*0.95;
        gl_FragColor=vec4(col*1.7,a*uPower);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

/** Soft puffs for steam, splashes and glows: one shader for a whole Points cloud. */
export function puffMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: { tMap: { value: map }, uK: { value: 500 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aAlpha; attribute vec3 aTint;
      varying float vA; varying vec3 vT; uniform float uK;
      void main(){
        vA=aAlpha; vT=aTint;
        vec4 mv=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=aSize*uK/max(-mv.z,1.);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tMap; varying float vA; varying vec3 vT;
      void main(){
        vec4 t=texture2D(tMap,gl_PointCoord);
        gl_FragColor=vec4(vT,t.a*vA);
      }`,
    transparent: true, depthWrite: false,
  });
}
