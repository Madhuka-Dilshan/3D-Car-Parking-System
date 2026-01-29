import * as THREE from 'three';
import { GVar } from '../utils/GVar';
import type { CityChunkTbl } from '../core/CityChunkTbl';


export class MobileObj extends THREE.Object3D {
    protected table : CityChunkTbl;
    protected tablePosition: THREE.Vector3;
    protected lastTablePosition: THREE.Vector3;
    protected lastPosition: THREE.Vector3;
    protected previousChunk: THREE.Object3D | null;

    constructor( table: CityChunkTbl ) {
        super();
        this.table = table;
        this.tablePosition = new THREE.Vector3();
        this.lastTablePosition = new THREE.Vector3();
        this.lastPosition = new THREE.Vector3();
        this.previousChunk = null;
    }


    /**
     * 
     * @param origin 
     * @param tblX 
     * @param tblY 
     * @param res 
     */
    protected getTablePosition(  origin : THREE.Vector3, tblX : number, tblY : number , res : THREE.Vector3 ) : void{
        res.x = GVar.CHUNK_SIZE * tblX + origin.x;
        res.y = origin.y;
        res.z = GVar.CHUNK_SIZE * tblY + origin.z
    }

    protected _updateTablePosition(): void {
        
        const curChunk : any = this.parent;
        this.getTablePosition(this.position, (curChunk as any).tableX, (curChunk as any).tableY, this.tablePosition);

        if (this.lastTablePosition.length() === 0) {
            this.lastTablePosition.copy(this.tablePosition);
        }

        this.lastTablePosition.copy(this.tablePosition);

        const x = Math.floor(THREE.MathUtils.euclideanModulo(
            this.tablePosition.x + 40, GVar.CHUNK_SIZE * GVar.TABLE_SIZE) / GVar.CHUNK_SIZE);
        const y = Math.floor(THREE.MathUtils.euclideanModulo(
            this.tablePosition.z + 40, GVar.CHUNK_SIZE * GVar.TABLE_SIZE) / GVar.CHUNK_SIZE);

        
        const targetChunk = this.table.arrChunks[x][y].node;

        if (targetChunk !== curChunk) {
            this.lastPosition.copy(this.position);
            targetChunk.add(this);
            const newX = THREE.MathUtils.euclideanModulo(this.position.x + 40, GVar.CHUNK_SIZE) - 40;
            const newZ = THREE.MathUtils.euclideanModulo(this.position.z + 40, GVar.CHUNK_SIZE) - 40;
            this.position.x = newX;
            this.position.z = newZ;
        }

        this.previousChunk = curChunk;
    }
}
