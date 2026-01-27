<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;
    
    let isDrawing = false;
    let lastX = 0, lastY = 0;
    let lastPredictTime = 0;

    onMount(() => {
        setupCanvas();
    });

    function setupCanvas() {
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        if(!ctx) return;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 25;
        ctx.lineCap = 'round';
    }

    function draw(e: MouseEvent) {
        if(!isDrawing || !ctx) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];

        const now = Date.now();
        if(now - lastPredictTime > 100) {
            dispatch('predictionRequest', canvas); // 부모에게 요청
            lastPredictTime = now;
        }
    }

    export function clear() {
        if(!ctx) return;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        dispatch('clearRequest'); // 초기화 요청
    }
</script>

<div class="ui-panel left-panel">
    <h3>Draw Digit (0-9)</h3>
    
    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
    <canvas 
        bind:this={canvas} width="200" height="200"
        on:mousedown={(e) => { isDrawing=true; [lastX, lastY]=[e.offsetX, e.offsetY]; }}
        on:mousemove={draw}
        on:mouseup={() => { isDrawing=false; dispatch('predictionRequest', canvas); }}
        on:mouseout={() => isDrawing=false}
    ></canvas>
    
    <button on:click={clear}>Clear Canvas</button>
</div>

<style>
    /* 기존 CSS 그대로 */
    .ui-panel {
        position: absolute; background: rgba(30, 30, 30, 0.85); backdrop-filter: blur(12px);
        padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15);
        color: #eee; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .left-panel { top: 40px; left: 40px; text-align: center; }
    h3 { margin: 0 0 15px 0; font-size: 1.1rem; color: #aaa; }
    canvas { background: black; border: 2px solid #444; border-radius: 8px; cursor: crosshair; margin-bottom: 15px; }
    button {
        width: 100%; padding: 12px; background: linear-gradient(45deg, #d32f2f, #ff5252);
        border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold;
    }
</style>