import { AxesHelper, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { IGeoWorld } from "../interfaces/IGeoWorld";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Sizes from "../Utils/Sizes";
import { Basic } from "../world/Basic";
import GeoMap from "./GeoMap";

export default class GeoWorld {
    //注解：option 是外部传进来的，有一个属性dom，并保存起来
    private option: IGeoWorld;
    //注解：通过Basic封装，生成 scene、camera、renderer、controls 这4个three.js最重要的概念
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer
    private controls: OrbitControls;
    //注解：尺寸监听器
    private sizes: Sizes;
    //注解：相关的点击事件
    private mouse: Vector2;
    private raycaster: Raycaster;
    
    constructor(option: IGeoWorld) {
      //注解：option 是外部传进来的，有一个属性dom，并保存起来
      this.option = option;
      //注解：通过Basic封装，生成 scene、camera、renderer、controls 这4个three.js最重要的概念
      const basic = new Basic(option.dom);
      this.scene = basic.scene;
      this.camera = basic.camera;
      this.renderer = basic.renderer;
      this.controls = basic.controls;
      //注解：加上辅助线，试一下（红色X轴，绿色Y轴，蓝色Z轴）
      const axesHelper = new AxesHelper(200);
      this.scene.add(axesHelper); 
      //注解：监听可视范围的尺寸
      this.sizes = new Sizes({ dom: option.dom })
      this.sizes.$on('resize', () => {
        //注解：第1步，渲染器改变下长度、宽度，这样就不会被遮挡，会充满整个父容器
        this.renderer.setSize(Number(this.sizes.viewport.width), Number(this.sizes.viewport.height));
        //注解：第2步，相机重新设置下长宽比, 否则成相会被压缩或者拉长，就会很难看
        this.camera.aspect = Number(this.sizes.viewport.width) / Number(this.sizes.viewport.height);
        this.camera.updateProjectionMatrix();
      })
      this.createMap();
    }

    createMap(){
      const map = new GeoMap();
      map.create();
    }
}