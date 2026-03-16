<template>
  <div id="app-root">
    <header class="app-header">
      <div class="header-content">
        <h1>🏠 HK18 Prophet</h1>
        <span class="subtitle">香港18區樓價預測引擎</span>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0f1117;
  color: #e1e4e8;
  min-height: 100vh;
}

#app-root {
  min-height: 100vh;
}

.app-header {
  background: #161b22;
  border-bottom: 1px solid #30363d;
  padding: 10px 20px;
  height: 58px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.header-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f0f6fc;
  white-space: nowrap;
}

.subtitle {
  font-size: 0.9rem;
  color: #8b949e;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .app-header {
    height: 48px;
    padding: 6px 12px;
  }
  .header-content h1 {
    font-size: 1.1rem;
  }
  .subtitle {
    font-size: 0.7rem;
  }
  .header-content {
    gap: 8px;
  }
}

@media (max-width: 380px) {
  .header-content h1 {
    font-size: 1rem;
  }
  .subtitle {
    display: none;
  }
}

main {
  margin: 0;
  padding: 0;
}

a {
  color: #58a6ff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
