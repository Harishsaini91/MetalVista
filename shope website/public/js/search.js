const searchBar = document.getElementById("searchBar");
const suggestionsDiv = document.getElementById("suggestions");
const overlay = document.getElementById("overlay");
const resultsDiv = document.getElementById("results");

searchBar.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (!query) {
    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";
    return;
  }

  const res = await fetch(`/products/api/search-products?q=${encodeURIComponent(query)}`);
  const products = await res.json();

  showSuggestions(products);
});
 
function showSuggestions(products) {
  if (!products.length) {
    suggestionsDiv.innerHTML = "<div class='suggestion-item'>No matches</div>";
    suggestionsDiv.style.display = "block";
    return;
  }

  // suggestionsDiv.innerHTML = products.map(p => `
  //   <div class="suggestion-item" onclick="viewProduct('${p.imageName}')">
  //     <img src="${p.imageUrl}" width="40" height="40" />
  //     <span style="margin-left: 10px;">${p.name || p.imageName}</span>
  //   </div>
  // `).join("");

  suggestionsDiv.innerHTML = products.map(p => `
  <div class="suggestion-item" onclick="viewProduct('${p.imageName}')">
    <img src="${p.imageUrl}" width="40" height="40" />
    <span style="margin-left: 10px;">${p.product_name}</span>
  </div>
`).join("");


  suggestionsDiv.style.display = "block";
}

function viewProduct(imageName) {
  window.location.href = `/product_details?image=${imageName}`;
}

searchBar.addEventListener("focus", () => {
  document.body.style.overflow = "hidden";
  overlay.style.display = "block";
  suggestionsDiv.style.display = "block";
});

overlay.addEventListener("click", () => {
  document.body.style.overflow = "auto";
  overlay.style.display = "none";
  suggestionsDiv.style.display = "none";
  searchBar.blur();
});

function updateCurrentImageName(imageName) {
  const input = document.getElementById("currentImageName2");
  if (input) input.value = imageName;
}
