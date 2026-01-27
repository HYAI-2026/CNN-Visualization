<script lang="ts">
    // 이미지 로드 에러 핸들러 (타입 명시)
    function handleImgError(e: Event) {
        const img = e.currentTarget as HTMLImageElement;
        img.style.display = 'none';
    }
</script>

<div class="logo-panel">
    <span class="powered-by">POWERED BY</span>
    <div class="logo-container">
        <span class="logo-text">HYAI</span>
        <img src="/hyai_logo.png" alt="HYAI" class="logo-img" 
             on:error={handleImgError} />
    </div>
</div>

<style>
    /* ... 기존 CSS 그대로 ... */
    .logo-panel {
        position: absolute;
        bottom: 30px;
        left: 30px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        opacity: 0.9;
        user-select: none;
    }
    .powered-by {
        font-size: 1rem;
        color: #888;
        letter-spacing: 1.5px;
        margin-bottom: -5px;
        line-height: 1;
    }
    .logo-container {
        display: flex;
        align-items: center;
    }
    .logo-img {
        height: 55px;
        margin-left: 5px;
    }
    .logo-text {
        font-family: 'Arial Black', sans-serif;
        font-size: 2.4rem;
        color: #fff;
        letter-spacing: 2px;
        line-height: 1;
    }
</style>