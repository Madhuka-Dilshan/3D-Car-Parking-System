import { SceneManager } from './core/SceneManager';
import { CubeObject } from './objects/CubeObject';
import { setupUI } from './ui/Controls';
import { setupFPSCounter } from './utils/fpsCounter';


const container = document.getElementById('app') as HTMLElement;
const sceneManager = new SceneManager(container);



setupUI({
  addCube: () => {
    const newCube = new CubeObject();
    sceneManager.addObject(newCube);
  },
  addSphere: () => {
  },
  resetScene: () => {
    sceneManager.removeAllObjects();

  }
});


setupFPSCounter();


function animate() {
  requestAnimationFrame(animate);
  sceneManager.update();
}

animate();