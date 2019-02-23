import * as THREE from 'three';

function loadMtl (objLoader, src) {
  if (src) {
    return new Promise(resolve => {
      objLoader.loadMtl(src, null, materials => resolve(materials));
    });
  }

  return Promise.resolve(undefined);
}

function loadObj (objLoader, src) {
  return new Promise(resolve => {
    objLoader.load(src, event => resolve(event.detail.loaderRootNode), null, null, null, false);
  });
}

function computeGroupCenter (group) {
  const bbox = new THREE.Box3().setFromObject(group);

  return bbox.getCenter(group.position);
}

class ObjViewer extends HTMLElement {
  constructor () {
    super();

    this._aspectRatio = 1;
  }

  get aspectRatio () {
    return this._aspectRatio;
  }

  get canvas () {
    return this.sDOM.querySelector('canvas');
  }

  get cameraDefaults () {
    return {
      posCamera: new THREE.Vector3(0.0, 100.0, 200.0),
      posCameraTarget: this.cameraTarget
    };
  }

  get cameraTarget () {
    return new THREE.Vector3(0.0, 0.0, 0.0);
  }

  resetCamera () {
    this.camera.position.copy(this.cameraDefaults.posCamera);
    this.cameraTarget.copy(this.cameraDefaults.posCameraTarget);
    this.updateCamera();
  }

  updateCamera () {
    this.camera.aspect = this.aspectRatio;

    this.camera.lookAt(this.cameraTarget);
    this.camera.updateProjectionMatrix();
  }

  initGL ({
    displayGrid = false
  }) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      autoClear: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setClearColor(0x050505);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(this.cameraDefaults.fov, this.aspectRatio, this.cameraDefaults.near, this.cameraDefaults.far);
    this.resetCamera();
    this.controls = new THREE.OrbitControls(this.camera, this.wrapperElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight1 = new THREE.DirectionalLight(0xC0C090);
    const directionalLight2 = new THREE.DirectionalLight(0xC0C090);

    directionalLight1.position.set(-100, -50, 100);
    directionalLight2.position.set(100, 50, -100);

    this.scene.add(directionalLight1);
    this.scene.add(directionalLight2);
    this.scene.add(ambientLight);

    if (displayGrid) {
      const gridHelper = new THREE.GridHelper(1200, 60, 0xFF4444, 0x404040);

      this.scene.add(gridHelper);
    }
  }

  recalcAspectRatio () {
    this._aspectRatio = (this.canvas.offsetHeight === 0) ? 1 : this.canvas.offsetWidth / this.canvas.offsetHeight;
  }

  resizeDisplayGL () {
    this.recalcAspectRatio();
    this.renderer.setSize(this.canvas.offsetWidth * window.devicePixelRatio, this.canvas.offsetHeight * window.devicePixelRatio, false);
    this.updateCamera();
  }

  async loadModel (objSource, mtlSource) {
    const objLoader = new THREE.OBJLoader2();
    const modelName = objSource.split('/').pop().split('.')[0];

    const materials = await loadMtl(objLoader, mtlSource);

    objLoader.setModelName(modelName);

    if (materials) {
      objLoader.setMaterials(materials);
    }

    objLoader.setLogging(false, false);

    const rootNode = await loadObj(objLoader, objSource);

    const center = computeGroupCenter(rootNode);

    // Centers the model in the view
    center.multiplyScalar(-1);

    this.camera.lookAt(center);

    this.scene.add(rootNode);
  }

  render () {
    if (!this.renderer.autoClear) {
      this.renderer.clear();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  startRenderLoop () {
    this.render();
    requestAnimationFrame(() => this.startRenderLoop());
  }

  async connectedCallback () {
    this.sDOM = this.attachShadow({ mode: 'closed' });

    this.sDOM.innerHTML = `
      <style>
      :host {
        width: 100%;
        height: 100%;
        display: block;
        contain: strict;
        overflow: hidden;
      }

      .wrapper,
      canvas {
        width: 100%;
        height: 100%;
      }

      .loading-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1em;
        color: white;
        font-family: sans-serif;
        opacity: 1;
        transition: opacity 250ms ease;
      }

      .hidden {
        opacity: 0;
        pointer-events: none;
      }
      </style>
      <div class="wrapper">
        <p class="loading-message">Loading model...</p>
        <canvas></canvas>
      </div>
    `;

    this.wrapperElement = this.sDOM.querySelector('.wrapper');

    const displayGrid = this.hasAttribute('display-grid');

    await import('three/examples/js/loaders/LoaderSupport.js');
    await import('three/examples/js/loaders/MTLLoader.js');
    await import('three/examples/js/loaders/OBJLoader2.js');
    await import('three/examples/js/controls/OrbitControls.js');

    this.initGL({ displayGrid });
    this.resizeDisplayGL();

    const objSource = this.getAttribute('obj-source');
    const mtlSource = this.getAttribute('mtl-source');

    await this.loadModel(objSource, mtlSource);

    this.sDOM.querySelector('.loading-message').classList.add('hidden');

    this.startRenderLoop();

    // @ts-ignore
    const ro = new ResizeObserver(() => this.resizeDisplayGL());

    ro.observe(this);
  }
}

customElements.define('obj-viewer', ObjViewer);
