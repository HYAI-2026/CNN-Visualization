import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type * as tf from '@tensorflow/tfjs';

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private connectionGroup: THREE.Group;
    private animationId: number = 0;
    
    // 시각화 설정 상수
    private readonly LAYER_GAP = 60;
    private readonly IMG_SCALE = 0.75;
    
    private inputTexture: THREE.DataTexture | null = null;
    private inputDisplayMesh: THREE.Mesh | null = null;

    constructor(container: HTMLElement) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        // 1. Scene & Camera
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.FogExp2(0x050505, 0.0012);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
        this.camera.position.set(-250, 120, 300);

        // 2. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        // 3. Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;

        // 4. Utils
        this.connectionGroup = new THREE.Group();
        this.scene.add(this.connectionGroup);

        const gridHelper = new THREE.GridHelper(2000, 100, 0x222222, 0x080808);
        gridHelper.position.y = -50;
        this.scene.add(gridHelper);

        this.animate();
    }

    // 모델 구조를 받아 3D 객체 생성
    setupModelVisuals(model: tf.LayersModel) {
        let currentX = 0;
        let prevLayerGroup: THREE.Group | null = null;

        model.layers.forEach((layer, i) => {
            const outputShape = layer.outputShape as any;
            const type = layer.getClassName();
            const name = layer.name;

            if (!outputShape) return;

            const layerGroup = new THREE.Group();
            layerGroup.name = name;
            layerGroup.userData = { type, shape: outputShape, index: i };

            if (type.includes('Conv') || type.includes('Pool') || type.includes('Input')) {
                const h = (outputShape[1] || 1) * this.IMG_SCALE;
                const w = (outputShape[2] || 1) * this.IMG_SCALE;
                const depth = outputShape[3] || 1;

                this.buildFeatureMaps(layerGroup, w, h, depth, type);
                if (type.includes('Input')) this.createInputTextureDisplay(layerGroup, w, h);
            } else if (type.includes('Dense')) {
                const units = outputShape[1] || 10;
                const isLastLayer = i === model.layers.length - 1;
                this.buildDenseUnits(layerGroup, units, isLastLayer);
            } else if (type.includes('Flatten')) {
                return;
            }

            layerGroup.position.set(currentX, 0, 0);
            this.scene.add(layerGroup);

            if (prevLayerGroup) {
                this.buildConnections(prevLayerGroup, layerGroup);
            }

            prevLayerGroup = layerGroup;

            if (type.includes('Input')) currentX += this.LAYER_GAP;
            else if (type.includes('Dense')) currentX += this.LAYER_GAP * 1.5;
            else currentX += this.LAYER_GAP;
        });

        // 위치 보정
        const totalWidth = currentX - this.LAYER_GAP;
        this.scene.position.set(-totalWidth / 2 + 60, -35, 0);
    }

    // 실시간 업데이트 (ModelHandler에서 받은 데이터로 갱신)
    updateVisuals(activations: tf.Tensor[], inputTensor: tf.Tensor, modelLayers: tf.LayersModel['layers']) {
        // 1. 입력 텍스처 업데이트
        this.updateInputLayerTexture(inputTensor);

        // 2. 각 레이어 시각화 업데이트
        modelLayers.forEach((layer, i) => {
            const output = activations[i];
            const layerGroup = this.scene.getObjectByName(layer.name) as THREE.Group;
            if (!layerGroup) return;

            const values = output.dataSync(); // 동기 처리가 렉 걸리면 비동기로 변경 고려
            this.updateLayerObjects(layerGroup, values);

            if (i > 0) {
                const prevLayerName = modelLayers[i - 1].name;
                const prevOutput = activations[i - 1];
                const prevValues = prevOutput.dataSync();
                this.updateConnectionLines(prevLayerName, layerGroup.name, prevValues);
            }
        });
    }
    
    // --- 내부 헬퍼 함수들 (기존 코드 이식) ---

    private buildFeatureMaps(group: THREE.Group, w: number, h: number, count: number, type: string) {
        const geometry = new THREE.BoxGeometry(w * 0.9, h * 0.9, 0.2);
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const color = this.getBaseColor(type);

        for (let i = 0; i < count; i++) {
            const material = new THREE.MeshPhysicalMaterial({
                color: color, transparent: true, opacity: 0.1,
                emissive: color, emissiveIntensity: 0,
                roughness: 0.1, metalness: 0.1, //transmission: 0.2, 
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            const zPos = (i - count / 2) * 5;
            mesh.position.set(0, 0, zPos);
            mesh.userData = { channelIndex: i };
            group.add(mesh);

            const lineMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.3 });
            const edges = new THREE.LineSegments(edgeGeometry, lineMat);
            edges.position.set(0, 0, zPos);
            group.add(edges);
        }
    }

    private buildDenseUnits(group: THREE.Group, count: number, isLastLayer: boolean) {
        const size = isLastLayer ? 3.5 : 2.5;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const baseColor = isLastLayer ? 0xff0000 : 0x880000;
        const cols = Math.ceil(Math.sqrt(count));

        for (let i = 0; i < count; i++) {
            const material = new THREE.MeshPhysicalMaterial({
                color: baseColor, transparent: true, opacity: 0.2,
                emissive: baseColor, emissiveIntensity: 0,
                roughness: 0.1, metalness: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            let x = 0, y = 0, z = 0;
            if (isLastLayer) {
                y = (i - (count - 1) / 2) * 4.5;
            } else {
                const col = i % cols;
                const row = Math.floor(i / cols);
                y = (row - cols / 2) * 3.5;
                z = (col - cols / 2) * 3.5;
            }

            mesh.position.set(x, y, z);
            mesh.userData = { neuronIndex: i };
            group.add(mesh);

            const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0xff4444, opacity: 0.3, transparent: true }));
            edges.position.set(x, y, z);
            group.add(edges);
        }
    }

    private buildConnections(prevGroup: THREE.Group, currentGroup: THREE.Group) {
         const isInput = prevGroup.userData.type.includes('Input');
         const baseOpacity = isInput ? 0.05 : 0.06;
         const lineMat = new THREE.LineBasicMaterial({ 
             color: 0xaaddff, transparent: true, opacity: baseOpacity, blending: THREE.AdditiveBlending 
         });

         // (소스/타겟 매핑 로직은 기존 코드와 동일하여 축약 - 복붙할 때 기존 코드의 buildConnections 내부 로직 사용)
         // *공간 절약을 위해 핵심만 남김. 기존 코드 buildConnections 함수 내용을 여기에 넣으면 됨.*
         
         // [Tip] 기존 코드의 buildConnections 복사해서 여기에 넣고, 
         // connectionGroup.add(line) 할 때 this.connectionGroup.add(line)으로 변경 주의.
         
         // ... (기존 로직 동일) ...
         let sources: any[] = [];
         if(isInput && prevGroup.userData.pixelAnchors) {
             sources = prevGroup.userData.pixelAnchors.map((anchor: any, idx: number) => ({
                 pos: prevGroup.position.clone().add(anchor), index: idx
             }));
         } else {
             prevGroup.children.forEach((child: any) => {
                 if (child.isMesh && (child.userData.channelIndex !== undefined || child.userData.neuronIndex !== undefined)) {
                     sources.push({
                         pos: prevGroup.position.clone().add(child.position),
                         index: child.userData.channelIndex ?? child.userData.neuronIndex
                     });
                 }
             });
         }
         
         currentGroup.children.forEach((targetChild: any) => {
            if (!targetChild.isMesh || (targetChild.userData.channelIndex === undefined && targetChild.userData.neuronIndex === undefined)) return;
            const targetPos = currentGroup.position.clone().add(targetChild.position);

            sources.forEach(source => {
                const midPos = new THREE.Vector3().lerpVectors(source.pos, targetPos, 0.5);
                midPos.y += (Math.random() * 8) + 2;
                const curve = new THREE.CatmullRomCurve3([source.pos, midPos, targetPos]);
                const points = curve.getPoints(8);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMat.clone());
                line.userData = { 
                    fromLayer: prevGroup.name, toLayer: currentGroup.name, 
                    sourceIndex: source.index, isInputConn: isInput 
                };
                this.connectionGroup.add(line);
            });
         });
    }

    private updateLayerObjects(group: THREE.Group, values: Float32Array | Int32Array | Uint8Array) {
        // 기존 updateLayerVisuals 로직 이식
        const type = group.userData.type;
        const shape = group.userData.shape;
        
        // ... (기존 코드의 updateLayerVisuals 내부 로직 복사) ...
        // 단, mat.emissive.copy 등의 호출에서 this 컨텍스트 주의 (여기선 문제 없음)
        
        if (type.includes('Conv') || type.includes('Pool')) {
             const depth = shape[3];
             const numPixels = shape[1] * shape[2];
             group.children.forEach((child: any) => {
                 if (!child.isMesh || child.userData.channelIndex === undefined) return;
                 const idx = child.userData.channelIndex;
                 if(idx >= depth) return;
                 
                 let sum = 0;
                 for(let p=0; p<numPixels; p++) sum += values[p * depth + idx];
                 const avg = sum / numPixels;
                 const intensity = Math.max(0, avg);
                 const mat = child.material as THREE.MeshPhysicalMaterial;
                 mat.opacity = 0.15 + intensity * 0.85;
                 mat.emissiveIntensity = intensity * 2.5;
                 
                 const targetColor = new THREE.Color(this.getBaseColor(type));
                 if(intensity > 0.5) targetColor.lerp(new THREE.Color(0xffffff), (intensity - 0.5));
                 mat.emissive.copy(targetColor);
             });
        } else if (type.includes('Dense')) {
            // ... Dense 로직 동일 ...
             group.children.forEach((child: any) => {
                if(!child.isMesh || child.userData.neuronIndex === undefined) return;
                const idx = child.userData.neuronIndex;
                const val = values[idx];
                const mat = child.material as THREE.MeshPhysicalMaterial;
                const isOutput = group.children.length >= 10 * 2; // 대략적인 체크
                mat.opacity = 0.2 + val * 0.8;
                mat.emissiveIntensity = val * (isOutput ? 6 : 4);
                const targetColor = new THREE.Color(val > 0.1 ? (isOutput ? 0xFF0000 : 0x880000) : 0x220000);
                if(val > 0.7) targetColor.lerp(new THREE.Color(isOutput ? 0xffff00 : 0xffaa00), (val - 0.7) * 2);
                mat.emissive.copy(targetColor);
             });
        }
    }

    private updateConnectionLines(fromName: string, toName: string, sourceValues: any) {
        // 기존 updateConnections 로직 이식
        this.connectionGroup.children.forEach((line: any) => {
            if (line.userData.fromLayer !== fromName || line.userData.toLayer !== toName) return;
            const srcIdx = line.userData.sourceIndex;
            if (srcIdx === undefined || (sourceValues.length > 0 && srcIdx >= sourceValues.length)) return;

            let activation = sourceValues.length > 0 ? sourceValues[srcIdx] : 0;
            if (line.userData.isInputConn && activation > 1) activation /= 255;
            
            const intensity = Math.min(1, Math.max(0, activation));
            const mat = line.material as THREE.LineBasicMaterial;
            const isInput = line.userData.isInputConn;
            
            mat.opacity = (isInput ? 0.05 : 0.06) + intensity * (isInput ? 0.5 : 0.7);
            mat.color.setHSL(0.6 - intensity * 0.2, 1.0, 0.65 + intensity * 0.35);
        });
    }

    private createInputTextureDisplay(group: THREE.Group, w: number, h: number) {
        // 기존 createInputTextureDisplay 로직 이식
        const size = 28 * 28;
        const data = new Uint8Array(3 * size).fill(0);
        this.inputTexture = new THREE.DataTexture(data, 28, 28, THREE.RGBFormat);
        this.inputTexture.magFilter = THREE.NearestFilter;

        const material = new THREE.MeshPhysicalMaterial({
            map: this.inputTexture, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.2,
            emissive: 0xffffff, emissiveMap: this.inputTexture, emissiveIntensity: 0.5
        });
        const geometry = new THREE.PlaneGeometry(w, h);
        this.inputDisplayMesh = new THREE.Mesh(geometry, material);
        
        group.children.forEach(c => c.visible = false);
        group.add(this.inputDisplayMesh);
        
        const edges = new THREE.EdgesGeometry(geometry);
        group.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 })));

        // Pixel Anchors 생성
        const pixelAnchors: THREE.Vector3[] = [];
        const stepX = w / 28, stepY = h / 28;
        const startX = -w/2 + stepX/2, startY = h/2 - stepY/2;
        for(let y=0; y<28; y++) {
            for(let x=0; x<28; x++) {
                pixelAnchors.push(new THREE.Vector3(startX + x*stepX, startY - y*stepY, 0.1));
            }
        }
        group.userData.pixelAnchors = pixelAnchors;
    }

    private updateInputLayerTexture(tensor: any) {
        if (!this.inputTexture) return;
        const pixelData = tensor.squeeze().toInt().dataSync();
        const textureData = this.inputTexture.image.data;
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                const srcIdx = y * 28 + x;
                const targetRow = 27 - y;
                const targetIdx = targetRow * 28 + x;
                const val = pixelData[srcIdx];
                textureData[targetIdx * 3] = val;
                textureData[targetIdx * 3 + 1] = val;
                textureData[targetIdx * 3 + 2] = val;
            }
        }
        this.inputTexture.needsUpdate = true;
    }

    private getBaseColor(type: string) {
        return type.includes('Input') ? 0x888888 : type.includes('Pool') ? 0x0088ff : 0x00ff88;
    }

    public resize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public reset() {
        this.scene.traverse((obj: any) => {
            if (obj.isMesh && obj.material.emissive) {
                obj.material.opacity = 0.15;
                obj.material.emissiveIntensity = 0;
            }
            if (obj.isLine) {
                const isInput = obj.userData.isInputConn;
                obj.material.opacity = isInput ? 0.05 : 0.06;
                obj.material.color.set(0xaaddff);
            }
        });
        if(this.inputTexture) {
            this.inputTexture.image.data.fill(0);
            this.inputTexture.needsUpdate = true;
        }
    }

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    public dispose() {
        cancelAnimationFrame(this.animationId);
        this.renderer.dispose();
    }
}