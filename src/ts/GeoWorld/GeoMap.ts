import THREE, { AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, Color, DoubleSide, ExtrudeGeometry, FrontSide, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, Shape, sRGBEncoding, Vector3 } from 'three';
import ChinaGeoJson from '../../json/ChinaGeoJson.json';
import * as d3 from'd3-geo'; 
import { mapOptions } from '../types';
import { GradientShader } from './GradientShader';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

export default class GeoMap {
  public group: Group;
  private mapStyle: mapOptions;
  private projection: (array: number[]) => number[];

  constructor(mapStyleOption: mapOptions){
    this.mapStyle = mapStyleOption;
    this.group = new Group();
    this.group.name = 'map_group';
    //经纬度投影转化函数
    this.projection = d3.geoMercator().center([104.0, 37.5]).translate([0, 0]);
  }

  create(){
    const hasData = ChinaGeoJson && ChinaGeoJson.features && ChinaGeoJson.features.length > 0;
    if(!hasData){
      return;
    }
    //遍历所有的省
    ChinaGeoJson.features.forEach(provinceObject => {
      //每个省创建一个组合
      const provinceGroup = new Group();
      provinceGroup.name = 'province_group';
      //所有的圈
      const allCircles = provinceObject.geometry.coordinates;
      //再遍历每一个圈
      allCircles.forEach(oneCircle => {
        //准备生成一个不规则的平面
        const shape = new Shape();
        //准备画出一条不规则的线
        const vertices = [];
        //每个圈的所有的点，都遍历一次，每个点都是包含2个数字的数组
        for (let i = 0; i < oneCircle.length; i++) {
          const [x, y] = this.projection(oneCircle[i]);
          //这里存在着一个很严重的问题，那就是geojson数据可能本身有问题，导致投影了之后，出现 NAN 的值，需要具体查下是什么原因？？？？
          if(!isNaN(x) && !isNaN(y)){
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y)
            vertices.push(x, -y, this.mapStyle.deep);
          }
        }
        //生成线条
        const lineGeometry = new BufferGeometry();
        lineGeometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
        const lineMaterial = new LineBasicMaterial({
          color: new Color(this.mapStyle.lineColor),
        })
        const line = new Line(lineGeometry, lineMaterial);
        line.name = 'province_line'
        //由shape平面挤压出一定的厚度物体
        const extrudeSettings = {
          depth: this.mapStyle.deep,
          bevelEnabled: false,
        };
        const geometry = new ExtrudeGeometry(
          shape,
          extrudeSettings
        )
        const material = new MeshBasicMaterial({
          color: new Color(this.mapStyle.planeColor),
          transparent: true,
          opacity: 0.8,
        })
        material.needsUpdate = true;
        const sideMaterial = new MeshBasicMaterial({
          color: new Color(this.mapStyle.sideColor),
          transparent: true,
          opacity: 0.5,
        })
        sideMaterial.needsUpdate = true;
        const mesh = new Mesh(geometry, [material, sideMaterial]);
        mesh.name = 'province_mesh'
        //最后加入各个组合中
        provinceGroup.add(line);
        provinceGroup.add(mesh);
        provinceGroup.userData['properties'] = provinceObject.properties;
        this.group.add(provinceGroup);
      });
    });
    //创建光柱
    this.createBar([110.109828, 25.047893]);
    this.createBar([120.109828, 29.047893]);
    this.createBar([104.109828, 28.047893]);
  }




  //创建光柱
  createBar(array: number[]){
    //光柱的高度
    const barHeight = 20;
    //光柱长方体的材质
    const material = new MeshBasicMaterial({
      color: 0x77fbf5,
      transparent: true,
      opacity: 0.7,
      depthTest: false,
      fog: false,
    })
    //创建光柱立方体（这时候，光柱被XOY平面平分成2部分）
    const box = new BoxGeometry(1, 1, barHeight);
    //让光柱的底部贴近XOY平面（往Z轴位移半截柱体的距离）
    box.translate(0, 0, barHeight / 2);
    //创建3D物体
    const areaBar = new Mesh(box, material);
    areaBar.name = 'province_bar';
    areaBar.userData['properties'] = {
      name: '中国',
      value: '200'
    };
    const [x, y] = this.projection(array);
    areaBar.position.set(x, -y, this.mapStyle.deep + 0.3);

    const hg = this.createHUIGUANG(barHeight, 0xfffef4)
    areaBar.add(...hg);
    this.group.add(areaBar);
    
    this.createQuan(new Vector3(x, -y, this.mapStyle.deep + 0.4));

    const label = this.createLabel();
    label.scale.set(0.1, 0.1, 0.1);
    label.rotation.x = Math.PI/2;
    label.position.set(x, -y, this.mapStyle.deep + 0.3 + barHeight);
    this.group.add(label)
  }

  createHUIGUANG(h, color) {
    const geometry = new PlaneGeometry(6, h)
    geometry.translate(0, h / 2, 0)
    const texture = this.mapStyle.huiguangTexture;
    //texture.colorSpace = "srgb"
    texture.encoding = sRGBEncoding;
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    const material = new MeshBasicMaterial({
      color: color,
      map: texture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = 10
    mesh.rotateX(Math.PI / 2)
    const mesh2 = mesh.clone()
    const mesh3 = mesh.clone()
    mesh2.rotateY((Math.PI / 180) * 60)
    mesh3.rotateY((Math.PI / 180) * 120)
    return [mesh, mesh2, mesh3]
  }

  createQuan(position) {
    const guangquan1 = this.mapStyle.guangquan01
    const guangquan2 = this.mapStyle.guangquan02
    const geometry = new PlaneGeometry(5, 5)
    const material1 = new MeshBasicMaterial({
      color: 0xffffff,
      map: guangquan1,
      alphaMap: guangquan1,
      opacity: 1,
      transparent: true,
      depthTest: false,
      fog: false,
      blending: AdditiveBlending,
      side: DoubleSide
    })
    const material2 = new MeshBasicMaterial({
      color: 0xffffff,
      map: guangquan2,
      alphaMap: guangquan2,
      opacity: 1,
      transparent: true,
      depthTest: false,
      fog: false,
      blending: AdditiveBlending,
      side: DoubleSide
    })
    const mesh1 = new Mesh(geometry, material1)
    const mesh2 = new Mesh(geometry, material2)
    mesh1.position.copy(position)
    mesh2.position.copy(position)
    mesh2.position.y -= 0.001
    const quanGroup = new Group();
    quanGroup.add(mesh1, mesh2);
    this.group.add(quanGroup);
    return quanGroup;
  }

  createLabel(){
    const content = `
     <div class="provinces-label">
          <div class="provinces-label-wrap">
            <div class="number"><span class="value">200</span><span class="unit">万人</span></div>
            <div class="name">
              <span class="zh">中国</span>
              <span class="en">CHINA</span>
            </div>
            <div class="no">4</div>
          </div>
        </div>
    `
    const tag = document.createElement("div")
    tag.innerHTML = content
    tag.className = 'provinces-label';
    tag.style.position = "absolute";
    const label = new CSS3DObject(tag);
    return label;
  }
}