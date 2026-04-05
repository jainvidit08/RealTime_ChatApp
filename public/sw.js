// Service Worker for managing Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'New Real-Time Chat Message';
  const options = {
    body: data.body || 'You have a new message.',
    icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041916.png', // Placeholder
    badge: 'https://cdn-icons-png.flaticon.com/512/1041/1041916.png',
    data: {
      url: data.url || '/chat'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Automatically redirect user to the app when notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // If a chat tab is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
