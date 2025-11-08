const scrollWrapper = document.getElementById("scroll-wrapper");
  const scrollMainBtn = document.getElementById("scroll-main-btn");
  const scrollOptions = document.getElementById("scroll-options");
  const scrollTopBtn = document.getElementById("scroll-top");
  const scrollBottomBtn = document.getElementById("scroll-bottom");

  let scrollBtnTimer;
  let optionsTimer;
  let isHovering = false;
  let hasScrolled = false;

  const buttonShowDuration = 7000; // 7 sec
  const optionShowDuration = 4000; // 4 sec

  // --- Show main scroll button ---
  function showScrollBtn() {
    scrollMainBtn.classList.add("show", "glow");
    hasScrolled = true;
    restartButtonTimer(); // start fresh
    // showOptions();        // show options for first 4s
  }

  // --- Hide main scroll button ---
  function hideScrollBtn() {
    hideOptions(true); // hide options first instantly
    scrollMainBtn.classList.remove("show", "glow");
  }

  // --- Show options only if button visible ---
  function showOptions() {
    if (!scrollMainBtn.classList.contains("show")) return;
    scrollOptions.classList.add("show");
    restartOptionTimer(); // start fresh
  }

  // --- Hide options ---
  function hideOptions(force = false) {
    clearTimeout(optionsTimer);
    if (force) {
      scrollOptions.classList.remove("show");
      return;
    }
    scrollOptions.classList.remove("show");
  }

  // --- Restart button timer from 0 ---
  function restartButtonTimer() {
    clearTimeout(scrollBtnTimer);
    if (!isHovering) {
      scrollBtnTimer = setTimeout(() => {
        hideScrollBtn();
      }, buttonShowDuration);
    }
  }

  // --- Restart options timer from 0 ---
  function restartOptionTimer() {
    clearTimeout(optionsTimer);
    if (!isHovering) {
      optionsTimer = setTimeout(() => {
        hideOptions();
      }, optionShowDuration);
    }
  }

  // --- Stop both timers while hovering ---
  function stopTimers() {
    clearTimeout(scrollBtnTimer);
    clearTimeout(optionsTimer);
  }

  // --- Scroll detection ---
  window.addEventListener("scroll", () => {
    if (!hasScrolled) {
      showScrollBtn();
    } else {
      showScrollBtn(); // restart timers on further scroll
    }
  });

  // --- Hover wrapper (pause timers) ---
  scrollWrapper.addEventListener("mouseenter", () => {
    isHovering = true;
    stopTimers();
    showOptions(); // ensure options visible while hovering
  });

  scrollWrapper.addEventListener("mouseleave", () => {
    isHovering = false;
    // 🕒 restart both timers from zero
    restartButtonTimer();
    restartOptionTimer();
  });

  // --- Click main button: toggle options ---
  scrollMainBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (scrollOptions.classList.contains("show")) {
      hideOptions();
    } else {
      showOptions();
    }
  });

  // --- Scroll top and bottom actions ---
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  scrollBottomBtn.addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });