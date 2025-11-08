function openProductUpload() {
  window.open('/products/full-entry', 'ProductUploadPopup',
    'width=750,height=700,left=250,top=100,resizable=yes,scrollbars=yes');
}

function openModelWindow() {
  window.open('/products/model-editor', 'Upload Product',
    'width=650,height=700,left=200,top=100,resizable=no,scrollbars=yes');
}

function openSchemaEditor(imageName) {
  const url = `/products/full-entry?imageName=${encodeURIComponent(imageName)}`;
  window.open(url, 'EditProductSchema',
    'width=650,height=700,left=200,top=100,resizable=no,scrollbars=yes');
}

function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("show");
}

document.addEventListener('click', function (event) {
  const menu = document.getElementById("menu");
  const menuIcon = document.querySelector(".menu-icon");
  if (!menu.contains(event.target) && event.target !== menuIcon) {
    menu.classList.remove("show");
  }
});
