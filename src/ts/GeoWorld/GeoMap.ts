import { AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, Color, DoubleSide, ExtrudeGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, RepeatWrapping, Shape, Sprite, SpriteMaterial, sRGBEncoding, Vector3 } from 'three';
import ChinaGeoJson from '../../json/ChinaGeoJson.json';
import * as d3 from'd3-geo'; 
import { mapOptions, pointItem, saleItem } from '../types';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import saleList from './TestData';
import points from './ImportantPoints';

export default class GeoMap {
  public group: Group;
  public hoverMeshs: Object3D[];
  public clickMesh: Object3D[];
  private mapStyle: mapOptions;
  private projection: (array: number[]) => number[];
  private bigCirclePlane: Object3D;
  private smallCirclePlane: Object3D;
  private animatedPoints: Object3D[];
  private barCircles: Object3D[];
  private tickNumber: number;

  constructor(mapStyleOption: mapOptions){
    this.mapStyle = mapStyleOption;
    this.group = new Group();
    this.group.name = 'map_group';
    //经纬度投影转化函数
    this.projection = d3.geoMercator().center([104.0, 37.5]).translate([0, 0]);
    //设置下贴图的属性
    const texture = this.mapStyle.huiguangTexture;
    texture.encoding = sRGBEncoding;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    //每一帧的标识
    this.tickNumber = 0;
    this.animatedPoints = [];
    this.barCircles = [];
  }

  //创建地图
  create(){
    const hasData = ChinaGeoJson && ChinaGeoJson.features && ChinaGeoJson.features.length > 0;
    if(!hasData){
      return;
    }
    this.clickMesh = [];
    this.hoverMeshs = [];
    //遍历所有的省
    ChinaGeoJson.features.forEach(provinceObject => {
      //每个省创建一个组合
      const provinceGroup = new Group();
      provinceGroup.name = 'province_group';
      //所有的圈
      const allCircles = provinceObject.geometry.coordinates;
      //再遍历每一个圈
      allCircles.forEach(oneCircle => {
        //geo的数据嵌套非常复杂，圈里面可能还嵌套其他圈，需要额外再保存，再遍历
        const extraCircles = [];
        //准备生成一个不规则的平面
        const shape = new Shape();
        //准备画出一条不规则的线
        const vertices = [];
        //每个圈的所有的点，都遍历一次，每个点都是包含2个数字的数组
        for (let i = 0; i < oneCircle.length; i++) {
          const length = oneCircle[i].length;
          if(length === 2){
            const [x, y] = this.projection(oneCircle[i]);
            if (i === 0) {
              shape.moveTo(x, -y);
            }
            shape.lineTo(x, -y);
            vertices.push(x, -y, this.mapStyle.deep);
          }else{
            extraCircles.push(oneCircle[i]);
          }
        }
        //遍历一下圈中圈（类似中国的河北省，就是圈中圈的情况）
        for (let i = 0; i < extraCircles.length; i++) {
          const everyCircle = extraCircles[i];
          //每个圈的所有的点，都遍历一次，每个点都是包含2个数字的数组
          for (let i = 0; i < everyCircle.length; i++) {
            const length = everyCircle[i].length;
            if(length === 2){
              const [x, y] = this.projection(everyCircle[i]);
              if (i === 0) {
                shape.moveTo(x, -y);
              }
              shape.lineTo(x, -y);
              vertices.push(x, -y, this.mapStyle.deep);
            }
          }
        }
        //生成线条
        const lineGeometry = new BufferGeometry();
        lineGeometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
        const lineMaterial = new LineBasicMaterial({
          color: new Color(this.mapStyle.lineColor),
        });
        const line = new Line(lineGeometry, lineMaterial);
        line.name = 'province_line';
        //由shape平面挤压出一定的厚度物体
        const extrudeSettings = {
          depth: this.mapStyle.deep,
          bevelEnabled: false,
        };
        const geometry = new ExtrudeGeometry(
          shape,
          extrudeSettings
        );
        const material = new MeshBasicMaterial({
          color: new Color(this.mapStyle.planeColor),
          transparent: true,
          opacity: 0.8,
        });
        material.needsUpdate = true;
        const sideMaterial = new MeshBasicMaterial({
          color: new Color(this.mapStyle.sideColor),
          transparent: true,
          opacity: 0.5,
        });
        sideMaterial.needsUpdate = true;
        const mesh = new Mesh(geometry, [material, sideMaterial]);
        mesh.name = 'province_mesh';
        this.hoverMeshs.push(mesh);
        this.clickMesh.push(mesh);
        //最后加入各个组合中
        provinceGroup.add(line);
        provinceGroup.add(mesh);
        provinceGroup.userData['properties'] = provinceObject.properties;
        this.group.add(provinceGroup);
      });
    });
    //遍历所有的销售数据
    let max: number = 0;
    let min: number = 0;
    saleList.forEach((item: saleItem) => {
      const count = item.count;
      if(count > max){
        max = count;
      }
      if(count < min){
        min = count;
      }
    })
    saleList.forEach((item: saleItem, index: number) => {
      const barHeight = this.mapStyle.barheightmin + Math.floor((item.count - min) / (max - min) * (this.mapStyle.barheightmax - this.mapStyle.barheightmin));
      const [x, y] = this.projection(item.center);
      this.createBar(item, x, -y, this.mapStyle.deep + 0.3, barHeight);
      this.createQuan(x, -y, this.mapStyle.deep + 0.4, (index % 3 === 0));
      this.createLabel(item, x, -y, this.mapStyle.deep, barHeight);
    })
    //重点标注
    this.createPoints();
    //标注下牌匾
    this.createWall();
    //创建底部的大圆环
    this.createCirclePlane();
  }

  //创建光柱
  createBar(item: saleItem, x:number, y: number, z: number, barHeight: number){
    //光柱长方体的材质
    const material = new MeshBasicMaterial({
      color: 0x77fbf5,
      transparent: true,
      opacity: 0.7,
      depthTest: false,
      fog: false,
    });
    //创建光柱立方体（这时候，光柱被XOY平面平分成2部分）
    const box = new BoxGeometry(1, 1, barHeight);
    //让光柱的底部贴近XOY平面（往Z轴位移半截柱体的距离）
    box.translate(0, 0, barHeight / 2);
    //创建3D物体，并添加自定义属性properties，方便在hover的时候用到
    const areaBar = new Mesh(box, material);
    areaBar.name = 'province_bar';
    areaBar.userData['properties'] = {
      name: item.province,
      value: item.count
    };
    areaBar.position.set(x, y, z);
    //柱体内部加上光平面
    const lights = this.createBarLights(barHeight, 0xfffef4);
    areaBar.add(...lights);
    this.group.add(areaBar);
    this.hoverMeshs.push(areaBar);
  }

  //柱体内部，加上几个平面
  createBarLights(height: number, color: number) {
    const geometry = new PlaneGeometry(4, height);
    geometry.translate(0, height / 2, 0);
    const material = new MeshBasicMaterial({
      color: color,
      map: this.mapStyle.huiguangTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = 10;
    mesh.rotateX(Math.PI / 2);
    const mesh2 = mesh.clone();
    const mesh3 = mesh.clone();
    mesh2.rotateY((Math.PI / 180) * 60);
    mesh3.rotateY((Math.PI / 180) * 120);
    return [mesh, mesh2, mesh3];
  }

  //在柱体的底部加上光圈
  createQuan(x: number, y: number, z: number, animated: boolean) {
    const position = new Vector3(x, y, z);
    const guangquan1 = this.mapStyle.guangquan01;
    const guangquan2 = this.mapStyle.guangquan02;
    const geometry = new PlaneGeometry(5, 5);
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
    });
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
    });
    const mesh1 = new Mesh(geometry, material1);
    const mesh2 = new Mesh(geometry, material2);
    mesh1.position.copy(position);
    mesh2.position.copy(position);
    mesh2.position.y -= 0.001;
    const quanGroup = new Group();
    quanGroup.add(mesh1, mesh2);
    this.group.add(quanGroup);
    if(animated){
      this.barCircles.push(mesh1);
    }
  }

  //加上label标签
  createLabel(item: saleItem, x: number, y: number, z: number, barHeight: number){
    const content = `
      <div class="provinces-label">
        <div class="provinces-label-wrap">
          <div class="number"><span class="value">${item.count}</span><span class="unit">个电站</span></div>
          <div class="name">
            <span class="zh">${item.province}</span>
            <span class="en">${item.provinceEn}</span>
          </div>
          <div class="no">${item.rank}</div>
        </div>
      </div>
    `;
    const tag = document.createElement("div");
    tag.innerHTML = content;
    tag.className = 'provinces-label';
    tag.style.position = "absolute";
    const label = new CSS3DObject(tag);
    label.scale.set(0.1, 0.1, 0.1);
    label.rotation.x = Math.PI / 2;
    label.position.set(x, y, z);
    label.translateX(11.5);
    label.translateY(barHeight + 3.5);
    label.name = 'province_brand';
    label.userData['properties'] = {
      name: item.province,
      rank: item.rank,
      value: item.count
    }
    this.group.add(label);
  }

  //添加重点标注的地方
  createPoints(){
    const colors = [0xfffef4, 0x77fbf5];
    const texture = this.mapStyle.pointTexture;
    const size = 8;
    points.forEach((p: pointItem, index: number) => {
      const material = new SpriteMaterial({
        map: texture,
        color: colors[index % colors.length],
        fog: false,
        transparent: true,
        depthTest: false,
      })
      const sprite = new Sprite(material);
      const [x, y] = this.projection(p.center);
      sprite.scale.set(size, size, size);
      sprite.position.set(x, -y, this.mapStyle.deep + size / 3);
      sprite.name = 'province_point';
      sprite.userData['properties'] = {
        name: p.province,
        value: p.count
      };
      this.group.add(sprite);
      this.hoverMeshs.push(sprite);
      this.clickMesh.push(sprite);
      this.animatedPoints.push(sprite);
    })
  }

  //添加相关的牌匾
  createWall(){
    const content = `
      <div class="country-cn">中国</div>
      <div class="country-en">CHINA</div>
    `;
    const tag = document.createElement("div");
    tag.innerHTML = content;
    tag.className = 'country-label';
    tag.style.position = "absolute";
    const label = new CSS3DObject(tag);
    label.scale.set(0.1, 0.1, 0.1);
    label.rotation.x = Math.PI / 2;
    label.position.set(15, -68, 2);
    this.group.add(label);
  }

  //创建底部的大圆环
  createCirclePlane(){
    //创建第一个大圆环
    const radius1 = 130;
    const plane1 = new PlaneGeometry(radius1, radius1);
    const material1 = new MeshBasicMaterial({
      map: this.mapStyle.rotationBorder1,
      color: 0x2aa8ac,
      transparent: true,
      opacity: 0.2,
      side: DoubleSide,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    const mesh1 = new Mesh(plane1, material1);
    mesh1.translateZ(-1);
    mesh1.translateX(10);
    this.group.add(mesh1);
    this.bigCirclePlane = mesh1; 
    //创建第二个大圆环
    const radiu2 = 110;
    const plane2 = new PlaneGeometry(radiu2, radiu2);
    const material2 = new MeshBasicMaterial({
      map: this.mapStyle.rotationBorder2,
      color: 0x2aa8ac,
      transparent: true,
      opacity: 0.2,
      side: DoubleSide,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    const mesh2 = new Mesh(plane2, material2);
    mesh2.translateZ(-1);
    mesh2.translateX(10);
    this.group.add(mesh2);
    this.smallCirclePlane = mesh2;
  }

  //每一帧更新下动画
  tick(){
    this.tickNumber = (this.tickNumber + 1) % 360000;
    if(this.bigCirclePlane){
      this.bigCirclePlane.rotation.z += 0.01;
    }
    if(this.smallCirclePlane){
      this.smallCirclePlane.rotation.z -= 0.008;
    }
    if(this.animatedPoints && this.animatedPoints.length > 0){
      this.animatedPoints.forEach(mesh => {
        if(!mesh.userData['height']){
          mesh.userData['height'] = 0;
        }
        const height = mesh.userData['height'] + Math.sin(this.tickNumber * 0.1);
        mesh.userData['height'] = height;
        mesh.position.setZ(height * 0.2 + this.mapStyle.deep);
      })
    }
    if(this.barCircles && this.barCircles.length > 0){
      this.barCircles.forEach(circle => {
        circle.rotation.z += 0.08;
      })
    }
  }
}