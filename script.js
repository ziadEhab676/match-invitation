const CONFIG = {
  event: {
    title: "Egypt vs Argentina",
    dateISO: "2026-07-07T19:00:00+03:00",
    dateLabel: "Tuesday, July 7, 2026",
    timeLabel: "7:00 PM",
    venue: "Cafe Princess, Fifth Settlement",
  },
  intro: {
    enabled: true,
    attempts: 3,
    failMessages: [
      "Saved. Need to try harder.",
      "Another save. The goalkeeper is refusing drama.",
      "GOAL. Fine, that one was world class.",
    ],
  },
  music: {
    enabled: true,
    title: "Dai Dai",
    artist: "Shakira & Burna Boy",
    src: "./assets/audio/dai-dai-mobile.m4a",
    startVolume: 85,
  },
  sections: {
    hero: true,
    countdown: true,
    pick: true,
    location: true,
    rsvp: true,
  },
  choiceOutcomes: {
    egypt: {
      eyebrow: "So Sad For You",
      title: "Hard Luck, I'm With Argentina",
      text:
        "Supporting Egypt? Brave choice. Unfortunately I have already emotionally committed to Messi, so this rivalry is now official.",
      video: "./assets/video/messi-furious-mobile.mp4",
    },
    argentina: {
      eyebrow: "Correct Football Decision",
      title: "Messi Approves This Choice",
      text:
        "You chose Messi. Respect. Please enjoy a championship celebration.",
      video: "./assets/video/argentina-national.mp4",
    },
  },
  rsvp: {
    yesMessage:
      "Perfect. Consider this your official match-night duty. Be ready before kickoff.",
    noMessages: [
      "No is not a football-approved answer.",
      "The button has decided to protect the invitation.",
      "Still trying to say no? Suspicious behavior.",
      "At this point the only realistic answer is yes.",
    ],
  },
};

const state = {
  attempt: 0,
  dragging: false,
  introFinished: false,
  musicRequested: false,
  mediaWarmed: false,
  selectedTeam: "",
  noIndex: 0,
};

const elements = {
  introShell: document.getElementById("intro-shell"),
  page: document.getElementById("page"),
  heroSection: document.getElementById("hero-section"),
  countdownSection: document.getElementById("countdown-section"),
  pickSection: document.getElementById("pick-section"),
  locationSection: document.getElementById("location-section"),
  rsvpSection: document.getElementById("rsvp-section"),
  introMessage: document.getElementById("intro-message"),
  attempts: document.getElementById("attempts"),
  hint: document.getElementById("hint"),
  audioStatus: document.getElementById("audio-status"),
  stage: document.getElementById("penalty-stage"),
  ball: document.getElementById("ball"),
  goalkeeper: document.getElementById("goalkeeper"),
  shotTrail: document.getElementById("shot-trail"),
  goalCelebration: document.getElementById("goal-celebration"),
  confettiLayer: document.getElementById("confetti-layer"),
  matchAudio: document.getElementById("match-audio"),
  choiceEgypt: document.getElementById("choice-egypt"),
  choiceArgentina: document.getElementById("choice-argentina"),
  reactionCard: document.getElementById("reaction-card"),
  reactionEyebrow: document.getElementById("reaction-eyebrow"),
  reactionTitle: document.getElementById("reaction-title"),
  reactionText: document.getElementById("reaction-text"),
  reactionVideo: document.getElementById("reaction-video"),
  reactionStatus: document.getElementById("reaction-status"),
  reactionOpen: document.getElementById("reaction-open"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  rsvpPlayground: document.getElementById("rsvp-playground"),
  yesButton: document.getElementById("yes-button"),
  noButton: document.getElementById("no-button"),
  rsvpFeedback: document.getElementById("rsvp-feedback"),
};

const ballBase = {
  left: 0,
  top: 0,
};

let dragOffset = { x: 0, y: 0 };

applySectionFlags();
setupMusic();
setupCountdown();
setupPenaltyIntro();
setupChoices();
setupRsvp();

function setupMusic() {
  if (!CONFIG.music.enabled || !elements.matchAudio) return;
  elements.matchAudio.volume = clamp(CONFIG.music.startVolume / 100, 0, 1);
  elements.matchAudio.src = CONFIG.music.src;
  elements.matchAudio.load();
  elements.matchAudio.addEventListener("canplay", () => {
    if (elements.audioStatus) {
      elements.audioStatus.textContent = "Anthem is ready.";
    }
  });
  elements.matchAudio.addEventListener("waiting", () => {
    if (elements.audioStatus) {
      elements.audioStatus.textContent = "Loading anthem...";
    }
  });
  elements.matchAudio.addEventListener("playing", () => {
    if (elements.audioStatus) {
      elements.audioStatus.textContent = "Anthem is playing.";
    }
  });
  elements.matchAudio.addEventListener("error", () => {
    if (elements.audioStatus) {
      elements.audioStatus.textContent = "Anthem could not load on this connection.";
    }
  });
}

function pauseBackgroundMusic() {
  if (!CONFIG.music.enabled || !elements.matchAudio) return;
  elements.matchAudio.pause();
}

function resumeBackgroundMusic() {
  if (!CONFIG.music.enabled || !elements.matchAudio) return;
  elements.matchAudio.volume = clamp(CONFIG.music.startVolume / 100, 0, 1);
  elements.matchAudio.play().catch(() => {});
}

function applySectionFlags() {
  const map = {
    hero: elements.heroSection,
    countdown: elements.countdownSection,
    pick: elements.pickSection,
    location: elements.locationSection,
    rsvp: elements.rsvpSection,
  };

  Object.entries(map).forEach(([key, node]) => {
    if (!node) return;
    node.classList.toggle("hidden", !CONFIG.sections[key]);
  });
}

function setupCountdown() {
  if (!CONFIG.sections.countdown) return;
  const target = new Date(CONFIG.event.dateISO).getTime();

  const update = () => {
    const diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    elements.days.textContent = pad(days);
    elements.hours.textContent = pad(hours);
    elements.minutes.textContent = pad(minutes);
    elements.seconds.textContent = pad(seconds);
  };

  update();
  window.setInterval(update, 1000);
}

function setupPenaltyIntro() {
  if (!CONFIG.intro.enabled) {
    revealMainPage();
    return;
  }

  const stageRect = () => elements.stage.getBoundingClientRect();
  const ballRect = () => elements.ball.getBoundingClientRect();

  const resetBall = () => {
    const rect = stageRect();
    const size = elements.ball.offsetWidth;
    ballBase.left = rect.width / 2 - size / 2;
    ballBase.top = rect.height - size - 38;
    elements.ball.style.left = `${ballBase.left}px`;
    elements.ball.style.top = `${ballBase.top}px`;
    elements.ball.style.bottom = "auto";
    elements.ball.classList.remove("dragging", "saved");
    clearShotTrail();
  };

  const startDrag = (event) => {
    if (state.introFinished) return;
    state.dragging = true;
    elements.ball.classList.add("dragging");
    warmMedia();
    const rect = ballRect();
    dragOffset = {
      x: getPoint(event).x - rect.left,
      y: getPoint(event).y - rect.top,
    };
  };

  const moveDrag = (event) => {
    if (!state.dragging || state.introFinished) return;
    event.preventDefault();
    const point = getPoint(event);
    const rect = stageRect();
    const size = elements.ball.offsetWidth;
    const nextLeft = clamp(point.x - rect.left - dragOffset.x, 0, rect.width - size);
    const nextTop = clamp(point.y - rect.top - dragOffset.y, 0, rect.height - size);
    elements.ball.style.left = `${nextLeft}px`;
    elements.ball.style.top = `${nextTop}px`;
  };

  const endDrag = () => {
    if (!state.dragging || state.introFinished) return;
    state.dragging = false;
    elements.ball.classList.remove("dragging");

    const currentLeft = parseFloat(elements.ball.style.left) || ballBase.left;
    const currentTop = parseFloat(elements.ball.style.top) || ballBase.top;
    const dx = currentLeft - ballBase.left;
    const dy = currentTop - ballBase.top;

    if (dy > -70 || Math.abs(dx) < 28) {
      animateBackToBase();
      return;
    }

    state.attempt += 1;
    elements.attempts.textContent = `Attempt ${Math.min(state.attempt + 1, CONFIG.intro.attempts)} of ${CONFIG.intro.attempts}`;

    if (state.attempt < CONFIG.intro.attempts) {
      playSavedShot(dx < 0 ? "left" : "right");
      return;
    }

    playGoalShot(dx < 0 ? "left" : "right");
  };

  resetBall();
  window.addEventListener("resize", resetBall);
  elements.ball.addEventListener("pointerdown", startDrag);
  window.addEventListener("pointermove", moveDrag, { passive: false });
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

function playSavedShot(side) {
  state.dragging = false;
  elements.goalkeeper.className = `goalkeeper saved-${side}`;
  elements.introMessage.textContent = CONFIG.intro.failMessages[state.attempt - 1];
  elements.hint.textContent = state.attempt === 1 ? "Try harder. The keeper is still confident." : "One more shot. This one must go in.";

  const stageRect = elements.stage.getBoundingClientRect();
  const endX = side === "left" ? stageRect.width * 0.38 : stageRect.width * 0.62;
  const endY = stageRect.height * 0.29;
  animateBallShot(endX, endY, true, () => {
    elements.ball.classList.add("saved");
    window.setTimeout(() => {
      elements.goalkeeper.className = "goalkeeper";
      resetIntroBall();
    }, 720);
  });
}

function playGoalShot(side) {
  state.dragging = false;
  state.introFinished = true;
  elements.goalkeeper.className = `goalkeeper goal-${side === "left" ? "right" : "left"}`;
  elements.introMessage.textContent = CONFIG.intro.failMessages[2];
  elements.hint.textContent = "Celebration incoming.";
  requestMusicStart();

  const stageRect = elements.stage.getBoundingClientRect();
  const endX = side === "left" ? stageRect.width * 0.43 : stageRect.width * 0.58;
  const endY = stageRect.height * 0.2;

  animateBallShot(endX, endY, false, () => {
    elements.goalCelebration.classList.add("active");
    burstConfetti(80);
    requestMusicStart();
    window.setTimeout(() => {
      elements.introShell.classList.add("is-finished");
      revealMainPage();
    }, 1250);
  });
}

function animateBallShot(endX, endY, saved, onDone) {
  const startX = (parseFloat(elements.ball.style.left) || 0) + elements.ball.offsetWidth / 2;
  const startY = (parseFloat(elements.ball.style.top) || 0) + elements.ball.offsetHeight / 2;
  const trailLength = Math.hypot(endX - startX, endY - startY);
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

  elements.shotTrail.classList.add("visible");
  elements.shotTrail.style.left = `${startX}px`;
  elements.shotTrail.style.top = `${startY}px`;
  elements.shotTrail.style.width = `${trailLength}px`;
  elements.shotTrail.style.transform = `rotate(${angle}deg)`;

  elements.ball.style.transition = "left 0.65s cubic-bezier(.2,.8,.18,1), top 0.65s cubic-bezier(.2,.8,.18,1), transform 0.65s ease, opacity 0.65s ease";
  elements.ball.style.left = `${endX - elements.ball.offsetWidth / 2}px`;
  elements.ball.style.top = `${endY - elements.ball.offsetHeight / 2}px`;
  elements.ball.style.transform = `scale(${saved ? 0.84 : 0.62})`;

  window.setTimeout(() => {
    if (!saved) {
      elements.ball.style.opacity = "0";
    }
    onDone();
  }, 700);
}

function resetIntroBall() {
  const rect = elements.stage.getBoundingClientRect();
  const size = elements.ball.offsetWidth;
  const left = rect.width / 2 - size / 2;
  const top = rect.height - size - 38;
  clearShotTrail();
  elements.ball.style.transition = "none";
  elements.ball.style.transform = "scale(1)";
  elements.ball.style.opacity = "1";
  elements.ball.style.left = `${left}px`;
  elements.ball.style.top = `${top}px`;
}

function animateBackToBase() {
  elements.ball.style.transition = "left 0.25s ease, top 0.25s ease";
  elements.ball.style.left = `${ballBase.left}px`;
  elements.ball.style.top = `${ballBase.top}px`;
}

function clearShotTrail() {
  elements.shotTrail.classList.remove("visible");
  elements.shotTrail.style.width = "0";
  elements.shotTrail.style.transform = "none";
}

function revealMainPage() {
  elements.page.classList.remove("hidden");
  warmMedia();
  window.setTimeout(() => {
    elements.introShell.classList.add("hidden");
  }, 980);
}

function setupChoices() {
  if (!CONFIG.sections.pick) return;

  elements.choiceEgypt.addEventListener("click", () => applyChoice("egypt"));
  elements.choiceArgentina.addEventListener("click", () => applyChoice("argentina"));
}

function applyChoice(team) {
  state.selectedTeam = team;
  const result = CONFIG.choiceOutcomes[team];
  elements.reactionEyebrow.textContent = result.eyebrow;
  elements.reactionTitle.textContent = result.title;
  elements.reactionText.textContent = result.text;
  elements.reactionVideo.pause();
  elements.reactionStatus.textContent = "Loading highlight...";
  elements.reactionStatus.classList.remove("hidden");
  elements.reactionOpen.href = result.video;
  elements.reactionOpen.classList.add("hidden");
  elements.reactionVideo.src = result.video;
  elements.reactionVideo.load();
  elements.reactionCard.classList.remove("hidden");
  elements.reactionVideo.currentTime = 0;
  elements.reactionVideo.oncanplay = () => {
    elements.reactionStatus.textContent = "Highlight ready.";
  };
  elements.reactionVideo.onplaying = () => {
    pauseBackgroundMusic();
    elements.reactionStatus.classList.add("hidden");
  };
  elements.reactionVideo.onpause = () => {
    resumeBackgroundMusic();
  };
  elements.reactionVideo.onended = () => {
    resumeBackgroundMusic();
  };
  elements.reactionVideo.onwaiting = () => {
    elements.reactionStatus.textContent = "Loading highlight...";
    elements.reactionStatus.classList.remove("hidden");
  };
  elements.reactionVideo.onerror = () => {
    resumeBackgroundMusic();
    elements.reactionStatus.textContent = "Tap below if the video does not start.";
    elements.reactionStatus.classList.remove("hidden");
    elements.reactionOpen.classList.remove("hidden");
  };
  elements.reactionVideo.play().catch(() => {
    resumeBackgroundMusic();
    elements.reactionStatus.textContent = "Tap play or open the video directly.";
    elements.reactionStatus.classList.remove("hidden");
    elements.reactionOpen.classList.remove("hidden");
  });
  elements.reactionCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function warmMedia() {
  if (state.mediaWarmed) return;
  state.mediaWarmed = true;

  if (elements.matchAudio) {
    elements.matchAudio.load();
  }

  Object.values(CONFIG.choiceOutcomes).forEach((outcome) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = outcome.video;
    video.load();
  });
}

function setupRsvp() {
  if (!CONFIG.sections.rsvp) return;

  positionNoButton();

  const dodge = () => {
    positionNoButton();
    const message = CONFIG.rsvp.noMessages[state.noIndex % CONFIG.rsvp.noMessages.length];
    state.noIndex += 1;
    elements.rsvpFeedback.textContent = message;
  };

  elements.noButton.addEventListener("mouseenter", dodge);
  elements.noButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dodge();
  });
  elements.noButton.addEventListener("click", (event) => event.preventDefault());

  elements.yesButton.addEventListener("click", () => {
    const teamLine =
      state.selectedTeam === "egypt"
        ? "You chose Egypt, but you are still accepted."
        : state.selectedTeam === "argentina"
          ? "You chose Messi, which is obviously elite behavior."
          : "You skipped the team choice, but I will allow it.";

    elements.rsvpFeedback.textContent = `${CONFIG.rsvp.yesMessage} ${teamLine}`;
    burstConfetti(36);
  });

  window.addEventListener("resize", positionNoButton);
}

function positionNoButton() {
  const area = elements.rsvpPlayground.getBoundingClientRect();
  const buttonRect = elements.noButton.getBoundingClientRect();
  const maxX = Math.max(12, area.width - buttonRect.width - 12);
  const maxY = Math.max(76, area.height - buttonRect.height - 12);
  const nextX = 12 + Math.random() * (maxX - 12);
  const nextY = 70 + Math.random() * Math.max(1, maxY - 70);
  elements.noButton.style.left = `${nextX}px`;
  elements.noButton.style.top = `${nextY}px`;
  elements.noButton.style.right = "auto";
  elements.noButton.style.transform = "none";
}

function requestMusicStart() {
  if (!CONFIG.music.enabled || !elements.matchAudio) return;
  state.musicRequested = true;
  elements.matchAudio.volume = clamp(CONFIG.music.startVolume / 100, 0, 1);
  elements.matchAudio.currentTime = 0;
  if (elements.audioStatus) {
    elements.audioStatus.textContent = "Loading anthem...";
  }
  elements.matchAudio.play().catch(() => {
    if (elements.audioStatus) {
      elements.audioStatus.textContent = "Tap again if the anthem does not start.";
    }
  });
}

function burstConfetti(count) {
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = pick([
      "#f2c14e",
      "#ff6b57",
      "#78d7ff",
      "#ffffff",
      "#16a34a",
    ]);
    piece.style.setProperty("--drift", `${-120 + Math.random() * 240}px`);
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    elements.confettiLayer.appendChild(piece);
    window.setTimeout(() => piece.remove(), 2900);
  }
}

function getPoint(event) {
  if (event.touches?.[0]) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pad(value) {
  return String(value).padStart(2, "0");
}
