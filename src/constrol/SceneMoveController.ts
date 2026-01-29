import type { AppScene } from "../core/AppScene";
import { EventMgr } from "../utils/EventMgr";
import { GVar } from "../utils/GVar";
import type { CameraController } from "./CameraController";
import type { InputMgr } from "./InputMgr";
import * as THREE from 'three';

export class SceneMoveController {

    protected _panning: boolean = false;
    
    protected _startCoords = new THREE.Vector2;

    protected _lastOffset = new THREE.Vector2;

    
    protected _offset = new THREE.Vector2;

    
    protected _speed = new THREE.Vector3(GVar.PAN_SPEED, 0, GVar.PAN_SPEED);
    protected _sceneOffset = new THREE.Vector3(0, 0, 0);
    
    protected _tmpWorldOffset = new THREE.Vector3;

    protected _inputManager: InputMgr | null = null;
    protected _scene: AppScene | null = null;
    protected _camera: CameraController | null = null;
    protected enabled: boolean = false;

    protected _raycaster = new THREE.Raycaster;

    protected tmpVec2: THREE.Vector2 = new THREE.Vector2(0, 0);

    public constructor(imgr: InputMgr, scene: AppScene, cam: CameraController) {
        this._inputManager = imgr;
        this._scene = scene;
        this._camera = cam;
        this.enabled = true;

        
        //imgr.on("startdrag", this._onStartDrag.bind(this));
        //imgr.on("enddrag", this._onEndDrag.bind(this));
        //imgr.on("drag", this._onDrag.bind(this));
    }

    protected _onStartDrag(evt: any): void {
        if (this.enabled) {
            this._panning = true;
            this._startCoords.set(evt.x, evt.y);
            //console.log( "StartCord:" + JSON.stringify( this._startCoords ) );
        }
    }

    protected _onEndDrag(): void {
        if (this.enabled) {
            this._panning = false;
            this._lastOffset.copy(this._offset);
            //console.log( "LastOffset:" + JSON.stringify( this._startCoords ) );
        }
    }
    protected _onDrag(evt: any): void {
        var vector = new THREE.Vector2(0, 0);
        this.tmpVec2.x = evt.x;
        this.tmpVec2.y = evt.y;
        if (this.enabled && this._panning) {
            
            vector.subVectors(this.tmpVec2, this._startCoords);
            this._offset.addVectors(this._lastOffset, vector);
            //console.log( "AddValue is:" + JSON.stringify( this._offset ) 
            //    + "___" + JSON.stringify( this._lastOffset ) + "___" + JSON.stringify( vector ) );
        }
    }


    public raycast(): void {
        let castVec: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
        castVec.copy(this._camera!.getLookAtTarget() );

       
        castVec.y += 5;
        this._raycaster.set(castVec, new THREE.Vector3(0, -1, 0));
        var intersectors = this._raycaster.intersectObjects(this._scene!.getPickables());
        if (intersectors.length > 0) {
            let insectObj = intersectors[0].object;

            // 
            
            /*
            if (GVar.bVisDebug) {
                let arr: Array<any> = this._scene!.getPickables();
                for (let ti: number = 0; ti < arr.length; ti++)
                    arr[ti].visible = false;
                insectObj.visible = true;
            }*/

            let cx: number = (insectObj as any).userData["centeredX"];
            let cy: number = (insectObj as any).userData["centeredY"];

            this._sceneOffset.x += cx * GVar.CHUNK_SIZE;
            this._sceneOffset.z += cy * GVar.CHUNK_SIZE;

            EventMgr.getins().trigger("chunkmove", cx, cy);

        }
    }

    protected point = new THREE.Vector3(0, 0, 0);
  
    public update(): void {
        var offset = new THREE.Vector2;
        var angle = new THREE.Vector2(0, 0);

        this.raycast();
        offset.copy(this._offset);

        
        offset.rotateAround(angle, -this._camera!.getRotationAngle());

        // 根据移动速度，来拟合一个最终的效果
        this._tmpWorldOffset.set(offset.x, 0, offset.y).multiply(this._speed);

        this.point.lerp(this._tmpWorldOffset, .01);

        
        //this.point.copy(this._tmpWorldOffset);


        this._scene!.position.addVectors(this._sceneOffset, this.point);

    }
}