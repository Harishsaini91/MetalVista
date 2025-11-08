
  document.addEventListener("DOMContentLoaded", function () {
    const section = document.getElementById("carouselSection");
    const track = document.getElementById("carouselTrack");
    const progressBar = document.getElementById("scrollProgressBar");
    const scrollBar = document.getElementById("scrollBar");
  
    if (!section || !track || !progressBar || !scrollBar) return;
  
    // === Update Progress Bar ===
    const updateProgress = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const scrollLeft = track.scrollLeft;
      const percent = (scrollLeft / maxScroll) * 100;
      progressBar.style.width = `${percent}%`;
    };
  
    track.addEventListener("scroll", updateProgress);
    updateProgress();
  
    // === Click on bar to control scroll ===
    scrollBar.addEventListener("click", (e) => {
      const rect = scrollBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickPercent = clickX / rect.width;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const newScroll = maxScroll * clickPercent;
      track.scrollTo({ left: newScroll, behavior: "smooth" });
    });
  
    // === Drag bar to scroll ===
    let isDragging = false;
    scrollBar.addEventListener("mousedown", (e) => {
      isDragging = true;
      handleDrag(e);
    });
    window.addEventListener("mousemove", (e) => {
      if (isDragging) handleDrag(e);
    });
    window.addEventListener("mouseup", () => (isDragging = false));
  
    function handleDrag(e) {
      const rect = scrollBar.getBoundingClientRect();
      const dragX = e.clientX - rect.left;
      const dragPercent = Math.max(0, Math.min(1, dragX / rect.width));
      const maxScroll = track.scrollWidth - track.clientWidth;
      track.scrollLeft = maxScroll * dragPercent;
      updateProgress();
    }
  
    // === Horizontal scroll with wheel / trackpad ===
    section.addEventListener("wheel", (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault(); // stop page from scrolling vertically
        track.scrollLeft += e.deltaY; // scroll sideways instead
      }
    }, { passive: false });
  
    // Optional smooth inertia when using touchpads
    let isScrolling;
    track.addEventListener("scroll", () => {
      clearTimeout(isScrolling);
      section.classList.add("scrolling");
      isScrolling = setTimeout(() => section.classList.remove("scrolling"), 200);
    });
  });