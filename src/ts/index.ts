import GeoWorld from './GeoWorld/GeoWorld';
import { callbackEvent } from './types';

//three.js 整个容器
const dom: HTMLElement = document.querySelector('#earth-canvas');
//tooltip提示框
const tooltip: HTMLElement = document.getElementById('tooltip');
//注册一下返回事件
const backbtn:  HTMLElement = document.getElementById('bread');

//注解：回调事件处理
const callback = (params: callbackEvent) => {
  const { eventKey } = params;
  //开始loading
  if(eventKey === 'endloading'){
    const loading = document.querySelector('#loading')
    loading.classList.add('out');
    return;
  }
  //结束loading
  if(eventKey === 'startloading'){
    const loading = document.querySelector('#loading')
    loading.classList.remove('out');
    return;
  }
}

//初始化整个three.js空间
new GeoWorld({
  dom,
  tooltip,
  backbtn,
  callback
})