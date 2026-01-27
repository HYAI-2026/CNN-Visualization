<script lang="ts">
  import { onMount } from 'svelte';
  import { ModelHandler } from './lib/core/ModelHandler';
  import type { SceneManager } from './lib/core/SceneManager';
  
  import Visualizer3D from './lib/components/Visualizer3D.svelte';
  import DrawingBoard from './lib/components/DrawingBoard.svelte';
  import PredictionChart from './lib/components/PredictionChart.svelte';
  import LogoPanel from './lib/components/LogoPanel.svelte'; // 임포트 확인

  const modelHandler = new ModelHandler();
  let sceneManager: SceneManager | null = null;
  let drawingBoard: DrawingBoard; 

  onMount(async () => {
      const model = await modelHandler.load();
      if (model && sceneManager) {
          sceneManager.setupModelVisuals(model);
      }
  });

  function handlePrediction(e: CustomEvent<HTMLCanvasElement>) {
      if (!sceneManager) return;
      const result = modelHandler.predict(e.detail);
      
      if (result) {
          sceneManager.updateVisuals(result.activations, result.inputTensor, modelHandler.model!.layers);
      }
  }

  function handleClear() {
      if (sceneManager) sceneManager.reset();
  }
</script>

<main>
  <Visualizer3D bind:sceneManager />
  
  <DrawingBoard 
      bind:this={drawingBoard} 
      on:predictionRequest={handlePrediction}
      on:clearRequest={handleClear}
  />
  
  <PredictionChart />

  <LogoPanel />
</main>

<style>
  main { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #050505; }
</style>