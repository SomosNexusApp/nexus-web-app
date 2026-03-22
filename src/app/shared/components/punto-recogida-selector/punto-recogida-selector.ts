import { Component, EventEmitter, Output, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var L: any;

export interface PuntoRecogida {
  id: string;
  nombre: string;
  direccion: string;
  cp: string;
  ciudad: string;
  horario: string;
  distancia?: string;
  lat?: number;
  lng?: number;
}

@Component({
  selector: 'app-punto-recogida-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './punto-recogida-selector.html',
  styleUrl: './punto-recogida-selector.css'
})
export class PuntoRecogidaSelector implements AfterViewInit, OnDestroy {
  @Output() puntoSeleccionado = new EventEmitter<PuntoRecogida>();
  @Output() cerrar = new EventEmitter<void>();

  busqueda = signal('');
  buscando = signal(false);
  puntos = signal<PuntoRecogida[]>([]);
  puntoActivo = signal<PuntoRecogida | null>(null);

  private map: any;
  private markers: any[] = [];

  ngAfterViewInit() {
    this.cargarScriptsLeaflet().then(() => {
      this.initMap();
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private async cargarScriptsLeaflet(): Promise<void> {
    if ((window as any).L) return Promise.resolve();

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private initMap() {
    // Madrid center by default
    this.map = L.map('map-container', {
      attributionControl: false, // Quitar créditos abultados
      zoomControl: false // Los pondremos manuales o los dejamos por defecto
    }).setView([40.4168, -3.7038], 13);

    // Cambiamos a Voyager: más claro, vistoso y profesional
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(this.map);
    
    // Añadimos el control de zoom en una posición más discreta
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  private actualizarMarcadores(puntos: PuntoRecogida[]) {
    // Limpiar marcadores previos
    this.markers.forEach(m => m.remove());
    this.markers = [];

    puntos.forEach(p => {
      if (p.lat && p.lng) {
        const marker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-color:#6366f1; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);'></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        }).addTo(this.map);

        marker.bindPopup(`<b>${p.nombre}</b><br>${p.direccion}`);
        marker.on('click', () => {
          this.puntoActivo.set(p);
          this.map.setView([p.lat, p.lng], 16, { animate: true });
        });
        
        this.markers.push(marker);
      }
    });

    if (puntos.length > 0 && this.map) {
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }

  async buscarPuntos() {
    const query = this.busqueda().trim();
    if (!query) return;
    
    this.buscando.set(true);
    try {
      // Estrategia: Buscamos por "Oficina de Correos" y por "Correos"
      // Nominatim a veces prefiere una u otra dependiendo de cómo esté etiquetado en OSM
      const queries = [
        `Oficina de Correos ${query}`,
        `Correos ${query}`,
        `Post Office ${query}`
      ];
      
      let allResults: any[] = [];
      
      for (const q of queries) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=10&countrycodes=es`;
        const response = await fetch(url, {
          headers: { 'Accept-Language': 'es' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
          allResults = [...allResults, ...data];
        }
        // Si ya tenemos bastantes resultados, paramos
        if (allResults.length >= 5) break;
      }

      // Eliminar duplicados por place_id
      const uniqueResults = Array.from(new Map(allResults.map(item => [item.place_id, item])).values());

      const resultados: PuntoRecogida[] = uniqueResults.map((item: any, index: number) => {
        const addr = item.address;
        // Limpiamos el nombre para que no sea excesivamente largo
        let nombre = item.display_name.split(',')[0];
        if (!nombre.toLowerCase().includes('correos')) {
          nombre = `Correos - ${nombre}`;
        }
        
        const direccion = `${addr.road || ''} ${addr.house_number || ''}`.trim() || 
                         item.display_name.split(',').slice(1, 3).join(',').trim();
        
        return {
          id: `COR-${index}-${item.place_id}`,
          nombre: nombre,
          direccion: direccion,
          cp: addr.postcode || '',
          ciudad: addr.city || addr.town || addr.village || addr.municipality || query,
          horario: 'L-V: 08:30 - 14:30 (Aprox.)',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          distancia: 'Disponible'
        };
      });

      this.puntos.set(resultados);
      this.actualizarMarcadores(resultados);
      
      if (resultados.length === 0) {
        console.warn('No se encontraron oficinas para:', query);
      }
    } catch (error) {
      console.error('Error buscando puntos:', error);
    } finally {
      this.buscando.set(false);
    }
  }

  usarMiUbicacion() {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador.');
      return;
    }

    this.buscando.set(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (this.map) {
          this.map.setView([latitude, longitude], 14);
          
          // Buscamos puntos cerca de estas coordenadas con un radio de ~10km (0.1 grados aprox)
          try {
            const url = `https://nominatim.openstreetmap.org/search?q=Oficina+de+Correos&format=json&addressdetails=1&limit=8&viewbox=${longitude-0.1},${latitude+0.1},${longitude+0.1},${latitude-0.1}&bounded=1&countrycodes=es`;
            const response = await fetch(url, { headers: { 'Accept-Language': 'es' } });
            let data = await response.json();
            
            if (!data || data.length === 0) {
              // Fallback a "Correos" a secas
              const urlFallback = `https://nominatim.openstreetmap.org/search?q=Correos&format=json&addressdetails=1&limit=8&viewbox=${longitude-0.1},${latitude+0.1},${longitude+0.1},${latitude-0.1}&bounded=1&countrycodes=es`;
              const resFallback = await fetch(urlFallback);
              data = await resFallback.json();
            }

            const resultados = data.map((item: any, index: number) => {
              const addr = item.address;
              let nombre = item.display_name.split(',')[0];
              if (!nombre.toLowerCase().includes('correos')) nombre = `Correos - ${nombre}`;
              
              return {
                id: `GEO-${index}-${item.place_id}`,
                nombre: nombre,
                direccion: `${addr.road || ''} ${addr.house_number || ''}`.trim() || item.display_name.split(',').slice(1, 3).join(','),
                cp: addr.postcode || '',
                ciudad: addr.city || addr.town || addr.village || 'Tu zona',
                horario: 'L-V: 08:30 - 14:30',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                distancia: 'Cerca de ti'
              };
            });

            this.puntos.set(resultados);
            this.actualizarMarcadores(resultados);
            
            // Marcador de usuario
            L.circleMarker([latitude, longitude], {
              radius: 10,
              fillColor: "#10b981",
              color: "#fff",
              weight: 3,
              opacity: 1,
              fillOpacity: 0.9
            }).addTo(this.map).bindPopup("<b>Estás aquí</b>").openPopup();

          } catch (e) {
            console.error(e);
          }
        }
        this.buscando.set(false);
      },
      (err) => {
        console.error(err);
        alert('No se pudo obtener tu ubicación.');
        this.buscando.set(false);
      }
    );
  }

  seleccionar(punto: PuntoRecogida) {
    this.puntoSeleccionado.emit(punto);
  }
}
