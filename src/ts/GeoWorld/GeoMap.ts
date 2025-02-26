import { BufferAttribute, BufferGeometry, Color, ExtrudeGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Shape, Vector3 } from 'three';
import ChinaGeoJson from '../../json/ChinaGeoJson.json';
import * as d3 from'd3-geo'; 
import { mapOptions } from '../types';

export default class GeoMap {
  public group: Group;
  private mapStyle: mapOptions

  constructor(mapStyleOption: mapOptions){
    this.mapStyle = mapStyleOption;
    this.group = new Group();
    this.group.name = 'map_group';
  }

  create(){
    const hasData = ChinaGeoJson && ChinaGeoJson.features && ChinaGeoJson.features.length > 0;
    if(!hasData){
      return;
    }
    //转化函数
    const projection = d3.geoMercator().center([104.0, 37.5]).translate([0, 0]);
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
          const [x, y] = projection(oneCircle[i]);
          //这里存在着一个很严重的问题，那就是geojson数据可能本身有问题，导致投影了之后，出现 NAN 的值，需要具体查下是什么原因-----------？？？？
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
          opacity: 0.6,
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
  }
}