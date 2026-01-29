import * as THREE from 'three';

export interface IObject {
    mesh: THREE.Object3D;
    update(delta: number): void;
    dispose?(): void; 
    onHover?(): void; 
    onClick?(): void; 
}