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

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add("is-visible");
    const type = entry.target.dataset.sky;
    if (hasEntered && type) transportToSky(type);
  });
}, { threshold: 0.48 });

sections.forEach((section) => observer.observe(section));

const countdownEl = document.getElementById("countdown");
const weddingDate = new Date("2026-10-11T19:00:00+07:00");

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

// Preload constellation backgrounds for smoother scene changes
Object.values(skies).forEach((src) => {
  const img = new Image();
  img.src = src;
});

let messages = JSON.parse(localStorage.getItem("messages") || "[]");

function submitRSVP() {
  const name = document.getElementById("name").value;
  const attendance = document.getElementById("attendance").value;
  const message = document.getElementById("message").value;

  if (!name || !attendance) {
    alert("Please fill your name and attendance");
    return;
  }

  const newEntry = {
    name,
    attendance,
    message
  };

  messages.push(newEntry);

  localStorage.setItem("messages", JSON.stringify(messages));

  showMessages();
}

function showMessages() {
  document.getElementById("rsvp-form").style.display = "none";
  document.getElementById("message-board").style.display = "block";
  document.getElementById("rsvp-title").innerText = "Message Board";

  const list = document.getElementById("messages-list");
  list.innerHTML = "";

  messages.reverse().forEach(msg => {
    const div = document.createElement("div");
    div.className = "message-item";

    div.innerHTML = `
      <div class="message-name">
        ${msg.name} (${msg.attendance === "yes" ? "Attending" : "Not Attending"})
      </div>
      <div class="message-text">${msg.message || ""}</div>
    `;

    list.appendChild(div);
  });
}

window.addEventListener("load", () => {
  if (messages.length > 0) {
    showMessages();
  }
});

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
