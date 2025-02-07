// Versão do cache para atualizações
const CACHE_VERSION = 'v1.0.0';

// Instalação do Service Worker
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
});

// Gerenciamento de cliques nas notificações
self.addEventListener('notificationclick', function(event) {
    const notification = event.notification;
    const action = event.action;

    notification.close();

    if (action === 'close') {
        // Apenas fecha a notificação
        return;
    }

    // Se clicou na notificação ou no botão 'open'
    event.waitUntil(
        clients.matchAll({
            type: "window"
        })
        .then(function(clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow("/");
        })
    );
});

// Personalizar o comportamento quando a notificação é fechada
self.addEventListener('notificationclose', function(event) {
    const notification = event.notification;
    const data = notification.data;
    
    // Aqui podemos adicionar lógica adicional quando a notificação é fechada
    console.log('Notificação fechada:', data);
}); 
