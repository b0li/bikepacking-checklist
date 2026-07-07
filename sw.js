const CACHE_NAME = 'bikepacking-v5';
const ASSETS = [
	'./',
	'./index.html',
	'./manifest.json',
	'./icon-192.png',
	'./icon-512.png',
];

// Install: cache all assets
self.addEventListener( 'install', ( e ) => {

	e.waitUntil(
		caches.open( CACHE_NAME ).then( ( cache ) => cache.addAll( ASSETS ) )
	);
	self.skipWaiting();

});

// Activate: clean old caches
self.addEventListener( 'activate', ( e ) => {

	e.waitUntil(
		caches.keys().then( ( keys ) => {
			return Promise.all(
				keys.filter( ( k ) => k !== CACHE_NAME ).map( ( k ) => caches.delete( k ) )
			);
		})
	);
	self.clients.claim();

});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener( 'fetch', ( e ) => {

	const isHtml = e.request.destination === 'document' ||
		e.request.url.endsWith( '.html' ) ||
		e.request.url.endsWith( '/' );

	if ( isHtml ) {

		// Always try network first so updates are picked up immediately
		e.respondWith(
			fetch( e.request ).then( ( response ) => {

				if ( response.status === 200 ) {

					const clone = response.clone();
					caches.open( CACHE_NAME ).then( ( cache ) => cache.put( e.request, clone ) );

				}

				return response;

			}).catch( () => {

				// Offline fallback: serve cached HTML
				return caches.match( e.request ) || caches.match( './index.html' );

			})
		);

	} else {

		// Cache-first for icons, manifest etc.
		e.respondWith(
			caches.match( e.request ).then( ( cached ) => {

				return cached || fetch( e.request ).then( ( response ) => {

					if ( response.status === 200 ) {

						const clone = response.clone();
						caches.open( CACHE_NAME ).then( ( cache ) => cache.put( e.request, clone ) );

					}

					return response;

				});

			}).catch( () => {
				return caches.match( './index.html' );
			})
		);

	}

});
