import { Color } from "three"
export class GradientShader {
    private shader: any;
    private config: any = {};

  constructor(material, config) {
    this.shader = null
    this.config = Object.assign(
      {
        uColor1: 0x30b58d,
        uColor2: 0x0c2218,
        size: 15.0,
        dir: "x", // 'x ,y,z
      },
      config
    )
    this.init(material)
  }
  init(material) {
    const { uColor1, uColor2, dir, size } = this.config
    const dirMap = { x: 1.0, y: 2.0, z: 3.0 }
    material.onBeforeCompile = (shader) => {
      this.shader = shader

      shader.uniforms = {
        ...shader.uniforms,
        uColor1: { value: new Color(uColor1) }, // 419daa
        uColor2: { value: new Color(uColor2) },
        uDir: { value: dirMap[dir] },
        uSize: { value: size }, // 物体的宽度，或者高度
      }
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
                attribute float alpha;
                varying vec3 vPosition;
                varying float vAlpha;
                void main() {
                  vAlpha = alpha;
                  vPosition = position;
              `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
                varying vec3 vPosition;
                varying float vAlpha;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform float uDir;
                uniform float uSize;
              
                void main() {
              `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        /* glsl */ `
              #ifdef OPAQUE
              diffuseColor.a = 1.0;
              #endif
              
              // https://github.com/mrdoob/three.js/pull/22425
              #ifdef USE_TRANSMISSION
              diffuseColor.a *= transmissionAlpha + 0.1;
              #endif
              // vec3 gradient = mix(uColor1, uColor2, vPosition.x / 15.0); 
              vec3 gradient = vec3(0.0,0.0,0.0);
              if(uDir==1.0){
                gradient = mix(uColor1, uColor2, vPosition.x/ uSize); 
              }else if(uDir==2.0){
                gradient = mix(uColor1, uColor2, vPosition.z/ uSize); 
              }else if(uDir==3.0){
                gradient = mix(uColor1, uColor2, vPosition.y/ uSize); 
              }
              outgoingLight = outgoingLight * gradient;
              
              
              gl_FragColor = vec4( outgoingLight, diffuseColor.a  );
              `
      )
    }
    console.log(material)
  }
}
