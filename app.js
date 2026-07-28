const landing = document.getElementById("landing");
const world = document.getElementById("world");
const sky = document.getElementById("sky");

let hasEntered = false;
let currentSky = "skyOri";

const skies = {
  capricorn: "assets/sky-capricorn.jpg",
  libra: "assets/sky-libra.jpg",
  virgo: "assets/sky-virgo.jpg",
  scorpio: "assets/sky-scorpio.jpg",
  original: "assets/stars-original.png"
};

function transportToSky(type) {
  if (!skies[type] || currentSky === type) return;

  currentSky = type;
  sky.classList.add("transporting");

  setTimeout(() => {
    sky.style.backgroundImage = `url("${skies[type]}")`;
  }, 360);

  setTimeout(() => {
    sky.classList.remove("transporting");
  }, 520);
}

function enterInvitation() {
  if (hasEntered) return;
  hasEntered = true;

  const hero = document.querySelector(".hero-image");
  const ripple = document.querySelector(".hero-ripple");
  const cta = document.querySelector(".cta-layer");

  world.style.opacity = "1";
  preloadSkyBackgrounds();
  startMusicAfterEntry();

  if (cta) {
    cta.style.transition = "opacity .7s ease, transform .9s ease";
    cta.style.opacity = "0";
    cta.style.transform = "translateY(-8px)";
  }

  hero.style.animation = "none";
  hero.style.transition = "transform 3.2s cubic-bezier(.16,1,.3,1), filter 2.8s ease";
  hero.style.transform = "scale(1.06)";
  hero.style.filter = "brightness(1.05) blur(0.4px)";

  if (ripple) {
    ripple.style.transition = "opacity 2s ease";
    ripple.style.opacity = "0";
  }

  setTimeout(() => {
    landing.style.opacity = "0";
  }, 450);

  setTimeout(() => {
    landing.style.display = "none";
    document.body.style.overflow = "auto";
  }, 2700);
}

landing.addEventListener("click", enterInvitation);

document.getElementById("enterInvitation")?.addEventListener("click", (event) => {
  event.stopPropagation();
  enterInvitation();
});

document.querySelectorAll("[data-goto-sky]").forEach((button) => {
  button.addEventListener("click", () => {
    transportToSky(button.dataset.gotoSky);
  });
});

const sections = document.querySelectorAll("[data-sky]");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

const skyObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible && hasEntered) transportToSky(visible.target.dataset.sky);
}, { threshold: [0.35, 0.5, 0.7] });

sections.forEach((section) => {
  revealObserver.observe(section);
  skyObserver.observe(section);
});

const countdownEl = document.getElementById("countdown");
const weddingDate = new Date("2026-10-11T18:30:00+07:00");

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    countdownEl.innerHTML = `<p>Today is the day!</p>`;
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownEl.innerHTML = `
    <div class="count-item">
      <strong>${days}</strong>
      <span>Days</span>
    </div>
    <div class="count-item">
      <strong>${hours}</strong>
      <span>Hrs</span>
    </div>
    <div class="count-item">
      <strong>${minutes}</strong>
      <span>Mins</span>
    </div>
    <div class="count-item">
      <strong>${seconds}</strong>
      <span>Secs</span>
    </div>
  `;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Preload constellation backgrounds only after the invitation opens, and during idle time.
function preloadSkyBackgrounds() {
  const preload = () => Object.values(skies).forEach((src) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
  if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 2500 });
  else setTimeout(preload, 900);
}

// V4.2 configuration
const INVITATION_CONFIG = {
  rsvpCloseDate: "2026-10-04T23:59:59+07:00",
  musicVolume: 0.42,
  personalisedGreetingPrefix: "Dear"
};

const RSVP_WEB_APP_URL="https://script.google.com/macros/s/AKfycbxn-RdCTke-ymQErF0_-d8uNVlyEwpdRXhfKANc_Gsh95Ms-rc4HPiivc7g4DDx0nYmvA/exec";
const RSVP_SUBMITTED_KEY="celestialInviteRsvpSubmittedV1";
const rsvpClosedNotice=document.getElementById("rsvp-closed-notice");
const rsvpForm=document.getElementById("rsvp-form"),rsvpTitle=document.getElementById("rsvp-title"),rsvpStatus=document.getElementById("rsvp-status"),rsvpSubmit=document.getElementById("rsvp-submit"),messageBoard=document.getElementById("message-board"),messagesList=document.getElementById("messages-list"),messagesStatus=document.getElementById("messages-status"),guestbookCount=document.getElementById("guestbook-count"),refreshMessagesButton=document.getElementById("refresh-messages"),guestCountInput=document.getElementById("guestCount");

function isRsvpEndpointConfigured(){
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(RSVP_WEB_APP_URL);
}

function setRsvpStatus(message,type=""){
  if(!rsvpStatus)
    return;
  rsvpStatus.textContent=message;
  rsvpStatus.className=`rsvp-status${type?` is-${type}`:""}`;
}

function requestJsonp(params,timeoutMs=15000){
  return new Promise((resolve,reject)=>{
    if(!isRsvpEndpointConfigured()){
      reject(new Error("RSVP endpoint is not configured."));
      return;
    } 
    const callbackName=`celestialRsvpCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`,script=document.createElement("script");
    const timeout=setTimeout(()=>cleanup(new Error("The request timed out.")),timeoutMs);    
    function cleanup(error,data){
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      error?reject(error):resolve(data);
    }
    window[callbackName]=data=>cleanup(null,data);script.onerror=()=>cleanup(new Error("Could not reach the RSVP service."));
    const url=new URL(RSVP_WEB_APP_URL);Object.entries({...params,callback:callbackName,_:Date.now()}).forEach(([key,value])=>url.searchParams.set(key,String(value??"")));
    script.src=url.toString();document.body.appendChild(script);
  });
}

function updateGuestCountState(){
  const attendance=document.querySelector('input[name="attendance"]:checked')?.value;if(!guestCountInput)return;
  if(attendance==="decline"){
    guestCountInput.value="0";
    guestCountInput.min="0";
    guestCountInput.disabled=true;
  }
  else{
    guestCountInput.disabled=false;
    guestCountInput.min="1";
    if(!guestCountInput.value||Number(guestCountInput.value)<1)guestCountInput.value="1";
  }
}
document.querySelectorAll('input[name="attendance"]').forEach(radio=>radio.addEventListener("change",updateGuestCountState));

function isRsvpClosed(){
  const closeTime=Date.parse(INVITATION_CONFIG.rsvpCloseDate);
  return Number.isFinite(closeTime)&&Date.now()>closeTime;
}

function applyRsvpAvailability(){
  if(!isRsvpClosed())return false;
  if(rsvpClosedNotice)rsvpClosedNotice.hidden=false;
  showMessageBoard();
  return true;
}

function showMessageBoard(){
  if(rsvpForm)rsvpForm.hidden=true;
  if(messageBoard)messageBoard.hidden=false;
  if(rsvpTitle)rsvpTitle.textContent="Guestbook";loadMessages();
}

function createMessageElement(message){
  const attending=message.attendance==="accept";
  const article=document.createElement("article");
  article.className="message-item guestbook-card";

  const heading=document.createElement("div");
  heading.className="message-name";

  const guestIdentity=document.createElement("div");
  guestIdentity.className="guest-identity";
  const guestIcon=document.createElement("span");
  guestIcon.className="guestbook-icon";
  guestIcon.setAttribute("aria-hidden","true");
  guestIcon.textContent="👤";
  const guestName=document.createElement("span");
  guestName.className="guest-name-text";
  guestName.textContent=message.name||"Guest";
  guestIdentity.append(guestIcon,guestName);

  const badge=document.createElement("span");
  badge.className=`attendance-badge ${attending?"is-attending":"is-declining"}`;
  badge.textContent=attending?"✨ Will Attend":"✨ Unable to Attend";
  heading.append(guestIdentity,badge);

  const messageRow=document.createElement("div");
  messageRow.className="guest-message-row";
  const messageIcon=document.createElement("span");
  messageIcon.className="guestbook-icon message-icon";
  messageIcon.setAttribute("aria-hidden","true");
  messageIcon.textContent="💬";
  const text=document.createElement("div");
  text.className="message-text";
  const hasMessage=String(message.message||"").trim();
  text.textContent=hasMessage||"Wishing the couple all the best.";
  if(!hasMessage)text.classList.add("is-placeholder");
  messageRow.append(messageIcon,text);

  article.append(heading,messageRow);
  return article;
}
async function loadMessages(){
  if(!messagesList||!messagesStatus)return;messagesStatus.hidden=false;messagesStatus.textContent="Loading messages…";messagesList.replaceChildren();
  try{const response=await requestJsonp({action:"list",limit:100});if(!response?.ok)throw new Error(response?.error||"Could not load messages.");const messages=Array.isArray(response.messages)?response.messages:[];if(guestbookCount)guestbookCount.textContent=`${messages.length} ${messages.length===1?"wish":"wishes"} from our family and friends`;if(!messages.length){messagesStatus.textContent="No guest wishes have been posted yet.";return;}const fragment=document.createDocumentFragment();messages.forEach(message=>fragment.appendChild(createMessageElement(message)));messagesList.appendChild(fragment);messagesStatus.hidden=true;}
  catch(error){messagesStatus.textContent=error.message||"Unable to load messages right now.";}
}
rsvpForm?.addEventListener("submit",async event=>{
  event.preventDefault();
  if(isRsvpClosed()){
    setRsvpStatus("RSVP submissions are now closed.","error");
    applyRsvpAvailability();
    return;
  }const name=document.getElementById("name")?.value.trim(),attendance=document.querySelector('input[name="attendance"]:checked')?.value,guests=attendance==="decline"?0:Number(guestCountInput?.value),message=document.getElementById("message")?.value.trim()||"";
  if(!name){setRsvpStatus("Please enter your name.","error");document.getElementById("name")?.focus();return;}
  if(!attendance){setRsvpStatus("Please select whether you will attend.","error");return;}
  if(attendance==="accept"&&(!Number.isInteger(guests)||guests<1||guests>20)){setRsvpStatus("Please enter a valid guest count between 1 and 20.","error");guestCountInput?.focus();return;}
  if(!isRsvpEndpointConfigured()){setRsvpStatus("The RSVP service still needs its Google Apps Script URL.","error");return;}
  rsvpSubmit.disabled=true;setRsvpStatus("Sending your RSVP…","loading");
  try{const response=await requestJsonp({action:"submit",name,attendance,guests,message});if(!response?.ok)throw new Error(response?.error||"The RSVP could not be saved.");localStorage.setItem(RSVP_SUBMITTED_KEY,"true");setRsvpStatus("Thank you. Your RSVP has been received.","success");setTimeout(showMessageBoard,650);}
  catch(error){setRsvpStatus(error.message||"Something went wrong. Please try again.","error");rsvpSubmit.disabled=false;}
});
refreshMessagesButton?.addEventListener("click",loadMessages);
if(!applyRsvpAvailability()&&localStorage.getItem(RSVP_SUBMITTED_KEY)==="true")showMessageBoard();


// Couple photo lightbox
const couplePhotoButton = document.querySelector(".couple-photo-button");
const photoLightbox = document.getElementById("photo-lightbox");
const lightboxClose = document.querySelector(".lightbox-close");

function openPhotoLightbox() {
  if (!photoLightbox) return;
  photoLightbox.classList.add("is-open");
  photoLightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  lightboxClose?.focus();
}

function closePhotoLightbox() {
  if (!photoLightbox) return;
  photoLightbox.classList.remove("is-open");
  photoLightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  couplePhotoButton?.focus();
}

couplePhotoButton?.addEventListener("click", openPhotoLightbox);
lightboxClose?.addEventListener("click", closePhotoLightbox);

photoLightbox?.addEventListener("click", (event) => {
  if (event.target === photoLightbox) closePhotoLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && photoLightbox?.classList.contains("is-open")) {
    closePhotoLightbox();
  }
});


// V4.2 guest personalisation
(function applyGuestPersonalisation(){
  const params=new URLSearchParams(window.location.search);
  const raw=(params.get("to")||"").trim();
  if(!raw)return;
  const guestName=raw.replace(/\\s+/g," ").slice(0,80);
  const greeting=document.getElementById("guestGreeting");
  if(greeting){
    greeting.textContent=`${INVITATION_CONFIG.personalisedGreetingPrefix} ${guestName},`;
    greeting.hidden=false;
  }
  const nameInput=document.getElementById("name");
  if(nameInput&&!nameInput.value)nameInput.value=guestName;
})();

// Performance adaptation for data-saver and lower-end devices
(function applyPerformanceMode(){
  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const lowMemory=typeof navigator.deviceMemory==="number"&&navigator.deviceMemory<=4;
  const limitedCpu=typeof navigator.hardwareConcurrency==="number"&&navigator.hardwareConcurrency<=4;
  if(connection?.saveData||lowMemory||limitedCpu)document.documentElement.classList.add("low-performance");
})();

// Manifest-driven full-screen gallery with keyboard and touch-swipe navigation
const GALLERY_MANIFEST_URL="assets/gallery/gallery.json";
const galleryGrid=document.getElementById("gallery-grid");
const galleryStatus=document.getElementById("gallery-status");
const galleryLightbox=document.getElementById("gallery-lightbox");
const galleryLightboxImage=document.getElementById("gallery-lightbox-image");
const galleryLightboxCaption=document.getElementById("gallery-lightbox-caption");
const galleryLightboxCounter=document.getElementById("gallery-lightbox-counter");
const galleryClose=document.querySelector(".gallery-lightbox-close");
const galleryPrev=document.querySelector(".gallery-lightbox-prev");
const galleryNext=document.querySelector(".gallery-lightbox-next");
let galleryItems=[];
let galleryData=[];
let galleryIndex=0;
let galleryTouchStartX=0;

function normaliseGalleryEntry(entry,index){
  const value=typeof entry==="string"?{file:entry}:entry;
  if(!value||typeof value.file!=="string"||!value.file.trim())return null;
  const file=value.file.trim().replace(/^\.\//,"");
  const src=file.startsWith("assets/")?file:`assets/gallery/${file}`;
  const readable=file.split("/").pop().replace(/\.[^.]+$/,"").replace(/[-_]+/g," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());
  return {
    src,
    alt:String(value.alt||`Wedding photograph ${index+1}: ${readable}`),
    caption:String(value.caption||readable)
  };
}

function createGalleryItem(item,index){
  const button=document.createElement("button");
  button.className="gallery-item";
  button.type="button";
  button.dataset.galleryIndex=String(index);
  button.setAttribute("aria-label",`Open full-size photo: ${item.caption}`);

  const image=document.createElement("img");
  image.src=item.src;
  image.alt=item.alt;
  image.loading="lazy";
  image.decoding="async";
  image.addEventListener("error",()=>button.classList.add("is-unavailable"),{once:true});

  const caption=document.createElement("span");
  caption.textContent=item.caption;
  button.append(image,caption);
  button.addEventListener("click",()=>openGallery(index));
  return button;
}

async function loadGalleryManifest(){
  if(!galleryGrid)return;
  try{
    const response=await fetch(GALLERY_MANIFEST_URL,{cache:"no-cache"});
    if(!response.ok)throw new Error(`Gallery manifest returned ${response.status}.`);
    const manifest=await response.json();
    const entries=Array.isArray(manifest)?manifest:manifest.images;
    if(!Array.isArray(entries))throw new Error("Gallery manifest must contain an images array.");

    galleryData=entries.map(normaliseGalleryEntry).filter(Boolean);
    galleryGrid.replaceChildren(...galleryData.map(createGalleryItem));
    galleryItems=[...galleryGrid.querySelectorAll(".gallery-item")];

    if(galleryStatus){
      galleryStatus.textContent=galleryData.length?`${galleryData.length} moment${galleryData.length===1?"":"s"} in our gallery.`:"More moments will be added soon.";
      galleryStatus.classList.toggle("is-empty",!galleryData.length);
    }
  }catch(error){
    console.error("Could not load gallery manifest:",error);
    if(galleryStatus){
      galleryStatus.textContent="The gallery could not be loaded. Please refresh the page in a moment.";
      galleryStatus.classList.add("is-error");
    }
  }
}

function preloadAdjacentGalleryImages(){
  if(galleryData.length<2)return;
  [-1,1].forEach((offset)=>{
    const item=galleryData[(galleryIndex+offset+galleryData.length)%galleryData.length];
    if(item){const image=new Image();image.src=item.src;}
  });
}

function renderGalleryImage(){
  const item=galleryData[galleryIndex];
  if(!item||!galleryLightboxImage)return;
  galleryLightboxImage.classList.add("is-changing");
  setTimeout(()=>{
    galleryLightboxImage.src=item.src;
    galleryLightboxImage.alt=item.alt;
    if(galleryLightboxCaption)galleryLightboxCaption.textContent=item.caption;
    if(galleryLightboxCounter)galleryLightboxCounter.textContent=`${galleryIndex+1} / ${galleryData.length}`;
    galleryLightboxImage.classList.remove("is-changing");
    preloadAdjacentGalleryImages();
  },120);
}
function openGallery(index=0){
  if(!galleryLightbox||!galleryData.length)return;
  galleryIndex=(index+galleryData.length)%galleryData.length;
  renderGalleryImage();
  galleryLightbox.classList.add("is-open");
  galleryLightbox.setAttribute("aria-hidden","false");
  document.body.classList.add("lightbox-open");
  galleryClose?.focus();
}
function closeGallery(){
  galleryLightbox?.classList.remove("is-open");
  galleryLightbox?.setAttribute("aria-hidden","true");
  document.body.classList.remove("lightbox-open");
  galleryItems[galleryIndex]?.focus();
}
function moveGallery(direction){
  if(!galleryData.length)return;
  galleryIndex=(galleryIndex+direction+galleryData.length)%galleryData.length;
  renderGalleryImage();
}
galleryClose?.addEventListener("click",closeGallery);
galleryPrev?.addEventListener("click",()=>moveGallery(-1));
galleryNext?.addEventListener("click",()=>moveGallery(1));
galleryLightbox?.addEventListener("click",(event)=>{if(event.target===galleryLightbox)closeGallery();});
galleryLightbox?.addEventListener("touchstart",(event)=>{galleryTouchStartX=event.changedTouches[0]?.clientX||0;},{passive:true});
galleryLightbox?.addEventListener("touchend",(event)=>{
  const endX=event.changedTouches[0]?.clientX||0;
  const distance=endX-galleryTouchStartX;
  if(Math.abs(distance)>45)moveGallery(distance<0?1:-1);
},{passive:true});
document.addEventListener("keydown",(event)=>{
  if(!galleryLightbox?.classList.contains("is-open"))return;
  if(event.key==="Escape")closeGallery();
  if(event.key==="ArrowLeft")moveGallery(-1);
  if(event.key==="ArrowRight")moveGallery(1);
});

loadGalleryManifest();

// Floating music control with smooth fades
const backgroundMusic=document.getElementById("backgroundMusic");
const musicToggle=document.getElementById("musicToggle");
let musicFadeFrame=0;

function fadeMusic(targetVolume,duration=900){
  if(!backgroundMusic)return;
  cancelAnimationFrame(musicFadeFrame);
  const startVolume=backgroundMusic.volume;
  const startTime=performance.now();
  const step=(now)=>{
    const progress=Math.min((now-startTime)/duration,1);
    backgroundMusic.volume=startVolume+(targetVolume-startVolume)*(1-Math.pow(1-progress,3));
    if(progress<1)musicFadeFrame=requestAnimationFrame(step);
    else if(targetVolume===0)backgroundMusic.pause();
  };
  musicFadeFrame=requestAnimationFrame(step);
}
function updateMusicControl(isPlaying){
  if(!musicToggle)return;
  musicToggle.setAttribute("aria-pressed",String(isPlaying));
  musicToggle.setAttribute("aria-label",isPlaying?"Pause background music":"Play background music");
  musicToggle.classList.toggle("is-playing",isPlaying);
  const label=musicToggle.querySelector(".music-label");
  if(label)label.textContent=isPlaying?"Music on":"Music off";
}
async function startMusicAfterEntry(){
  if(!backgroundMusic||!musicToggle)return;
  musicToggle.hidden=false;
  backgroundMusic.volume=0;
  try{
    await backgroundMusic.play();
    fadeMusic(INVITATION_CONFIG.musicVolume,1200);
    updateMusicControl(true);
  }catch(_error){updateMusicControl(false);}
}
musicToggle?.addEventListener("click",async()=>{
  if(!backgroundMusic)return;
  if(backgroundMusic.paused){
    backgroundMusic.volume=0;
    try{await backgroundMusic.play();fadeMusic(INVITATION_CONFIG.musicVolume,700);updateMusicControl(true);}catch(_error){updateMusicControl(false);}
  }else{fadeMusic(0,650);updateMusicControl(false);}
});
backgroundMusic?.addEventListener("error",()=>{if(musicToggle)musicToggle.hidden=true;});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden&&!backgroundMusic?.paused)fadeMusic(0,350);
});
