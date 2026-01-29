import * as THREE from 'three';

export class BinLoader {

    public static loadBin(url: string, cb : any): void {
        const loader = new THREE.FileLoader();
        loader.setResponseType('arraybuffer'); 

        loader.load(
            url,
            function (data) {
                (data as any).filename = "main.bin";
                cb( data );
            },
            function (xhr) {
                
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                
                console.error('加载错误:', error);
            }
        );
    }
}