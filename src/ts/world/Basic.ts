/*
 * 创建 threejs 四大天王
 * 场景、相机、渲染器、控制器
 */

import * as THREE from 'three';
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export class Basic {
  public dom: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public css3DRenderer: CSS3DRenderer;
  public controls: OrbitControls;
  
  constructor(dom: HTMLElement) {
    this.dom = dom;
    this.initScenes();
    this.setControls();
  }

  initScenes() {
    //第1步，Scene，初始化场景
    this.scene = new THREE.Scene();
    //第2步，Camera，初始化照相机，并摆好照相机的位置，之所以z轴变成-250，就是最先看到中国
    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.set(-450, 180, -600);
    //第3步，设置好渲染器
    this.renderer = new THREE.WebGLRenderer({
      //透明，设置整个canvas是否透明，true的话，会显示大背景颜色，false的话，会覆盖大背景颜色
      alpha: true,
      //抗锯齿，true的话，放大缩小后，线条更加圆润
      antialias: true, 
    });
    //设置屏幕像素比
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.dom.appendChild(this.renderer.domElement);
    //第4步，设置css3d渲染器
    this.css3DRenderer = new CSS3DRenderer();
    this.css3DRenderer.setSize(window.innerWidth, window.innerHeight);
    this.css3DRenderer.domElement.style.position = 'absolute';
    this.css3DRenderer.domElement.style.top = '0';
    this.css3DRenderer.domElement.style.zIndex = '100';
    document.body.appendChild(this.css3DRenderer.domElement);
  }

  //设置轨道控制器，主要目的是实现放大缩小、拖拽、点击， 原理是控制照相机的运行轨迹
  setControls() {
    //注解：初始化轨道控制器，由于存在2个渲染器，这时候发现，css3DRenderer 这个反而是必须的，而renderer这个反而不是必须的
    //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.css3DRenderer.domElement);
    //注解：这个是用来干什么的，暂时不是很清楚
    this.controls.autoRotateSpeed = 3
    //使动画循环使用时阻尼或自转，意思是否有惯性，设置为true，拖拽有惯性，更加丝滑
    this.controls.enableDamping = true;
    //动态阻尼系数 就是鼠标拖拽旋转灵敏度（设置为0.05就可以，具体效果也不是很清楚）
    this.controls.dampingFactor = 0.05;
    //是否可以缩放
    this.controls.enableZoom = true;
    //设置相机距离原点的最近距离（如果想要放大，这个值可以缩小）
    this.controls.minDistance = 100;
    //设置相机距离原点的最远距离（如果想要缩小，这个值可以放大）
    this.controls.maxDistance = 300;
    //是否开启右键拖拽（设置为true时，动画效果不好控制，所以还是不要右键操作了）
    this.controls.enablePan = false;
  }
}