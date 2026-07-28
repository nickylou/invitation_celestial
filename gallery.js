(() => {
  const MANIFEST_URL = "assets/gallery/gallery.json";
  const BASE = "assets/gallery/";
  const grid = document.getElementById("gallery-grid");
  const status = document.getElementById("gallery-status");
  const lightbox = document.getElementById("gallery-lightbox");
  if (!grid || !lightbox) return;

  const image = document.getElementById("gallery-lightbox-image");
  const caption = document.getElementById("gallery-lightbox-caption");
  const counter = document.getElementById("gallery-lightbox-counter");
  const spinner = document.getElementById("gallery-spinner");
  const filmstrip = document.getElementById("gallery-filmstrip");
  const prev = lightbox.querySelector(".gallery-lightbox-prev");
  const next = lightbox.querySelector(".gallery-lightbox-next");
  let photos = [], index = 0, lastTrigger = null;
  let startX = 0, startY = 0, scale = 1, panX = 0, panY = 0, dragging = false;

  const resolve = p => /^(https?:|data:|\/)/.test(p) ? p : BASE + p.replace(/^\.\//, "");
  const title = p => p.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  function normalise(entry, i) {
    if (typeof entry === "string") entry = { full: entry, thumb: entry };
    if (!entry || !(entry.full || entry.file)) return null;
    const full = entry.full || entry.file;
    return { full: resolve(full), thumb: resolve(entry.thumb || full), caption: String(entry.caption || ""), alt: String(entry.alt || `Wedding photograph ${i + 1}: ${title(full)}`), width: Number(entry.width)||0, height: Number(entry.height)||0 };
  }

  function skeleton(item, i) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "gallery-card is-loading";
    button.setAttribute("aria-label", `Open photo ${i + 1}`);
    if (item.width && item.height) button.style.aspectRatio = `${item.width}/${item.height}`;
    const img = document.createElement("img");
    img.alt = item.alt; img.loading = "lazy"; img.decoding = "async";
    img.dataset.src = item.thumb;
    img.addEventListener("load", () => button.classList.remove("is-loading"), {once:true});
    img.addEventListener("error", () => button.classList.add("is-error"), {once:true});
    button.append(img); button.addEventListener("click", () => open(i, button));
    return button;
  }

  const lazyObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return; const img=e.target; img.src=img.dataset.src; delete img.dataset.src; lazyObserver.unobserve(img);
  }), {rootMargin:"500px 0px"}) : null;

  async function load() {
    try {
      const response = await fetch(MANIFEST_URL, {cache:"no-cache"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const entries = Array.isArray(json) ? json : json.images;
      photos = entries.map(normalise).filter(Boolean);
      const fragment=document.createDocumentFragment();
      photos.forEach((p,i)=>fragment.append(skeleton(p,i))); grid.replaceChildren(fragment);
      grid.querySelectorAll("img[data-src]").forEach(img => lazyObserver ? lazyObserver.observe(img) : (img.src=img.dataset.src));
      status.textContent = photos.length ? `${photos.length} moments in our gallery.` : "More moments will be added soon.";
      buildFilmstrip();
    } catch (error) {
      console.error("Gallery manifest failed:", error);
      status.className="gallery-status is-error";
      status.innerHTML="<span aria-hidden='true'>✨</span><br>Our gallery is currently unavailable.<br><small>Please refresh in a moment.</small>";
    }
  }

  function buildFilmstrip(){
    const fragment=document.createDocumentFragment();
    photos.forEach((p,i)=>{const b=document.createElement("button");b.type="button";b.className="filmstrip-item";b.setAttribute("aria-label",`View photo ${i+1}`);const im=document.createElement("img");im.src=p.thumb;im.alt="";im.loading="lazy";b.append(im);b.addEventListener("click",()=>show(i));fragment.append(b);});filmstrip.replaceChildren(fragment);
  }
  function resetTransform(){scale=1;panX=panY=0;applyTransform();}
  function applyTransform(){image.style.transform=`translate3d(${panX}px,${panY}px,0) scale(${scale})`;}
  function preload(i){[-1,1].forEach(d=>{const p=photos[(i+d+photos.length)%photos.length];if(p){const im=new Image();im.src=p.full;}});}
  function show(i){
    index=(i+photos.length)%photos.length; const p=photos[index]; if(!p)return;
    resetTransform(); spinner.classList.add("is-active"); image.classList.add("is-loading");
    const loader=new Image(); loader.decoding="async"; loader.onload=()=>{image.src=p.full;image.alt=p.alt;image.classList.remove("is-loading");spinner.classList.remove("is-active");}; loader.onerror=()=>{spinner.classList.remove("is-active");image.classList.remove("is-loading");}; loader.src=p.full;
    caption.textContent=p.caption; caption.hidden=!p.caption; counter.textContent=`${index+1} / ${photos.length}`;
    filmstrip.querySelectorAll(".filmstrip-item").forEach((el,j)=>el.classList.toggle("is-active",j===index));
    filmstrip.querySelector(".is-active")?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"}); preload(index);
  }
  function open(i,trigger){lastTrigger=trigger;show(i);lightbox.classList.add("is-open");lightbox.setAttribute("aria-hidden","false");document.body.classList.add("lightbox-open");lightbox.querySelector(".gallery-lightbox-close")?.focus();}
  function close(){lightbox.classList.remove("is-open");lightbox.setAttribute("aria-hidden","true");document.body.classList.remove("lightbox-open");resetTransform();lastTrigger?.focus();}
  const move=d=>show(index+d);

  lightbox.querySelectorAll("[data-gallery-close]").forEach(el=>el.addEventListener("click",close)); prev.addEventListener("click",()=>move(-1)); next.addEventListener("click",()=>move(1));
  document.addEventListener("keydown",e=>{if(!lightbox.classList.contains("is-open"))return;if(e.key==="Escape")close();if(e.key==="ArrowLeft")move(-1);if(e.key==="ArrowRight")move(1);if(e.key==="Home")show(0);if(e.key==="End")show(photos.length-1);});
  lightbox.addEventListener("touchstart",e=>{if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY;}},{passive:true});
  lightbox.addEventListener("touchend",e=>{if(scale>1)return;const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);},{passive:true});
  image.addEventListener("dblclick",()=>{scale=scale===1?2:1;panX=panY=0;applyTransform();});
  image.addEventListener("wheel",e=>{if(!lightbox.classList.contains("is-open"))return;e.preventDefault();scale=Math.min(4,Math.max(1,scale+(e.deltaY<0?.25:-.25)));if(scale===1)panX=panY=0;applyTransform();},{passive:false});
  image.addEventListener("pointerdown",e=>{if(scale<=1)return;dragging=true;startX=e.clientX-panX;startY=e.clientY-panY;image.setPointerCapture(e.pointerId);});
  image.addEventListener("pointermove",e=>{if(!dragging)return;panX=e.clientX-startX;panY=e.clientY-startY;applyTransform();});
  image.addEventListener("pointerup",()=>dragging=false); image.addEventListener("pointercancel",()=>dragging=false);
  load();
})();
