import * as THREE from 'three';
import { Renderer } from './Renderer';
import type { IObject } from '../interfaces/IObject';
import { GVar } from '../utils/GVar';
import { AppScene } from './AppScene';
import { BinLoader } from '../loader/BinLoader';
import { BlockLoaded } from '../loader/BlockLoader';
import { CityChunkTbl, type ChunkData } from './CityChunkTbl';
import { CameraController } from '../constrol/CameraController';
import { InputMgr } from '../constrol/InputMgr';
import { SceneMoveController } from '../constrol/SceneMoveController';
import { EventMgr } from '../utils/EventMgr';
import { LightProbeLoader } from '../loader/LightProbeLoader';
import { EXRLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { MobileCar } from '../objects/MobileCar';


export class SceneManager {
    public scene: THREE.Scene;
    public cameraController: CameraController;
    public renderer: Renderer;
    private objects: IObject[] = [];
    private clock: THREE.Clock;

    
    protected inputMgr: InputMgr = new InputMgr();
    protected smController: SceneMoveController | null = null;
    // ChunkInstance
    protected cityChkTbl: CityChunkTbl | null = null;
    // ChunkScene
    protected chunkScene: AppScene | null = null;


    protected gridCoords: THREE.Vector2 = new THREE.Vector2(0, 0);

    //! Environment Llighting:
    protected envLightProbe: LightProbeLoader = LightProbeLoader.getins();
    protected dirLight: THREE.DirectionalLight | null = null;

    protected resizeHandler: any = null;

    
    protected bInited: boolean = false;
    protected iLastCx: number = -100000000;
    protected iLastCy: number = -100000000;

    protected followMobile: MobileCar | null = null;
    protected lerpVal : number = 0.01;

    constructor(container: HTMLElement) {

        
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(GVar.FOG_COLOR, GVar.FOG_NEAR, GVar.FOG_FAR);
        this.scene.background = new THREE.Color(GVar.FOG_COLOR);

        
        this.cameraController = new CameraController(container);
        container.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        
        if (GVar.bUseProbe) {
            this.envLightProbe.initLightProbe("./assets/environments/envProbe/irradiance.json",
                (light: THREE.LightProbe) => {
                    this.scene.add(light);
                    this.scene.environment = light as any;
                });
        } else {
            this.loadEnvMapLighting();
        }

        
        this.renderer = new Renderer(container);
        this.renderer.setSaturation(1.15);
        this.renderer.renderer.setClearColor(GVar.FOG_COLOR);


        
        const ambientLight = new THREE.AmbientLight(0xcccccc, 0.8);
        this.scene.add(ambientLight);

        this.clock = new THREE.Clock();


        this.resizeHandler = () => this.onWindowResize(container);
        window.addEventListener('resize', this.resizeHandler);


        let asce: AppScene = new AppScene();
        asce.initChunks();

        BinLoader.loadBin("./assets/scenes/data/main.bin", (data: ArrayBuffer) => {
            let bl: BlockLoaded = new BlockLoaded(data);
            bl.loadBlock("./assets/scenes/main.json", (obj: any) => {

                if (!obj) return;
                
                let arrBlocks: Array<any> = obj.getObjectByName("blocks").children;
                let arrLanes: Array<any> = obj.getObjectByName("lanes").children;
                let arrIntersections: Array<any> = obj.getObjectByName("intersections").children;
                let arrCars: Array<any> = obj.getObjectByName("cars").children;
                let arrClouds: Array<any> = obj.getObjectByName("clouds").children;

                let lenarr: Array<number> = [arrBlocks.length, arrLanes.length, arrIntersections.length, arrCars.length, arrClouds.length];
                console.log("The lenth is:" + JSON.stringify(lenarr));

                this.cityChkTbl = new CityChunkTbl(arrBlocks, arrLanes, arrIntersections, arrCars, arrClouds);
                this.chunkScene = new AppScene();
                this.chunkScene.initChunks();
                this.scene.add(this.chunkScene);


                
                this.dirLight = this.renderer.initDirLight();
                this._resizeShadowMapFrustum(window.innerWidth, window.innerHeight);
                this.chunkScene.add(this.dirLight);
                this.chunkScene.add(this.dirLight.target);

                //keyEvent:
                this.initKeyEvent();

                // 
                // smController:
                this.smController = new SceneMoveController(this.inputMgr, this.chunkScene, this.cameraController);

                
                this.refreshChunkScene();

                // chunkMove
                EventMgr.getins().on("chunkmove", (xoff: number, yoff: number) => {

                    this.iLastCx = xoff;
                    this.iLastCy = yoff;
                    this.gridCoords.x += xoff;
                    this.gridCoords.y += yoff;

                    this.refreshChunkScene();
                });
                this.cameraController.setCameraHeight(200);

                this.bInited = true;
                this.inputMgr.on("mousewheel", (value: any) => {
                    if( !GVar.bCameraAnimState )
                        this.cameraController.updateHeight(value.deltaY * .05);
                });

                this.inputMgr.on("startdrag", (evt: any) => {
                    this.onMousePickCar(evt);
                });
            });

        });
    }
    protected mTw: any = null;

    /**
     * 
     * @param evt 
     */
    protected onMousePickCar(evt: any): void {
        // Ray，
        let raycaster = new THREE.Raycaster();
        // WebGL 
        let tmpVec2 = new THREE.Vector2((evt.x / GVar.gWidth) * 2 - 1, -(evt.y / GVar.gHeight) * 2 + 1);

        // WORK START: 
        raycaster.setFromCamera(tmpVec2, this.cameraController.camera);

        var intersectors = raycaster.intersectObjects(this.chunkScene!.getPickables());
        if (intersectors.length > 0) {
            let insectObj = intersectors[0].object;

            let cx: number = (insectObj as any).userData["centeredX"];
            let cy: number = (insectObj as any).userData["centeredY"];

            let ckContainer: any = this.chunkScene?.getChunkContainer(cx, cy);
            let chunkIns: any = ckContainer.getObjectByName("chunk");
            let bFollow : boolean = false;

            if (chunkIns && chunkIns.children.length > 0) {
                const neighboringCars: Array<MobileCar> = this.cityChkTbl!.getNeighboringCars(chunkIns.children[0]);

                let meshArr: Array<any> = [];
                for (let ti: number = 0; ti < neighboringCars.length; ti++) {
                    neighboringCars[ti].setDebugBoxColor(0x00ff33, true);
                    meshArr.push(neighboringCars[ti].getMeshObj());
                }
                tmpVec2 = new THREE.Vector2((evt.x / GVar.gWidth) * 2 - 1, -(evt.y / GVar.gHeight) * 2 + 1);
                raycaster.setFromCamera(tmpVec2, this.cameraController.camera);
                intersectors = raycaster.intersectObjects(meshArr, true);
                if (intersectors.length > 0) {
                    for (let ti: number = 0; ti < intersectors.length; ti++) {
                        if (intersectors[ti].object.parent && (intersectors[ti].object.parent?.userData['type'] == "mobileCar")) {
                            let car: MobileCar = intersectors[ti].object.parent as MobileCar;
                            car.setDebugBoxColor(0xff00ff, true);
                            this.followMobile = car;
                           
                            this.cameraController.lookAtFront( car );
                            
                            bFollow = true;
                        }
                    }
                }
                
                if( !bFollow ) 
                    this.followMobile = null;
            }
        }

    }

    protected updateFollow(): void {
        if (!this.followMobile) return;

        let wpos: THREE.Vector3 = new THREE.Vector3();
        let orbit: OrbitControls = this.cameraController.controls as OrbitControls;
        let offset: THREE.Vector3 = this.cameraController.camera!.position.clone().sub(orbit.target);
        this.followMobile.getWorldPosition(wpos);

        //orbit.target.copy(wpos);
        orbit.target.lerp( wpos,this.lerpVal );
        const newPos: THREE.Vector3 = orbit.target.clone().add(offset);
        this.cameraController.camera!.position.copy(newPos);
    }


    protected loadEnvMapLighting(): void {
        
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer.renderer);
        pmremGenerator.compileEquirectangularShader();
        
        new EXRLoader()
            .load('./assets/environments/DayStreet.exr', (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;

                
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;


                this.scene.environment = envMap;
                //this.scene.background = envMap; 

                texture.dispose();
                pmremGenerator.dispose();
            });
    }

    /**
     
     * window.innerWidth, window.innerHeight
     * @param wid 
     * @param hei 
     */
    protected _resizeShadowMapFrustum(wid: number, hei: number): void {
        var start = 1.25;
        var childStartView2 = Math.max(wid / hei, start);
        var halfHeight = 75 * childStartView2;
        this.dirLight!.shadow.camera.left = .9 * -halfHeight;
        this.dirLight!.shadow.camera.right = 1.3 * halfHeight;
        this.dirLight!.shadow.camera.top = halfHeight;
        this.dirLight!.shadow.camera.bottom = -halfHeight;
        this.dirLight!.shadow.camera.updateProjectionMatrix();
    }




    protected refreshChunkScene(): void {

        this.chunkScene!.forEachChunk((chunkContainer: any, xOffset: number, yOffset: number) => {
            var xcor = this.gridCoords.x + xOffset;
            var ycor = this.gridCoords.y + yOffset;
            var v: ChunkData | null = this.cityChkTbl!.getChunkData(xcor, ycor);
            if (!v) return;
            chunkContainer.remove(chunkContainer.getObjectByName("chunk"));
            chunkContainer.add(v.node);
        });
    }

    /**
     * 
     * @param x 
     * @param y 
     * @returns 
     */
    public getChunkInsFromColMesh(x: number, y: number): any {
        let chunkIns: any = null;
        this.chunkScene!.forEachChunk((chunkContainer: any, xOffset: number, yOffset: number) => {
            if (x != xOffset && y != yOffset)
                return;
            chunkIns = chunkContainer.getObjectByName("chunk");
        });

        return chunkIns;
    }

    public addObject(object: IObject): void {
        this.objects.push(object);
        this.scene.add(object.mesh);
    }

    public removeObject(object: IObject): void {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.scene.remove(object.mesh);
            this.objects.splice(index, 1);
        }
    }

    public removeAllObjects(): void {
        this.objects.forEach(obj => {
            this.scene.remove(obj.mesh);
            if (obj.dispose) obj.dispose();
        });
        this.objects = [];
        this.followMobile = null;
    }

    public update(): void {
        const delta: number = this.clock.getDelta();
        const elapsed: number = this.clock.getElapsedTime();

        this.objects.forEach(obj => {
            obj.update(delta);
        });

        this.updateFollow();

        this.cameraController.update();


        if (this.bInited)
            this.smController?.update();


        this.cityChkTbl?.update({ delta: delta, elapsed: elapsed });


        
        this.renderer.render(this.scene, this.cameraController.camera);
    }

    private onWindowResize(container: HTMLElement): void {
        this.cameraController.onWindowResize(container);
        this.renderer.onWindowResize(container);
    }

    protected mRotY: number = 0;
    protected initKeyEvent(): void {
        window.addEventListener("keydown", (event) => {
            if (event.key === 'z') {
                this.cameraController.lookAtFront( this.followMobile as MobileCar );
            }
        });
    }

    public dispose(): void {
        this.removeAllObjects();
        this.renderer.dispose();

        // 
        // 移除事件监听：
        window.removeEventListener('resize', this.resizeHandler);
        this.renderer.renderer.domElement.removeEventListener('mousemove', () => { });
    }
}


