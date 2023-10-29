/**
* Cottontail rabbit by Poly by Google [CC-BY] via Poly Pizza
*/

import { random } from './utils';
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import vertexSource from "./shader/vertexShader.glsl";
import fragmentSource from "./shader/fragmentShader.glsl";
import vertexSource2 from "./shader/vertexShader2.glsl";
import fragmentSource2 from "./shader/fragmentShader2.glsl";
import Stats from "three/examples/jsm/libs/stats.module.js"
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);


function ImagePixel(path, w, h, ratio) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const width = w;
	const height = h;
	canvas.width = width;
	canvas.height = height;

	ctx.drawImage(path, 0, 0);
	const data = ctx.getImageData(0, 0, width, height).data;
	const position = [];
	const color = [];
	const alpha = [];

	for (let y = 0; y < height; y += ratio) {
		for (let x = 0; x < width; x += ratio) {
			const index = (y * width + x) * 4;
			const r = data[index] / 255;
			const g = data[index + 1] / 255;
			const b = data[index + 2] / 255;
			const a = data[index + 3] / 255;

			const pX = x - width / 2;
			const pY = -(y - height / 2);
			const pZ = 0;

			position.push(pX, pY, pZ), color.push(r, g, b), alpha.push(a);
		}
	}

	return { position, color, alpha };
}

class Particle {
  constructor(scene) {
    this.scene = scene;
    this.promiseList = []
    this.pathList = [
      'images/earth.png',
    ]
    this.imageList = [];

    this.countParticle = 0;

    this.randomMesh = null;

    this.targetPositions = {};

    this.clock = new THREE.Clock();
    this.uniforms = {
      uTime: {
        value: 0.0
      },
    }
  }

  init() {
    this.pathList.forEach((image) => {
      this.promiseList.push(
        new Promise((resolve) => {
					const img = new Image();
					img.src = image;
					img.crossOrigin = "anonymous";

					img.addEventListener('load', () => {
						this.imageList.push(ImagePixel(img, img.width, img.height, 2.0)); //数値で粒度設定
						resolve();
					});
        })
      )
    })
    Promise.all(this.promiseList).then(() => {
      this._setMesh();
      this._setRandomMesh();
      this._initParticlesMesh();
      this._setAnimation();
    })
  }

  _setMesh() {
    const filteredPositions = [];
    const filteredColors = [];
    // const filteredAlphas = [];

    const positions = this.imageList[0].position;
    const colors = this.imageList[0].color;
    // const alphas = this.imageList[0].alpha;

    for (let i = 0; i < colors.length; i += 3) {
      // R成分を元にデータをフィルタリング
      if (colors[i] >= 0.6) {
        // filteredPositions.push(positions[i] + random(-2.0, 2.0), positions[i + 1] + random(-2.0, 2.0), positions[i + 2]);
        filteredPositions.push(positions[i] + random(-0.5, 0.5), positions[i + 1] + random(-0.5, 0.5), positions[i + 2]);
        filteredColors.push(colors[i], colors[i + 1], colors[i + 2]);
        // filteredAlphas.push(alphas[i / 3]);
      }
    }



    // const positions2 = this.imageList[1].position;
    // const colors2 = this.imageList[1].color;

    // console.log(colors2);

    // for (let i = 0; i < colors2.length; i += 3) {
    //   // R成分を元にデータをフィルタリング
    //   if (colors2[i] >= 0.5) {
    //     filteredPositions.push(positions2[i] + random(-2.0, 2.0), positions2[i + 1] + random(-2.0, 2.0), positions2[i + 2]);
    //     filteredColors.push(colors2[i], colors2[i + 1], colors2[i + 2]);
    //   }
    // }









    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(filteredPositions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(filteredColors, 3));
    // geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(filteredAlphas, 1));

    // // ランダム要素
    // const randomArray = [];
    // const vertices = filteredPositions.length;
    // for (let i = 0; i < vertices; i++) {
    //   randomArray.push(random(-2.0, 2.0), random(-2.0, 2.0), random(-2.0, 2.0));
    // }
    // geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randomArray, 3));

    

    // パーティクル数を設定
    this.countParticle = filteredPositions.length;

    console.log(geometry);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexSource,
      fragmentShader: fragmentSource,
      transparent: true
    });
    this.mesh = new THREE.Points(geometry, material);
    // this.scene.add(this.mesh);

    this.targetPositions.earth = [...geometry.attributes.position.array];
  }

  _setRandomMesh() {
    console.log(this.countParticle);
    const vertices = [];
    for (let i = 0; i < this.countParticle; i++) {
      const x = (Math.random() - 0.5) * (window.innerWidth * 1.5);
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * (window.innerWidth * 1.2);
      vertices.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      // vertexColors: true,
      color: "red",
      size: 2.0
    });

    // ランダム要素
    const randomArray = [];
    for (let i = 0; i < this.countParticle; i++) {
      randomArray.push(random(-2.0, 2.0), random(-2.0, 2.0), random(-2.0, 2.0));
    }
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randomArray, 3));


    this.randomMesh = new THREE.Points(geometry, material);

    this.targetPositions.random = [...geometry.attributes.position.array];

  }

  _initParticlesMesh() {
    // this.particleGeometry = this.mesh.geometry;
    this.particleGeometry = this.randomMesh.geometry;
    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexSource,
      fragmentShader: fragmentSource,
      transparent: true,
      uniforms: this.uniforms,
    });
    this.particlesMesh = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.scene.add(this.particlesMesh);
  }

  _animateParticles(targetPositions) {
    const positions = this.particlesMesh.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i+=3) {
      // アニメーション用中間オブジェクト
      const intermediateObject = {
        x: positions[i],
        y: positions[i+1],
        z: positions[i+2]
      };

      gsap.to(intermediateObject, {
        duration: 1.6,
        // ease: "power2.inOut",
        ease: "expo.inOut",
        x: targetPositions[i],
        y: targetPositions[i+1],
        z: targetPositions[i+2],
        onUpdate: () => {
          positions[i] = intermediateObject.x;
          positions[i+1] = intermediateObject.y;
          positions[i+2] = intermediateObject.z;
          this.particlesMesh.geometry.attributes.position.needsUpdate = true;
        }
      });

      // gsap.to(this.particlesMesh.rotation, {
      //   duration: 0.8,
      //   y: "+=60",
      //   x: "+=30"
      // });
    }
  }

  _setAnimation() {
    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: '#section02',
        start: 'top bottom',
        toggleActions: 'play none none reverse',
        // markers: true,
        onEnter: ()=> {
          // console.log('on enter');
          this._animateParticles(this.targetPositions.earth);
        },
        onLeaveBack: ()=> {
          // console.log('on leaveback');
          this._animateParticles(this.targetPositions.random);
        }
      }
    });

    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: '#section03',
        start: 'top bottom',
        toggleActions: 'play none none reverse',
        // markers: true,
        onEnter: ()=> {
          // console.log('on enter');
          this._animateParticles(this.targetPositions.random);
        },
        onLeaveBack: ()=> {
          // console.log('on leaveback');
          this._animateParticles(this.targetPositions.earth);
        }
      }
    });

    // const tl3 = gsap.timeline({
    //   scrollTrigger: {
    //     trigger: '#section03',
    //     start: 'bottom bottom',
    //     toggleActions: 'play none none reverse',
    //     // markers: true,
    //     onEnter: ()=> {
    //       console.log('on enter');
    //       this._animateParticles(this.targetPositions.random);
    //     },
    //     onLeaveBack: ()=> {
    //       console.log('on leaveback');
    //       this._animateParticles(this.targetPositions.shape02);
    //     }
    //   }
    // });
  }

  _render() {
    //
  }

  onResize() {
    //
  }

  onUpdate() {
    // this.uniforms.uTime.value += 0.02;
    const elapsedTime = this.clock.getElapsedTime();
    this.uniforms.uTime.value = elapsedTime * 0.5;

    this._render();
  }
}





class Particle2 {
  constructor(scene) {
    this.scene = scene;
    this.promiseList = []
    this.pathList = [
      'images/earth_line.png',
    ]
    this.imageList = [];

    this.countParticle = 0;

    this.randomMesh = null;

    this.targetPositions = {};

    this.clock = new THREE.Clock();
    this.uniforms = {
      uTime: {
        value: 0.0
      },
      uAlpha: {
        value: 0.0
      }
    }
  }

  init() {
    this.pathList.forEach((image) => {
      this.promiseList.push(
        new Promise((resolve) => {
					const img = new Image();
					img.src = image;
					img.crossOrigin = "anonymous";

					img.addEventListener('load', () => {
						this.imageList.push(ImagePixel(img, img.width, img.height, 2.0)); //数値で粒度設定
						resolve();
					});
        })
      )
    })
    Promise.all(this.promiseList).then(() => {
      this._setMesh();
      this._setRandomMesh();
      this._initParticlesMesh();
      this._setAnimation();
    })
  }

  _setMesh() {
    const filteredPositions = [];
    const filteredColors = [];
    // const filteredAlphas = [];

    const positions = this.imageList[0].position;
    const colors = this.imageList[0].color;
    // const alphas = this.imageList[0].alpha;

    for (let i = 0; i < colors.length; i += 3) {
      // R成分を元にデータをフィルタリング
      if (colors[i] >= 0.5) {
        filteredPositions.push(positions[i] + random(-0.3, 0.3), positions[i + 1] + random(-0.3, 0.3), positions[i + 2]);
        filteredColors.push(colors[i], colors[i + 1], colors[i + 2]);
        // filteredAlphas.push(alphas[i / 3]);
      }
    }


    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(filteredPositions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(filteredColors, 3));
    // geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(filteredAlphas, 1));

    // ランダム要素
    const randomArray = [];
    const vertices = filteredPositions.length;
    for (let i = 0; i < vertices; i++) {
      randomArray.push(random(-0.3, 0.3), random(-0.3, 0.3), random(-0.3, 0.3));
    }
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randomArray, 3));

    

    // パーティクル数を設定
    this.countParticle = filteredPositions.length;

    console.log(geometry);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexSource2,
      fragmentShader: fragmentSource2,
      transparent: true
    });
    this.mesh = new THREE.Points(geometry, material);
    // this.scene.add(this.mesh);

    this.targetPositions.earth = [...geometry.attributes.position.array];
  }

  _setRandomMesh() {
    console.log(this.countParticle);
    const vertices = [];
    for (let i = 0; i < this.countParticle; i++) {
      const x = (Math.random() - 0.5) * (window.innerWidth * 1.5);
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * (window.innerWidth * 1.2);
      vertices.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      // vertexColors: true,
      color: "red",
      size: 2.0
    });

    // ランダム要素
    const randomArray = [];
    for (let i = 0; i < this.countParticle; i++) {
      randomArray.push(random(-0.3, 0.3), random(-0.3, 0.3), random(-0.3, 0.3));
    }
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randomArray, 3));


    this.randomMesh = new THREE.Points(geometry, material);

    this.targetPositions.random = [...geometry.attributes.position.array];

  }

  _initParticlesMesh() {
    // this.particleGeometry = this.mesh.geometry;
    this.particleGeometry = this.randomMesh.geometry;
    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexSource2,
      fragmentShader: fragmentSource2,
      transparent: true,
      uniforms: this.uniforms,
    });
    this.particlesMesh = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.scene.add(this.particlesMesh);
  }

  _animateParticles(targetPositions) {
    const positions = this.particlesMesh.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i+=3) {
      // アニメーション用中間オブジェクト
      const intermediateObject = {
        x: positions[i],
        y: positions[i+1],
        z: positions[i+2]
      };

      gsap.to(intermediateObject, {
        duration: 1.6,
        // ease: "power2.inOut",
        ease: "expo.inOut",
        x: targetPositions[i],
        y: targetPositions[i+1],
        z: targetPositions[i+2],
        onUpdate: () => {
          positions[i] = intermediateObject.x;
          positions[i+1] = intermediateObject.y;
          positions[i+2] = intermediateObject.z;
          this.particlesMesh.geometry.attributes.position.needsUpdate = true;
        }
      });

      // gsap.to(this.particlesMesh.rotation, {
      //   duration: 0.8,
      //   y: "+=60",
      //   x: "+=30"
      // });
    }
  }

  _setAnimation() {
    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: '#section02',
        start: 'top bottom',
        toggleActions: 'play none none reverse',
        // markers: true,
        onEnter: ()=> {
          // console.log('on enter');
          this._animateParticles(this.targetPositions.earth);
        },
        onLeaveBack: ()=> {
          // console.log('on leaveback');
          this._animateParticles(this.targetPositions.random);
        }
      }
    });

    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: '#section03',
        start: 'top bottom',
        toggleActions: 'play none none reverse',
        // markers: true,
        onEnter: ()=> {
          // console.log('on enter');
          this._animateParticles(this.targetPositions.random);
        },
        onLeaveBack: ()=> {
          // console.log('on leaveback');
          this._animateParticles(this.targetPositions.earth);
        }
      }
    });

  }

  _render() {
    //
  }

  onResize() {
    //
  }

  onUpdate() {
    // this.uniforms.uTime.value += 0.02;
    const elapsedTime = this.clock.getElapsedTime();
    this.uniforms.uTime.value = elapsedTime * 0.5;

    this._render();
  }
}


class Main {
  constructor() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.canvas = document.querySelector(".canvas");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.viewport.width, this.viewport.height);

    this.scene = new THREE.Scene();
    this.camera = null;


    this.loader = new GLTFLoader();

    // this.randomMesh = null;

    this.surfaceMesh = null;

    this.targetPositions = {};

    this.partcle = new Particle(this.scene);
    this.partcle.init();

    this.partcle2 = new Particle2(this.scene);
    this.partcle2.init();

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    this._init();
    this._update();
    this._addEvent();
  }

  _setCamera() {
    // this.camera = new THREE.PerspectiveCamera(45, this.viewport.width / this.viewport.height, 1, 100);
    // this.camera.position.set(0, 0, 5);
    // this.scene.add(this.camera);

    //ウインドウとWebGL座標を一致させる
    const fov = 45;
    const fovRadian = (fov / 2) * (Math.PI / 180); //視野角をラジアンに変換
    const distance = this.viewport.height / 2 / Math.tan(fovRadian); //ウインドウぴったりのカメラ距離
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.viewport.width / this.viewport.height,
      1,
      distance * 2
    );
    this.camera.position.z = distance;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  _addModel() {
    this.loader.load('model/rabit.glb', (gltf) => {
      const model = gltf.scene;
     
      this.modelMesh = model.children[0];

      // メッシュを拡大
      this.modelMesh.scale.set(10.0, 10.0, 10.0);

      // メッシュのスケールに合わせて座標データを拡大
      const positions = this.modelMesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] *= 10.0;
        positions[i + 1] *= 10.0;
        positions[i + 2] *= 10.0;
      }
      // 座標データを更新
      this.modelMesh.geometry.attributes.position.needsUpdate = true;

      this._addParticlesSurface(this.modelMesh, 'shape02');

    });
  }

  _addParticlesSurface(mesh, shapeName) {
    const particleSurfaceMaterial = new THREE.PointsMaterial({
      color: 'red',
      size: 0.6
    })

    const sampler = new MeshSurfaceSampler(mesh).build()
    const particleSurfaceGeometry = new THREE.BufferGeometry()
    const particlesPosition = new Float32Array(this.countParticle * 3)

    for(let i = 0; i < this.countParticle; i++) {
      const newPosition = new THREE.Vector3()
      sampler.sample(newPosition)
      particlesPosition.set([
        newPosition.x, // 0 - 3
        newPosition.y, // 1 - 4
        newPosition.z // 2 - 5
      ], i * 3)
    }

    particleSurfaceGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPosition, 3))

    const particleSurfaceMesh = new THREE.Points(particleSurfaceGeometry, particleSurfaceMaterial)

    // console.log(particleSurfaceMesh);

    // this.scene.add(this.particlesMesh);
    this.targetPositions[shapeName] = [...particleSurfaceGeometry.attributes.position.array];
  }

  _init() {
    this._setCamera();

    this._addModel();
  }

  _update() {
    // this.particlesMesh.rotation.y += 0.0005;
    // this.particlesMesh.rotation.x += 0.005;

    this.stats.update();

    this.partcle.onUpdate();
    this.partcle2.onUpdate();

    //レンダリング
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._update.bind(this));
  }

  _onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    // レンダラーのサイズを修正
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    // カメラのアスペクト比を修正
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));
  }
}

new Main();



