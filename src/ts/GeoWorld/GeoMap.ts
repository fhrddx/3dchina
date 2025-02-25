import ChinaGeoJson from '../../json/ChinaGeoJson.json';

export default class GeoMap {
    constructor(){
    }

    create(){
        const data = ChinaGeoJson;
        console.log(data); 
    }
}