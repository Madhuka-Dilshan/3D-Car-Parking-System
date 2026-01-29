export interface UICallbacks {
  addCube: () => void;
  addSphere: () => void;
  resetScene: () => void;
}

export function setupUI(callbacks: UICallbacks): void {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.zIndex = '100';
  container.style.display = 'flex';
  container.style.gap = '10px';

  // Utility to create buttons
  const createButton = (text: string, onClick: () => void): HTMLButtonElement => {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '8px 16px';
    button.style.background = 'rgba(255, 255, 255, 0.1)';
    button.style.color = 'white';
    button.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.addEventListener('click', onClick);
    return button;
  };

  // Example button: Reset Scene
  container.appendChild(createButton('Reset Scene', callbacks.resetScene));
  
  // You can add more buttons like:
  // container.appendChild(createButton('Add Cube', callbacks.addCube));
  // container.appendChild(createButton('Add Sphere', callbacks.addSphere));

  document.body.appendChild(container);
}
