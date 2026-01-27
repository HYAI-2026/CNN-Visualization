import * as tf from '@tensorflow/tfjs';
import { predictions, isModelLoaded } from '../stores/appStore';

export class ModelHandler {
    model: tf.LayersModel | null = null;
    activationModel: tf.LayersModel | null = null;

    async load() {
        try {
            this.model = await tf.loadLayersModel('/model/model.json');
            
            // 시각화를 위한 Activation 모델 생성
            const layerOutputs = this.model.layers.map(l => l.output as tf.SymbolicTensor);
            this.activationModel = tf.model({ inputs: this.model.inputs, outputs: layerOutputs });

            console.log("✅ 모델 로드 완료");
            isModelLoaded.set(true);
            return this.model; // SceneManager가 구조를 알아야 하니까 리턴
        } catch (err) {
            console.error("❌ 모델 로딩 실패:", err);
            return null;
        }
    }

    predict(canvas: HTMLCanvasElement) {
        if (!this.model || !this.activationModel) return null;

        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(canvas, 1);
            tensor = tf.image.resizeBilinear(tensor, [28, 28]);
            
            // 3D 시각화용 텍스처 업데이트를 위해 원본 텐서 데이터 추출 필요 시 여기서 처리
            // (SceneManager에서 처리하도록 설계 변경 가능하지만, 일단 텐서만 넘김)

            const inputTensor = tensor.toFloat().div(255.0).expandDims(0);
            
            // 각 레이어의 활성화 값(Activations) 추출
            const activations = this.activationModel!.predict(inputTensor) as tf.Tensor[];
            
            // 최종 예측값 Store 업데이트
            const finalLayer = activations[activations.length - 1];
            const probData = Array.from(finalLayer.dataSync());
            predictions.set(probData);

            return { activations, inputTensor: tensor };
        });
    }
}