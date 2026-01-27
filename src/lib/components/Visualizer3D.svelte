<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { SceneManager } from '../core/SceneManager';

    export let sceneManager: SceneManager | null = null;
    let container: HTMLDivElement;

    onMount(() => {
        sceneManager = new SceneManager(container);
        window.addEventListener('resize', onResize);
    });

    onDestroy(() => {
        window.removeEventListener('resize', onResize);
        if(sceneManager) sceneManager.dispose();
    });

    function onResize() {
        if(sceneManager && container) {
            sceneManager.resize(container.clientWidth, container.clientHeight);
        }
    }
</script>

<div class="three-container" bind:this={container}></div>

<style>
    .three-container { width: 100%; height: 100%; }
</style>