<script lang="ts">
    import { predictions } from '../stores/appStore';

    // 스토어($predictions)를 사용하므로 별도의 props나 로직 불필요
    // 가장 높은 확률의 인덱스(예측 숫자) 계산
    $: maxIndex = $predictions.indexOf(Math.max(...$predictions));
    $: hasPrediction = $predictions.some(p => p > 0);
</script>

<div class="ui-panel right-panel">
    <h3>Real-time Prediction</h3>
    <div class="chart-container">
        {#each $predictions as prob, i}
            <div class="bar-group">
                <div class="bar" style="height: {prob * 100}%; background: hsl({i * 36}, 100%, 50%);">
                    {#if prob > 0.05}
                        <span class="prob-text">{(prob * 100).toFixed(0)}%</span>
                    {/if}
                </div>
                <span class="digit-label">{i}</span>
            </div>
        {/each}
    </div>
    
    {#if hasPrediction}
        <h2 class="result-text">
            Prediction: {maxIndex}
        </h2>
    {/if}
</div>

<style>
    /* 기존 CSS 그대로 복사 */
    .ui-panel {
        position: absolute;
        background: rgba(30, 30, 30, 0.85);
        backdrop-filter: blur(12px);
        padding: 20px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #eee;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .right-panel { top: 40px; right: 40px; width: 300px; }
    h3 { margin: 0 0 15px 0; font-size: 1.1rem; color: #aaa; text-align: center; }

    .chart-container {
        display: flex;
        justify-content: space-between;
        height: 160px;
        align-items: flex-end;
        padding-top: 20px;
        border-bottom: 2px solid #555;
    }
    .bar-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 20px;
        height: 100%;
        justify-content: flex-end;
    }
    .bar {
        width: 100%;
        border-radius: 4px 4px 0 0;
        transition: height 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        min-height: 2px;
        box-shadow: 0 0 12px currentColor;
    }
    .prob-text {
        position: absolute;
        top: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.75rem;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 3px black;
    }
    .digit-label {
        margin-top: 8px;
        font-weight: bold;
        color: #aaa;
    }
    .result-text {
        text-align: center;
        margin-top: 15px;
        font-size: 1.8rem;
        color: #fff;
        font-weight: 800;
        text-shadow: 0 0 15px #00aaff;
    }
</style>