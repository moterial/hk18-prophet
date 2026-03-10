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
  padding: 16px 24px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.header-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f0f6fc;
}

.subtitle {
  font-size: 0.9rem;
  color: #8b949e;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

a {
  color: #58a6ff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
