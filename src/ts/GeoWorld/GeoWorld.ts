import { AxesHelper, CameraHelper, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { IGeoWorld } from "../interfaces/IGeoWorld";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Sizes from "../Utils/Sizes";
import { Basic } from "../world/Basic";
import GeoMap from "./GeoMap";
import { mapOptions } from "../types";

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
    //注解：地图样式
    private mapStyle: mapOptions;
    //注解：相关的点击事件
    private raycaster: Raycaster;
    private mouse: Vector2;
    
    constructor(option: IGeoWorld) {
      //注解：option 是外部传进来的，有一个属性dom，并保存起来
      this.option = option;
      //注解：通过Basic封装，生成 scene、camera、renderer、controls 这4个three.js最重要的概念
      const basic = new Basic(option.dom);
      this.scene = basic.scene;
      this.camera = basic.camera;
      this.camera.position.set(50, -100, 500);
      this.renderer = basic.renderer;
      this.controls = basic.controls;
      //注解：添加地图的样式
      this.mapStyle = {
        planeColor: 0x2d9bd8,
        sideColor: 0x094869,
        lineColor: 0xbfe5f4,
        activePlaneColor: 0x94c8e3,
        activeSideColor: 0x094869,
        activeLineColor: 0xbfe5f4,
        deep: 8
      }
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
      //注解：创建地图，并将地图加入到场景之中
      const map = new GeoMap(this.mapStyle);
      map.create();
      this.scene.add(map.group);
      //注解：隐藏loading
      const loading = document.querySelector('#loading')
      loading.classList.add('out');
      //注解：添加相关的事件
      this.setEvents();
      //注解：渲染出来，每一帧都执行渲染
      this.render();
    }

    //注解：添加相关的交互事件
    setEvents(){
      //注解：初始化射线
      this.raycaster  = new Raycaster();
      this.mouse = new Vector2();
      //注解：鼠标移动记录位置
      this.renderer.domElement.addEventListener('mousemove', e => {
        const x = e.clientX / window.innerWidth * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.mouse.x = x;
        this.mouse.y = y;
      })
    }

    //注解：渲染函数
    render() {
      requestAnimationFrame(this.render.bind(this))
      this.renderer.render(this.scene, this.camera);
      this.controls && this.controls.update();
      this.raycasterEvent();
    }

    //注解：处理一下相关事件 
    raycasterEvent(){
      if(!(this.mouse.x === 0 && this.mouse.y === 0)){
        this.raycaster.setFromCamera(this.mouse, this.camera)
        //算出射线 与当场景相交的对象有那些
        const intersects = this.raycaster.intersectObjects(
          this.scene.children,
          true
        )
        if(intersects && intersects.length > 0){
          const province = intersects.find(i => i.object.name === 'province_mesh');
          console.log(province)
          if(province){
            const parent = province.object.parent;
            const parentInfo = parent.userData['properties'];
            const line = parent.children.find(i => i.name === 'province_line');
            //console.log('----------begin');
            //console.log('parentInfo:')
            //console.log(parentInfo);
            //console.log('lineInfo:');
            //console.log(line)
            //console.log('----------end')
            // @ts-ignore
            province.object.material[0].color.set(this.mapStyle.activePlaneColor)
            //province.object.material[0].color.set(0xff0000)
           // this.lastPick.object.material[1].color.set(0xff0000)
          }
        }
      }   
    }
}