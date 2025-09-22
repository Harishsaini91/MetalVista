
function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("show");  // Show or hide the menu when the icon is clicked
}

// Hide the menu when mouse moves outside
document.addEventListener('click', function(event) {
  const menu = document.getElementById("menu");
  const menuIcon = document.querySelector(".menu-icon");
  
  // Close the menu if the click is outside the menu or icon
  if (!menu.contains(event.target) && event.target !== menuIcon) {
    menu.classList.remove("show");
  }
});




// 





let currentSlide = 0;
    const slides = <%- JSON.stringify(slides) %>; // Server-side data

    if (slides && slides.length > 0) {
      const slideElement = document.querySelector(".slide");
      slideElement.style.backgroundImage = `url('./images/uploded_image/${slides[currentSlide].name}')`;
    }

    function showSlide(index) {
      const slideElement = document.querySelector(".slide");
  const imageNameInput = document.getElementById("currentImageName");

  if (slideElement && slides.length > 0) {
    // Dynamically set the background image using the current slide's name
    const imageName = slides[index]?.name || "default.jpg"; // Fallback to 'default.jpg'
    slideElement.style.backgroundImage = `url('./images/uploded_image/${imageName}')`;

    // Update the input field with the current image name
    if (imageNameInput) {
      imageNameInput.value = imageName; // Dynamically set the image name
    }
        slideElement.classList.add("active");
      } else {
        console.error("Slide element not found or slides array is empty!");
      }
    }
    // function showSlide(index) {
    //   const slideElement = document.querySelector(".slide");
    //   if (slideElement && slides.length > 0) {
    //     slideElement.style.backgroundImage = `url('./images/uploded_image/${slides[index].name}')`;
    //     slideElement.classList.add("active");
    //   } else {
    //     console.error("Slide element not found or slides array is empty!");
    //   }
    // }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length; // Cycle to next
      showSlide(currentSlide);
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length; // Cycle back
      showSlide(currentSlide);
    }

    // Automatically initialize first slide
    if (slides && slides.length > 0) {
      showSlide(currentSlide);
    }

    // Add event listeners for hover
    const sliderElement = document.querySelector(".slider");

    if (sliderElement) {
      let slideshowInterval = setInterval(nextSlide, 8000); // Automatically change slides every 8 seconds

      // Pause slideshow on hover
      sliderElement.addEventListener("mouseenter", () => {
        clearInterval(slideshowInterval); // Stop auto-slide
      });

      // Resume slideshow on hover out
      sliderElement.addEventListener("mouseleave", () => {
        slideshowInterval = setInterval(nextSlide, 8000); // Restart auto-slide
      });
    }



    
    
    let currentSlide2 = 0;
    const slides2 = <%- JSON.stringify(slides2) %>;
    const slideNumberElement = document.getElementById("slide2-number");

    function showSlide2(index) {
      const slideElement2 = document.querySelector(".slide2");
      const imageProductUrl = document.querySelector(".image_product_url");  //
      if (slideElement2 && slides2.length > 0) {
        slideElement2.style.backgroundImage = `url('./images/uploded_image/${slides2[index].name}')`;
        imageProductUrl.setAttribute('href', `/product_details?image=${slides2[index].name}`);

        slideNumberElement.textContent = `${index + 1} / ${slides2.length}`;

         
      } else {
        console.error("Slide2 element not found or slides2 array is empty!");
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

    if (slides2 && slides2.length > 0) {
      showSlide2(currentSlide2);
    }

    const sliderElement2 = document.querySelector(".slider2");

    if (sliderElement2) {
      let slideshowInterval2 = setInterval(nextSlide2, 4000);
      sliderElement2.addEventListener("mouseenter", () => clearInterval(slideshowInterval2));
      sliderElement2.addEventListener("mouseleave", () => slideshowInterval2 = setInterval(nextSlide2, 4000));
    }



  //  search bar
  const products = [
    {
      id: 1,
      name: "Apple iPhone 13",
      category: "Electronics",
      subNames: ["iPhone", "Apple", "Phone"],
      imageUrl: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Samsung Galaxy S23",
      category: "Electronics",
      subNames: ["Samsung", "Galaxy", "Android"],
      imageUrl: "https://via.placeholder.com/150",
    },
    {
      id: 3,
      name: "Nike Running Shoes",
      category: "Footwear",
      subNames: ["Nike", "Running", "Shoes"],
      imageUrl: "https://via.placeholder.com/150",
    },
  ];

  const searchBar = document.getElementById("searchBar");
  const suggestionsDiv = document.getElementById("suggestions");
  const overlay = document.getElementById("overlay");
  const resultsDiv = document.getElementById("results");

  // Show overlay and suggestions on focus
  searchBar.addEventListener("focus", () => {
    overlay.style.display = "block";
    suggestionsDiv.style.display = "block";
  });

  // Hide overlay and suggestions on blur
  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
    suggestionsDiv.style.display = "none";
    searchBar.blur();
  });

  const showSuggestions = (query) => {
    if (!query) {
      suggestionsDiv.innerHTML = "";
      suggestionsDiv.style.display = "none";
      return;
    }

    const allSubNames = Array.from(
      new Set(products.flatMap((product) => product.subNames))
    );

    const filteredSubNames = allSubNames.filter((subName) =>
      subName.toLowerCase().includes(query.toLowerCase())
    );

    suggestionsDiv.innerHTML = filteredSubNames
      .map((subName) => `<div class="suggestion-item">${subName}</div>`)
      .join("");

    suggestionsDiv.style.display = "block";

    document.querySelectorAll(".suggestion-item").forEach((item) => {
      item.addEventListener("click", () => {
        searchBar.value = item.textContent;
        searchProducts(item.textContent);
        overlay.style.display = "none";
        suggestionsDiv.style.display = "none";
        searchBar.blur();
      });
    });
  };

  const searchProducts = (query) => {
    if (!query) return;

    const matchedProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.subNames.some((subName) =>
          subName.toLowerCase().includes(query.toLowerCase())
        )
    );

    resultsDiv.innerHTML = matchedProducts.length
      ? matchedProducts
          .map(
            (product) => `
        <div class="product">
          <img src="${product.imageUrl}" alt="${product.name}" />
          <h3>${product.name}</h3>
          <p>${product.category}</p>
        </div>
      `
          )
          .join("")
      : "<p>No products found</p>";
  };

  searchBar.addEventListener("input", (e) => {
    const query = e.target.value;
    showSuggestions(query);
  });


  // 
  function updateCurrentImageName(imageName) {
    const currentImageNameInput = document.getElementById("currentImageName2");
    if (currentImageNameInput) {
      currentImageNameInput.value = imageName; // Set the hovered image name
    }
  }
