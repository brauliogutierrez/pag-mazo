/**
 * ===================================================================
 * ARCHIVO: script.js
 * PROYECTO: IES Villa de Mazo – Portal Educativo
 * DESCRIPCIÓN: Lógica de interactividad del sitio web.
 *
 * FUNCIONALIDADES:
 *   1. Menú hamburguesa (mostrar/ocultar menú en móvil)
 *   2. Filtro dinámico de noticias (búsqueda de texto + categorías)
 *   3. Modo Oscuro / Claro (persistido en localStorage)
 *   4. Cerrar el menú al hacer clic en un enlace (UX en móvil)
 *
 * CONCEPTOS CLAVE DE JS USADOS:
 *   - document.getElementById / querySelector: seleccionar elementos del DOM
 *   - addEventListener: escuchar eventos (clic, escritura...)
 *   - classList.toggle / add / remove: manipular clases CSS desde JS
 *   - localStorage: guardar preferencias del usuario en el navegador
 *   - Array.from + forEach: iterar sobre colecciones de elementos
 *   - dataset: leer atributos data-* del HTML
 * ===================================================================
 */


// ─────────────────────────────────────────────────────────────────────────────
// PASO 1: ESPERAR A QUE EL DOM ESTÉ COMPLETAMENTE CARGADO
//
// 'DOMContentLoaded' se dispara cuando el navegador ha terminado de leer
// y parsear el HTML. Envolvemos todo el código en este evento para asegurarnos
// de que los elementos ya existen cuando intentamos seleccionarlos.
// Si no lo hiciéramos, document.getElementById devolvería null.
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // ───────────────────────────────────────────────────────────────────────────
  // SELECCIÓN DE ELEMENTOS DEL DOM
  // Guardamos las referencias en constantes para no tener que buscarlas
  // repetidamente en cada función (mejora el rendimiento y legibilidad).
  // ───────────────────────────────────────────────────────────────────────────

  const hamburgerBtn  = document.getElementById('hamburgerBtn');   // Botón hamburguesa
  const mainNav       = document.getElementById('mainNav');         // <nav> principal
  const searchInput   = document.getElementById('searchInput');     // Input de búsqueda
  const newsGrid      = document.getElementById('newsGrid');        // Contenedor de tarjetas
  const noResults     = document.getElementById('noResults');       // Mensaje sin resultados
  const body          = document.body;                              // <body>

  // NodeList → Array de todos los botones de categoría
  // querySelectorAll devuelve un NodeList; lo convertimos a Array para usar .forEach
  const filterBtns    = Array.from(document.querySelectorAll('.filter-btn'));

  // NodeList → Array de todas las tarjetas de noticias
  const newsCards     = Array.from(document.querySelectorAll('.news-card'));

  // Variable de estado: almacena la categoría activa actual
  // Al inicio es 'todos' (mostrar todas las tarjetas)
  let activeCategory = 'todos';


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 1: MENÚ HAMBURGUESA
  //
  // Al hacer clic en el botón hamburguesa:
  //   - Se añade/quita la clase 'is-active' al botón (anima el icono → X)
  //   - Se añade/quita la clase 'nav-open' al <nav> (despliega/colapsa el menú)
  //   - Se actualiza aria-expanded para accesibilidad
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Función: toggleMenu
   * Alterna el estado abierto/cerrado del menú de navegación en móvil.
   * classList.toggle(clase) añade la clase si no existe, la quita si existe.
   */
  function toggleMenu() {
    // Alterna la clase 'is-active' en el botón (cambia ☰ a X visualmente)
    hamburgerBtn.classList.toggle('is-active');

    // Alterna la clase 'nav-open' en el <nav>
    // El CSS usa max-height para animar la apertura/cierre del menú
    mainNav.classList.toggle('nav-open');

    // Determinamos si el menú está ahora abierto o cerrado
    const isOpen = mainNav.classList.contains('nav-open');

    // Actualizamos el atributo aria-expanded (buena práctica de accesibilidad)
    // Los lectores de pantalla usarán este valor para informar al usuario
    hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  // Registramos el evento 'click' en el botón hamburguesa
  hamburgerBtn.addEventListener('click', toggleMenu);


  // ─────────────────────────────────────────────────────────────────────────
  // FUNCIONALIDAD 1b: CERRAR MENÚ AL HACER CLIC EN UN ENLACE
  //
  // En móvil, al pulsar un enlace del menú, queremos que el menú se cierre
  // automáticamente (mejor experiencia de usuario).
  // ─────────────────────────────────────────────────────────────────────────

  // Obtenemos todos los enlaces del menú de navegación
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      // Solo cerramos si el menú está abierto (tiene la clase 'nav-open')
      if (mainNav.classList.contains('nav-open')) {
        // Eliminamos las clases de "abierto" del nav y del botón
        mainNav.classList.remove('nav-open');
        hamburgerBtn.classList.remove('is-active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 2: FILTRO DINÁMICO DE NOTICIAS
  //
  // El filtrado funciona con dos mecanismos combinados:
  //   a) Búsqueda de texto: compara lo que escribe el usuario con el
  //      atributo data-title de cada tarjeta.
  //   b) Categoría activa: compara el data-category de la tarjeta con
  //      la categoría seleccionada.
  //
  // Una tarjeta es visible SOLO si pasa AMBOS filtros a la vez.
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Función: applyFilters
   * Evalúa qué tarjetas deben mostrarse según el texto buscado y la
   * categoría seleccionada. Se llama cada vez que cambia el input o
   * se pulsa un botón de categoría.
   */
  function applyFilters() {
    if (!searchInput) return;
    // Obtenemos el texto buscado: lo convertimos a minúsculas para comparar
    // .trim() elimina espacios en blanco al inicio y al final
    const searchText = searchInput.value.trim().toLowerCase();

    // Contador de tarjetas visibles (para saber si mostrar el mensaje "sin resultados")
    let visibleCount = 0;

    // Iteramos sobre cada tarjeta y decidimos si mostrarla u ocultarla
    newsCards.forEach(function (card) {

      // 1. Leemos el atributo data-title del HTML y lo pasamos a minúsculas
      //    data-title fue definido en el HTML: data-title="jornada de puertas abiertas"
      const cardTitle    = card.dataset.title.toLowerCase();

      // 2. Leemos la categoría de la tarjeta (ej: "eventos", "actividades")
      const cardCategory = card.dataset.category;

      // 3. Verificamos si la tarjeta pasa el filtro de texto
      //    .includes() devuelve true si searchText está contenido en cardTitle
      //    Si el input está vacío, searchText es "" y "" está incluido en todo → true
      const matchesText     = cardTitle.includes(searchText);

      // 4. Verificamos si la tarjeta pasa el filtro de categoría
      //    Si activeCategory es 'todos', todas las tarjetas pasan
      const matchesCategory = (activeCategory === 'todos') || (cardCategory === activeCategory);

      // 5. La tarjeta es visible si pasa AMBOS filtros (AND lógico)
      if (matchesText && matchesCategory) {
        // Quitamos la clase 'hidden' → la tarjeta aparece (display: flex en CSS)
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        // Añadimos la clase 'hidden' → la tarjeta desaparece (display: none en CSS)
        card.classList.add('hidden');
      }
    });

    // 6. Mostramos u ocultamos el mensaje "sin resultados"
    if (noResults) {
      if (visibleCount === 0) {
        // Ninguna tarjeta visible: mostramos el mensaje de aviso
        noResults.style.display = 'block';
      } else {
        // Al menos una tarjeta visible: ocultamos el mensaje
        noResults.style.display = 'none';
      }
    }
  }


  // ─────────────────────────────────────────────────────────────────────────
  // EVENTO: Buscador de texto (input en tiempo real)
  //
  // 'input' se dispara cada vez que cambia el contenido del campo de texto,
  // incluyendo escritura, borrado, pegar con Ctrl+V, etc.
  // Es más inmediato que 'keyup' (que solo se dispara al soltar tecla).
  // ─────────────────────────────────────────────────────────────────────────
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      applyFilters(); // Actualizamos los filtros con cada pulsación
    });
  }


  // ─────────────────────────────────────────────────────────────────────────
  // EVENTO: Botones de categoría
  //
  // Al hacer clic en cualquier botón de categoría:
  //   1. Actualizamos activeCategory con el data-category del botón pulsado
  //   2. Actualizamos visualmente el botón activo (clase CSS 'active')
  //   3. Aplicamos los filtros
  // ─────────────────────────────────────────────────────────────────────────
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {

      // 1. Guardamos la nueva categoría activa desde el atributo data-category
      //    del botón que fue pulsado (ej: "eventos", "actividades", "todos")
      activeCategory = btn.dataset.category;

      // 2. Actualizamos los estilos de los botones:
      //    Primero quitamos 'active' de TODOS los botones...
      filterBtns.forEach(function (b) {
        b.classList.remove('active');
      });
      //    ...y luego añadimos 'active' solo al botón que fue pulsado
      btn.classList.add('active');

      // 3. También limpiamos el campo de búsqueda al cambiar de categoría
      //    (opcional: mejora la UX evitando filtros cruzados confusos)
      searchInput.value = '';

      // 4. Aplicamos los filtros con la nueva configuración
      applyFilters();
    });
  });




  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 4: HEADER SCROLL – Efecto de elevación al hacer scroll
  //
  // Al desplazarse, añadimos una clase al header para darle más sombra y
  // reducir ligeramente su padding, creando un efecto de "compresión" elegante.
  // ═══════════════════════════════════════════════════════════════════════════

  const siteHeader = document.getElementById('site-header');

  /**
   * Función: handleScroll
   * Se llama cada vez que el usuario hace scroll en la página.
   * window.scrollY devuelve los píxeles desplazados desde el tope.
   */
  function handleScroll() {
    if (window.scrollY > 10) {
      // Si scrollamos más de 10px, añadimos la clase para la sombra extra
      siteHeader.classList.add('scrolled');
    } else {
      // Volvemos al estado original al subir al tope
      siteHeader.classList.remove('scrolled');
    }
  }

  // Registramos el evento de scroll en la ventana
  // 'scroll' se dispara continuamente mientras el usuario desplaza la página
  window.addEventListener('scroll', handleScroll);


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONALIDAD 5: ANIMACIÓN DE APARICIÓN DE TARJETAS (Intersection Observer)
  //
  // IntersectionObserver es una API moderna que detecta cuando un elemento
  // entra en el área visible de la pantalla (viewport).
  // Lo usamos para animar las tarjetas cuando el usuario hace scroll hasta ellas,
  // creando un efecto de aparición suave (fade-in + slide-up).
  // ═══════════════════════════════════════════════════════════════════════════

  // Configuración del observer
  const observerOptions = {
    threshold: 0.1,     // Dispara cuando el 10% del elemento es visible
    rootMargin: '0px 0px -40px 0px'  // Activa 40px antes de que el elemento sea visible
  };

  /**
   * Callback del IntersectionObserver.
   * Se llama con un array de "entries" (elementos observados).
   * @param {IntersectionObserverEntry[]} entries
   */
  function onCardVisible(entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // El elemento entró en el viewport: añadimos la clase de animación
        entry.target.classList.add('card-visible');

        // Dejamos de observar este elemento (ya se animó, no necesitamos seguir)
        cardObserver.unobserve(entry.target);
      }
    });
  }

  // Creamos el observer con la callback y las opciones
  const cardObserver = new IntersectionObserver(onCardVisible, observerOptions);

  // Observamos cada tarjeta de noticias y cada widget del sidebar
  const animatedElements = document.querySelectorAll('.news-card, .widget');
  animatedElements.forEach(function (el) {
    // Añadimos clase inicial (invisible, desplazada hacia abajo) definida en CSS
    el.classList.add('card-hidden');
    // Registramos el elemento para ser observado
    cardObserver.observe(el);
  });


  // ─────────────────────────────────────────────────────────────────────────
  // NOTA FINAL: Las animaciones de aparición (card-hidden y card-visible)
  // requieren añadir estas reglas al CSS (las incluimos aquí como inyección
  // dinámica para no modificar el styles.css principal):
  // ─────────────────────────────────────────────────────────────────────────

  // Inyectamos los estilos de animación directamente desde JS
  // Esto nos permite tener toda la lógica de animación en un solo lugar
  const animationStyles = document.createElement('style');
  animationStyles.textContent = `
    /* Estado inicial: elemento invisible y desplazado */
    .card-hidden {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    /* Estado final: elemento visible en su posición */
    .card-visible {
      opacity: 1;
      transform: translateY(0);
    }
    /* Elevación del header al hacer scroll */
    .site-header.scrolled {
      box-shadow: 0 4px 24px rgba(0,0,0,.18);
    }
  `;
  // Añadimos el bloque de estilos al <head> del documento
  document.head.appendChild(animationStyles);


  // ─────────────────────────────────────────────────────────────────────────
  // LOG DE INICIO (para depuración)
  // console.log es útil durante el desarrollo para verificar que el script
  // se ejecutó correctamente. En producción se suele eliminar.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('✅ IES Villa de Mazo – script.js cargado correctamente.');
  console.log('📌 Funcionalidades activas: Hamburguesa | Filtros | Animaciones');

}); // Fin de DOMContentLoaded
