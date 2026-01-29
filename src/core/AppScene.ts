import * as THREE from 'three';
import { GVar } from '../utils/GVar';

/**
 * AppScene
 */
export class AppScene extends THREE.Scene {
    protected _pickables: THREE.Mesh[] = [];
    protected arrChunkContainer: THREE.Object3D[][] = [];

    /**
     * 
     * @param x 
     * @param z 
     */
    protected createChunkAt(x: number, z: number): THREE.Object3D {
        
        const chunkInsContainer = new THREE.Object3D();

        
        const geometry = new THREE.PlaneGeometry(
            GVar.CHUNK_SIZE,
            GVar.CHUNK_SIZE,
            1,
            1
        );

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,     
            opacity: 0.35,          
        });

        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;

        
        const centerOffset = Math.floor(GVar.CHUNK_COUNT / 2);
        mesh.userData["centeredX"] = x - centerOffset;
        mesh.userData["centeredY"] = z - centerOffset;
        mesh.visible = false;
        if (GVar.bVisDebug)
            mesh.position.y += 0.01;

        
        this._pickables.push(mesh);


        const halfSize = (GVar.CHUNK_COUNT - 1) / 2 * -GVar.CHUNK_SIZE;
        chunkInsContainer.position.x = halfSize + x * GVar.CHUNK_SIZE;
        chunkInsContainer.position.z = halfSize + z * GVar.CHUNK_SIZE;

        
        chunkInsContainer.userData["centeredX"] = mesh.userData["centeredX"];
        chunkInsContainer.userData["centeredY"] = mesh.userData["centeredY"];
        chunkInsContainer.userData["material"] = mesh.material;

        
        chunkInsContainer.add(mesh);

        return chunkInsContainer;
    }

    public getChunkContainer(cx: number, cz: number): any {
        for (let z: number = 0; z < GVar.CHUNK_COUNT; z++) {
            for (let x: number = 0; x < GVar.CHUNK_COUNT; x++) {
                let cc : any = this.arrChunkContainer[x][z];
                if( cc.userData["centeredX"] == cx && cc.userData["centeredY"] == cz  ) 
                    return cc;
            }
        }
        
        return null;
    }


    /**
     * 
     * @returns 
     */
    public initChunks(): void {
        for (let z: number = 0; z < GVar.CHUNK_COUNT; z++) {
            for (let x: number = 0; x < GVar.CHUNK_COUNT; x++) {
                if (!this.arrChunkContainer[x]) {
                    this.arrChunkContainer[x] = [];
                }
                let chunkContainer: THREE.Object3D = this.createChunkAt(x, z);
                this.arrChunkContainer[x][z] = chunkContainer;
                this.add(chunkContainer);
            }
        }
        return;
    }

    /**
     * 
     * @returns 
     */
    public getPickables(): THREE.Mesh[] {
        return this._pickables;
    }

    /**
     * 
     * @param cb 
     */
    public forEachChunk(cb: (chunkContainer: THREE.Object3D, centX: number, centY: number) => void): void {

        for (var x: number = 0; x < GVar.CHUNK_COUNT; x++) {
            for (var y: number = 0; y < GVar.CHUNK_COUNT; y++) {
                let v: THREE.Object3D = this.arrChunkContainer[x][y];
                cb(v, v.userData["centeredX"], v.userData["centeredY"]);
            }
        }
    }
}