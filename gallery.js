(() => {
  const MANIFEST_URL = "assets/gallery/gallery.json";
  const BASE = "assets/gallery/";

  const status = document.getElementById("gallery-status");
  const slider = document.getElementById("gallery-slider");
  const slideButton = document.getElementById("gallery-slide-button");
  const slideImage = document.getElementById("gallery-slide-image");
  const slideCaption = document.getElementById("gallery-slide-caption");
  const slideCounter = document.getElementById("gallery-slide-counter");
  const slideSpinner = document.getElementById("gallery-slide-spinner");
  const inlineFilmstrip = document.getElementById("gallery-filmstrip-inline");
  const sliderPrev = document.getElementById("gallery-slider-prev");
  const sliderNext = document.getElementById("gallery-slider-next");

  const lightbox = document.getElementById("gallery-lightbox");
  const lightboxImage = document.getElementById("gallery-lightbox-image");
  const lightboxCaption = document.getElementById("gallery-lightbox-caption");
  const lightboxCounter = document.getElementById("gallery-lightbox-counter");
  const lightboxSpinner = document.getElementById("gallery-spinner");
  const lightboxFilmstrip = document.getElementById("gallery-filmstrip");
  const lightboxPrev = lightbox?.querySelector(".gallery-lightbox-prev");
  const lightboxNext = lightbox?.querySelector(".gallery-lightbox-next");

  if (!status || !slider || !slideButton || !slideImage || !inlineFilmstrip || !lightbox) return;

  let photos = [];
  let index = 0;
  let lastTrigger = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;

  const resolve = (path) =>
    /^(https?:|data:|\/)/.test(path)
      ? path
      : BASE + path.replace(/^\.\//, "");

  const title = (path) =>
    path
      .split("/")
      .pop()
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ");

  function normalise(entry, photoIndex) {
    if (typeof entry === "string") entry = { full: entry, thumb: entry };
    if (!entry || !(entry.full || entry.file)) return null;

    const full = entry.full || entry.file;
    return {
      full: resolve(full),
      thumb: resolve(entry.thumb || full),
      caption: String(entry.caption || ""),
      alt: String(
        entry.alt ||
        `Wedding photograph ${photoIndex + 1}: ${title(full)}`
      ),
      width: Number(entry.width) || 0,
      height: Number(entry.height) || 0
    };
  }

  function preloadAdjacent(currentIndex) {
    [-1, 1].forEach((offset) => {
      const photo = photos[(currentIndex + offset + photos.length) % photos.length];
      if (!photo) return;
      const preload = new Image();
      preload.decoding = "async";
      preload.src = photo.full;
    });
  }

  function updateFilmstripActive(container) {
    container?.querySelectorAll(".filmstrip-item").forEach((item, itemIndex) => {
      const active = itemIndex === index;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-current", active ? "true" : "false");
    });

    container
      ?.querySelector(".filmstrip-item.is-active")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function showSlide(newIndex, options = {}) {
    if (!photos.length) return;

    index = (newIndex + photos.length) % photos.length;
    const photo = photos[index];

    slideSpinner.classList.add("is-active");
    slideImage.classList.add("is-loading");

    const loader = new Image();
    loader.decoding = "async";
    loader.onload = () => {
      slideImage.src = photo.full;
      slideImage.alt = photo.alt;
      slideImage.classList.remove("is-loading");
      slideSpinner.classList.remove("is-active");
    };
    loader.onerror = () => {
      slideSpinner.classList.remove("is-active");
      slideImage.classList.remove("is-loading");
      status.textContent = "This photo could not be loaded.";
    };
    loader.src = photo.full;

    slideCaption.textContent = photo.caption;
    slideCaption.hidden = !photo.caption;
    slideCounter.textContent = `${index + 1} / ${photos.length}`;

    updateFilmstripActive(inlineFilmstrip);
    if (options.updateLightbox) updateLightboxContent();
    preloadAdjacent(index);
  }

  function buildFilmstrip(container, openInLightbox = false) {
    const fragment = document.createDocumentFragment();

    photos.forEach((photo, photoIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filmstrip-item";
      button.setAttribute("aria-label", `View photo ${photoIndex + 1}`);

      const img = document.createElement("img");
      img.src = photo.thumb;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";

      button.append(img);
      button.addEventListener("click", () => {
        showSlide(photoIndex);
        if (openInLightbox) updateLightboxContent();
      });

      fragment.append(button);
    });

    container.replaceChildren(fragment);
    updateFilmstripActive(container);
  }

  function moveSlide(direction) {
    showSlide(index + direction, {
      updateLightbox: lightbox.classList.contains("is-open")
    });
  }

  function handleSwipeEnd(event, callback) {
    if (!event.changedTouches?.length) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
      callback(deltaX < 0 ? 1 : -1);
    }
  }

  function resetTransform() {
    scale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  function applyTransform() {
    lightboxImage.style.transform =
      `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
  }

  function updateLightboxContent() {
    if (!photos.length) return;
    const photo = photos[index];

    resetTransform();
    lightboxSpinner.classList.add("is-active");
    lightboxImage.classList.add("is-loading");

    const loader = new Image();
    loader.decoding = "async";
    loader.onload = () => {
      lightboxImage.src = photo.full;
      lightboxImage.alt = photo.alt;
      lightboxImage.classList.remove("is-loading");
      lightboxSpinner.classList.remove("is-active");
    };
    loader.onerror = () => {
      lightboxSpinner.classList.remove("is-active");
      lightboxImage.classList.remove("is-loading");
    };
    loader.src = photo.full;

    lightboxCaption.textContent = photo.caption;
    lightboxCaption.hidden = !photo.caption;
    lightboxCounter.textContent = `${index + 1} / ${photos.length}`;
    updateFilmstripActive(lightboxFilmstrip);
    preloadAdjacent(index);
  }

  function openLightbox(trigger) {
    lastTrigger = trigger;
    updateLightboxContent();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    lightbox.querySelector(".gallery-lightbox-close")?.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    resetTransform();
    lastTrigger?.focus();
  }

  async function loadGallery() {
    try {
      const response = await fetch(MANIFEST_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = await response.json();
      const entries = Array.isArray(json) ? json : json.images;
      photos = entries.map(normalise).filter(Boolean);

      if (!photos.length) {
        status.hidden = false;
        status.textContent = "More moments will be added soon.";
        slider.hidden = true;
        inlineFilmstrip.hidden = true;
        return;
      }

      status.hidden = true;
      status.textContent = "";
      buildFilmstrip(inlineFilmstrip);
      buildFilmstrip(lightboxFilmstrip, true);
      showSlide(0);
    } catch (error) {
      console.error("Gallery manifest failed:", error);
      status.hidden = false;
      status.className = "gallery-status is-error";
      status.innerHTML =
        "<span aria-hidden='true'>✨</span><br>Our gallery is currently unavailable.<br><small>Please refresh in a moment.</small>";
      slider.hidden = true;
      inlineFilmstrip.hidden = true;
    }
  }

  sliderPrev.addEventListener("click", () => moveSlide(-1));
  sliderNext.addEventListener("click", () => moveSlide(1));
  slideButton.addEventListener("click", () => openLightbox(slideButton));

  slider.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  slider.addEventListener(
    "touchend",
    (event) => handleSwipeEnd(event, moveSlide),
    { passive: true }
  );

  lightbox.querySelectorAll("[data-gallery-close]").forEach((element) => {
    element.addEventListener("click", closeLightbox);
  });

  lightboxPrev?.addEventListener("click", () => moveSlide(-1));
  lightboxNext?.addEventListener("click", () => moveSlide(1));

  document.addEventListener("keydown", (event) => {
    if (lightbox.classList.contains("is-open")) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveSlide(-1);
      if (event.key === "ArrowRight") moveSlide(1);
      if (event.key === "Home") showSlide(0, { updateLightbox: true });
      if (event.key === "End") showSlide(photos.length - 1, { updateLightbox: true });
      return;
    }

    if (window.location.hash === "#gallery") {
      if (event.key === "ArrowLeft") moveSlide(-1);
      if (event.key === "ArrowRight") moveSlide(1);
    }
  });

  lightbox.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (event) => {
      if (scale > 1) return;
      handleSwipeEnd(event, moveSlide);
    },
    { passive: true }
  );

  lightboxImage.addEventListener("dblclick", () => {
    scale = scale === 1 ? 2 : 1;
    panX = 0;
    panY = 0;
    applyTransform();
  });

  lightboxImage.addEventListener(
    "wheel",
    (event) => {
      if (!lightbox.classList.contains("is-open")) return;
      event.preventDefault();
      scale = Math.min(4, Math.max(1, scale + (event.deltaY < 0 ? 0.25 : -0.25)));
      if (scale === 1) {
        panX = 0;
        panY = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  lightboxImage.addEventListener("pointerdown", (event) => {
    if (scale <= 1) return;
    dragging = true;
    touchStartX = event.clientX - panX;
    touchStartY = event.clientY - panY;
    lightboxImage.setPointerCapture(event.pointerId);
  });

  lightboxImage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    panX = event.clientX - touchStartX;
    panY = event.clientY - touchStartY;
    applyTransform();
  });

  lightboxImage.addEventListener("pointerup", () => {
    dragging = false;
  });

  lightboxImage.addEventListener("pointercancel", () => {
    dragging = false;
  });

  loadGallery();
})();