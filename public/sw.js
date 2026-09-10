/* Service worker de messagerie IngéGo.
   Il ne met rien en cache : son seul rôle est de recevoir les rappels
   de révision (Web Push) et d'ouvrir l'application au clic. */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let charge = {};
  try {
    charge = event.data ? event.data.json() : {};
  } catch {
    charge = { corps: event.data ? event.data.text() : "" };
  }

  const titre = charge.titre || "IngéGo";
  const options = {
    body: charge.corps || "Tes cartes t'attendent.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: charge.tag || "ingego-rappel",
    renotify: true,
    data: { url: charge.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(titre, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const fenetre of fenetres) {
        if (new URL(fenetre.url).origin === self.location.origin) {
          await fenetre.focus();
          if ("navigate" in fenetre) await fenetre.navigate(cible);
          return;
        }
      }
      await self.clients.openWindow(cible);
    })(),
  );
});
