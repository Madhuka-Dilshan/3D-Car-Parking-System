import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import CameraControls from 'camera-controls';
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import type { MobileCar } from '../objects/MobileCar';
import { GVar } from '../utils/GVar';

export class CameraController {
    public camera: THREE.PerspectiveCamera;
    public controls: OrbitControls | CameraControls;
    //private container : HTMLElement;
    public targetHeight: number = 140;
    private originalMinPolarAngle: number = 0;
    private originalMaxPolarAngle: number = Math.PI;
    private bPolarAdj: boolean = false;
    private readonly tolerance: number = 0.005;
    protected vec3CamTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    protected bUseCC: boolean = false;
    protected minHeight : number = 35;
    protected maxHeight : number = 120;


    constructor(container: HTMLElement) {
        //this.container = container;

        if (this.bUseCC)
            CameraControls.install({ THREE: THREE });

        
        this.camera = new THREE.PerspectiveCamera(
            30,
            container.clientWidth / container.clientHeight,
            10,
            400
        );
        //this.camera.position.set(80, 140, 80); //initCamera
        this.camera.position.set(70, 120, 70); //initCamera
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));


       
        if (this.bUseCC) {
            this.controls = new CameraControls(this.camera, container);
            let pa: number = this.controls.polarAngle;
            this.controls.minPolarAngle = pa;
            this.controls.maxPolarAngle = pa;
            this.bPolarAdj = false;
        }
        else {
            this.controls = new OrbitControls(this.camera, container);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            /**

             */
            this.controls.enablePan = true;
            
            this.controls.enableZoom = false;
            this.controls.screenSpacePanning = false; 

            let pa: number = this.controls.getPolarAngle();
            this.controls.minPolarAngle = pa;
            this.controls.maxPolarAngle = pa;
            this.bPolarAdj = false;

        }
    }

    /**
     
     * @param object -
     * @param controls - OrbitControl
     * @param camera -
     * @param distance -
     */
    public lookAtFront(object: MobileCar ) {

        this.completePolarAdj();
        
        let controls : OrbitControls = this.controls  as OrbitControls;
        let camera : THREE.Camera = this.camera;
        // OrbitControls 
        controls.enabled = false;

        let distance : number = this.camera.position.distanceTo( controls.target );

        
        const currentTheta = controls.getAzimuthalAngle();
        const currentPhi = controls.getPolarAngle();
        const currentDistance = camera.position.distanceTo(controls.target);

        
        const objectForward = new THREE.Vector3();
        object.getDirection(objectForward);
        objectForward.negate();

        
        const desiredTheta = Math.atan2(objectForward.x, objectForward.z);
        const desiredPhi = Math.acos(Math.max(-1, Math.min(1, objectForward.y)));

        
        let deltaTheta = desiredTheta - currentTheta;
        if (deltaTheta > Math.PI) deltaTheta -= 2 * Math.PI;
        if (deltaTheta < -Math.PI) deltaTheta += 2 * Math.PI;

        
        const tweenObject = { theta: currentTheta, phi: currentPhi, distance: currentDistance };

        
        new TWEEN.Tween(tweenObject)
            .to({ theta: currentTheta + deltaTheta, phi: desiredPhi, distance }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                
                const x = distance * Math.sin(tweenObject.phi) * Math.sin(tweenObject.theta);
                const y = distance * Math.cos(tweenObject.phi);
                const z = distance * Math.sin(tweenObject.phi) * Math.cos(tweenObject.theta);

               
                camera.position.copy(controls.target).add(new THREE.Vector3(x, y, z));
                camera.lookAt(controls.target);
            })
            .onComplete(() => {
                //OrbitControls
                controls.enabled = true;
                GVar.bCameraAnimState = false;  
                controls.update();
                
            })
            .start();
            GVar.bCameraAnimState = true;
    }


    protected tmpVec3: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    public getLookAtTarget(): THREE.Vector3 {
        if (this.bUseCC) {
            (this.controls as CameraControls).getTarget(this.tmpVec3);
            return this.tmpVec3;
        } else
            return (this.controls as OrbitControls).target;
    }

    public setCameraHeight(height: number): void {
        this.camera.position.y = height;

        this.unlockVerticalRotation();
    }

    public updateHeight(value: number): void {
        this.targetHeight = this.targetHeight + value;
        if (this.targetHeight < this.minHeight) {
            this.targetHeight = this.minHeight;
        }
        if (this.targetHeight > this.maxHeight)
            this.targetHeight = this.maxHeight;

        this.unlockVerticalRotation();
    }

    
    private lockVerticalRotation(): void {
        let currentAngle: number = 0;
        if (this.bUseCC)
            currentAngle = (this.controls as CameraControls).polarAngle;
        else
            currentAngle = (this.controls as OrbitControls).getPolarAngle();
        this.controls.minPolarAngle = currentAngle;
        this.controls.maxPolarAngle = currentAngle;
        this.bPolarAdj = false;
        this.controls.enabled = true;
    }

    
    private unlockVerticalRotation(): void {
        this.controls.minPolarAngle = this.originalMinPolarAngle;
        this.controls.maxPolarAngle = this.originalMaxPolarAngle;
        this.bPolarAdj = true;
        this.controls.enabled = false;
    }

    
    protected completePolarAdj() : void{
        if( this.bPolarAdj ){
            this.camera.position.y - this.targetHeight;
            this.camera.lookAt( (this.controls as OrbitControls).target );
            this.lockVerticalRotation();
        }
    }

    public update(): void {

        TWEEN.update();

        
        if (this.bPolarAdj) {
            this.camera.position.y += .05 * (this.targetHeight - this.camera.position.y);
            this.camera.lookAt((this.controls as OrbitControls).target);

            let diff: number = this.camera.position.y - this.targetHeight;
            if (Math.abs(diff) < this.tolerance) {
                this.lockVerticalRotation();
            }
        }

        if (this.bUseCC)
            (this.controls as CameraControls).update(0.01);
        else
            (this.controls as OrbitControls).update();

    }

    /**
     * 
     * @returns 
     */
    public getRotationAngle(): number {
        if (this.bUseCC)
            return (this.controls as CameraControls).polarAngle;
        else
            return (this.controls as OrbitControls).getPolarAngle();
    }

    public getAzimuthalAngle(): number {
        if (this.bUseCC)
            return (this.controls as CameraControls).azimuthAngle;
        else
            return (this.controls as OrbitControls).getAzimuthalAngle();
    }


    public onWindowResize(container: HTMLElement): void {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
    }
}