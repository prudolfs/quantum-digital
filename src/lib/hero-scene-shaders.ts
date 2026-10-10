export const fullscreenVertex = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
`

export const textFragment = `
  uniform sampler2D uText;
  uniform sampler2D uVelocity;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uInteraction;
  varying vec2 vUv;
  void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    float focus = 1. - smoothstep(.035, .18, length((vUv-uPointer)*vec2(uAspect,1.)));
    vec2 displacement = clamp(velocity*.0006, vec2(-.006), vec2(.006));
    gl_FragColor = texture2D(uText, vUv-displacement*focus*uInteraction);
    #include <colorspace_fragment>
  }
`

export const overlayFragment = `
  uniform sampler2D uDye;
  uniform vec3 uGold;
  uniform vec3 uAmber;
  uniform vec3 uCore;
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    vec3 dye = texture2D(uDye, vUv).rgb;
    float density = length(dye);
    float alpha = min(.38, density*.18)*uGlow;
    vec3 color = mix(uAmber,uGold,smoothstep(0.,.8,density));
    color = mix(color,uCore,smoothstep(1.,4.,density)*.65);
    gl_FragColor = vec4(color,alpha);
    #include <colorspace_fragment>
  }
`

export const shapeVertex = `
  attribute vec3 aNext;
  attribute float aSeed;
  uniform float uMorph;
  uniform float uTime;
  uniform float uIdle;
  uniform float uSize;
  uniform vec2 uSizeRange;
  uniform float uDpr;
  uniform float uInteraction;
  uniform vec2 uCanvas;
  uniform vec4 uRect;
  uniform sampler2D uVelocity;
  varying float vLight;
  void main() {
    float spread = sin(uMorph*3.14159265);
    vec3 p = mix(position,aNext,smoothstep(0.,1.,uMorph));
    p += spread*.22*vec3(sin(aSeed*71.+uTime),cos(aSeed*93.+uTime*.7),sin(aSeed*41.));
    float angle = uTime*.55*uIdle;
    p.xz = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xz;
    p.y += sin(uTime*.7)*.035*uIdle;
    vec2 pixel = uRect.xy + p.xy*uRect.zw;
    vec2 uv = pixel/uCanvas;
    vec2 flow = texture2D(uVelocity,uv).xy;
    uv += clamp(flow*.0008,vec2(-.045),vec2(.045))*uInteraction;
    gl_Position = vec4(uv*2.-1., -p.z*.15,1.);
    float baseSize = clamp(uSize*uDpr*(1.+p.z*.2),1.,28.);
    gl_PointSize = baseSize * mix(uSizeRange.x,uSizeRange.y,aSeed);
    vLight = clamp(.5+p.z*.25+aSeed*.3,0.,1.);
  }
`

export const shapeFragment = `
  uniform vec3 uPrimary;
  uniform vec3 uMid;
  uniform vec3 uSecondary;
  uniform float uOpacity;
  uniform float uGlow;
  varying float vLight;
  void main() {
    vec2 disc = (gl_PointCoord-.5)*2.;
    float r = length(disc);
    if(r>1.) discard;
    float blend = vLight*.75*smoothstep(.3,.65,vLight);
    vec3 color = mix(uPrimary,uMid,blend);
    color = mix(color,uSecondary,pow(1.-r,3.)*.65);
    gl_FragColor=vec4(color*(1.25+uGlow*.6),(1.-smoothstep(.45,1.,r))*uOpacity);
    #include <colorspace_fragment>
  }
`

export const cursorVertex = `
  attribute float aBorn;
  attribute float aSeed;
  uniform float uTime;
  uniform float uDpr;
  uniform vec2 uCanvas;
  uniform sampler2D uVelocity;
  varying float vLife;
  varying float vSeed;
  void main() {
    float age = uTime-aBorn;
    vLife = clamp(1.-age/1.25,0.,1.);
    vSeed = aSeed;
    vec2 uv=position.xy;
    vec2 flow=texture2D(uVelocity,uv).xy;
    uv += clamp(flow*.001,vec2(-.07),vec2(.07))*age;
    uv += vec2(sin(aSeed*60.+age*3.),cos(aSeed*90.+age*2.))*age*12./uCanvas;
    gl_Position=vec4(uv*2.-1.,0.,1.);
    gl_PointSize=(2.+aSeed*3.)*uDpr*vLife;
  }
`
export const cursorFragment = `
  uniform vec3 uGold;
  uniform vec3 uCore;
  uniform float uGlow;
  varying float vLife;
  varying float vSeed;
  void main() {
    float r=length(gl_PointCoord-.5)*2.;
    if(r>1. || vLife<=0.) discard;
    gl_FragColor=vec4(mix(uGold,uCore,vSeed)*(.8+uGlow*.3),(1.-r)*vLife*.85);
    #include <colorspace_fragment>
  }
`
