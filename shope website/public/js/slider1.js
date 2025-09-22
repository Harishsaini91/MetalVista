let currentSlide = 0;
const slides = window.slidesData1 || [];

function showSlide(index) {
  const slideElement = document.querySelector(".slide");
  const imageNameInput = document.getElementById("currentImageName");

  if (slideElement && slides.length > 0) {
    const imageName = slides[index]?.name || "default.jpg";
    slideElement.style.backgroundImage = `url('./images/uploded_image/${imageName}')`;
    if (imageNameInput) imageNameInput.value = imageName;
    slideElement.classList.add("active");
  }
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}

if (slides.length > 0) {
  showSlide(currentSlide);
  const sliderElement = document.querySelector(".slider");
  let interval = setInterval(nextSlide, 8000);
  sliderElement.addEventListener("mouseenter", () => clearInterval(interval));
  sliderElement.addEventListener("mouseleave", () => interval = setInterval(nextSlide, 8000));
}
