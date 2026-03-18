(function() {
  const siteId = document.currentScript.getAttribute('data-site-id');
  const apiUrl = window.location.origin;

  console.log('[SEO Engine] Client connected. Site ID:', siteId);

  // Send page info to the engine
  const reportPage = () => {
    const pageData = {
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      siteId: siteId
    };

    fetch(`${apiUrl}/api/js/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageData)
    }).catch(err => console.error('[SEO Engine] Ping failed:', err));
  };

  // Listen for optimizations from the engine
  const listenForOptimizations = () => {
    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/js/get-optimizations?siteId=${siteId}&url=${encodeURIComponent(window.location.href)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title) document.title = data.title;
          if (data.description) {
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
              meta = document.createElement('meta');
              meta.name = 'description';
              document.head.appendChild(meta);
            }
            meta.content = data.description;
          }
        }
      } catch (e) {}
    }, 5000);
  };

  reportPage();
  listenForOptimizations();
})();
