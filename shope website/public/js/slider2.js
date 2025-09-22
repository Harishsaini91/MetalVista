let currentSlide2 = 0;
const slides2 = window.slidesData2 || [];
const slideNumberElement = document.getElementById("slide2-number");

function showSlide2(index) {
  const slideElement2 = document.querySelector(".slide2");
  const imageProductUrl = document.querySelector(".image_product_url");
  if (slideElement2 && slides2.length > 0) {
    slideElement2.style.backgroundImage = `url('./images/uploded_image/${slides2[index].name}')`;
    imageProductUrl.setAttribute('href', `/product_details?image=${slides2[index].name}`);
    slideNumberElement.textContent = `${index + 1} / ${slides2.length}`;
  }
}

function nextSlide2() {
  currentSlide2 = (currentSlide2 + 1) % slides2.length;
  showSlide2(currentSlide2);
}

function prevSlide2() {
  currentSlide2 = (currentSlide2 - 1 + slides2.length) % slides2.length;
  showSlide2(currentSlide2);
}

if (slides2.length > 0) {
  showSlide2(currentSlide2);
  const sliderElement2 = document.querySelector(".slider2");
  let interval2 = setInterval(nextSlide2, 4000);
  sliderElement2.addEventListener("mouseenter", () => clearInterval(interval2));
  sliderElement2.addEventListener("mouseleave", () => interval2 = setInterval(nextSlide2, 4000));
}
