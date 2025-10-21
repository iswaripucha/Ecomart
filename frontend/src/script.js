// ---------- Global Product Store ----------
let products = JSON.parse(localStorage.getItem("products")) || [
  { name: "📚 Engineering Mathematics Book", price: 400, category: "Academic" },
  { name: "🥼 Lab Coat", price: 250, category: "Academic" },
  { name: "👕 Eco-Friendly T-Shirt", price: 350, category: "Clothing" },
  { name: "🧥 College Hoodie", price: 700, category: "Clothing" },
  { name: "📱 Used Scientific Calculator", price: 600, category: "Electronics" },
  { name: "🎧 Second-hand Earphones", price: 300, category: "Electronics" },
  { name: "🍼 Steel Water Bottle", price: 150, category: "Hostel Essentials" },
  { name: "💡 Table Lamp", price: 450, category: "Hostel Essentials" }
];

document.addEventListener("DOMContentLoaded", () => {
  // ---------- LOGIN PAGE ----------
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const studentId = document.getElementById("student-id").value.trim();
      const role = document.getElementById("role").value;

      if (!studentId) {
        document.getElementById("error-msg").textContent = "Student ID required!";
        return;
      }

      // Redirect based on role
      if (role === "buyer") {
        window.location.href = "buyer.html";
      } else {
        window.location.href = "seller.html";
      }
    });
  }

  // ---------- BUYER PAGE ----------
  const productList = document.getElementById("product-list");
  const categoryFilter = document.getElementById("category-filter");
  const searchBar = document.getElementById("search-bar");
  const conditionFilter = document.getElementById("condition-filter");
  const sortFilter = document.getElementById("sort-filter");

  function renderProducts(filter = "all", searchText = "") {
    if (!productList) return;
    productList.innerHTML = "";

    let filtered = products
      .filter(p => filter === "all" || p.category === filter)
      .filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()));

    // Optional: Sort by price or newest
    if (sortFilter) {
      if (sortFilter.value === "price-low") filtered.sort((a,b)=>a.price-b.price);
      if (sortFilter.value === "price-high") filtered.sort((a,b)=>b.price-a.price);
      if (sortFilter.value === "newest") filtered = filtered.reverse(); // placeholder
    }

    filtered.forEach((p) => {
      const div = document.createElement("div");
      div.classList.add("product-card");
      div.innerHTML = `
        <img src="https://via.placeholder.com/200x150" alt="${p.name}">
        <div class="product-info">
          <h3 class="product-title">${p.name}</h3>
          <p class="product-price">₹${p.price}</p>
          <p class="product-condition">${p.category}</p>
        </div>
        <button class="buy-btn">Request to Buy</button>
      `;
      div.querySelector(".buy-btn").addEventListener("click", () => {
        alert(`Request sent to seller for ${p.name}!`);
      });
      productList.appendChild(div);
    });
  }

  if (productList) {
    renderProducts(); // show all initially
    if (categoryFilter && searchBar) {
      categoryFilter.addEventListener("change", () => {
        renderProducts(categoryFilter.value, searchBar.value);
      });
      searchBar.addEventListener("input", () => {
        renderProducts(categoryFilter.value, searchBar.value);
      });
    }
    if (sortFilter) {
      sortFilter.addEventListener("change", () => {
        renderProducts(categoryFilter.value, searchBar.value);
      });
    }
  }

  // ---------- SELLER PAGE ----------
  const addProductForm = document.getElementById("add-product-form");
  const sellerProductList = document.getElementById("seller-product-list");

  if (addProductForm && sellerProductList) {
    function loadSellerProducts() {
      sellerProductList.innerHTML = "";
      products.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("product-card");
        div.innerHTML = `
          <h3>${p.name}</h3>
          <p><strong>Category:</strong> ${p.category}</p>
          <p>₹${p.price}</p>
        `;
        sellerProductList.appendChild(div);
      });
    }

    loadSellerProducts();

    addProductForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("product-name").value.trim();
      const price = parseInt(document.getElementById("product-price").value.trim());
      const category = document.getElementById("product-category").value;

      if (!name || !price || !category) return;

      let emoji = "";
      if (category === "Academic") emoji = "📚";
      if (category === "Clothing") emoji = "👕";
      if (category === "Electronics") emoji = "💻";
      if (category === "Hostel Essentials") emoji = "🏠";

      const newProduct = { name: `${emoji} ${name}`, price, category };
      products.push(newProduct);
      localStorage.setItem("products", JSON.stringify(products));

      loadSellerProducts();
      addProductForm.reset();
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
    // --- Modal Logic ---
    const policyModal = document.getElementById('policy-modal');
    const acknowledgeCheckbox = document.getElementById('acknowledge-policy');
    const proceedButton = document.getElementById('proceed-btn');
    const mainPageContent = document.getElementById('main-page-content');

    if (policyModal) {
        policyModal.classList.remove('hidden');
        mainPageContent.classList.add('hidden');

        acknowledgeCheckbox.addEventListener('change', () => {
            proceedButton.disabled = !acknowledgeCheckbox.checked;
        });

        proceedButton.addEventListener('click', () => {
            if (acknowledgeCheckbox.checked) {
                policyModal.classList.add('hidden');
                mainPageContent.classList.remove('hidden');
                window.scrollTo(0, 0);
            }
        });
    }

    // --- EcoMart Form Logic (Seller Only) ---
    const form = document.getElementById('product-form');
    if (form) {
        const categorySelect = document.getElementById('category-select');
        const itemTypeSelect = document.getElementById('item-type-select');
        
        // REMOVED: transactionTypeRadios, priceLabel, and conditional field wrappers
        // as they are no longer dynamic.

        const itemTypesByCategory = {
            electronics: ['Laptops', 'Phones', 'Calculators', 'Headphones', 'Chargers'],
            books: ['Textbooks', 'Novels', 'Lab Manuals', 'Lecture Notes'],
            furniture: ['Chairs', 'Desks', 'Lamps', 'Shelves'],
            clothing: ['Hoodies', 'T-Shirts', 'Jackets', 'Accessories']
        };

        function updateItemTypes() {
            const selectedCategory = categorySelect.value;
            itemTypeSelect.innerHTML = '<option value="" disabled selected>Select an item type...</option>';
            
            if (selectedCategory && itemTypesByCategory[selectedCategory]) {
                itemTypeSelect.disabled = false;
                itemTypesByCategory[selectedCategory].forEach(itemType => {
                    const option = document.createElement('option');
                    option.value = itemType.toLowerCase().replace(/ /g, '-');
                    option.textContent = itemType;
                    itemTypeSelect.appendChild(option);
                });
            } else {
                itemTypeSelect.disabled = true;
            }
        }

        // REMOVED: The handleTransactionTypeChange function is no longer needed.

        function handleFormSubmit(event) {
            event.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            console.log("Form Submitted!", data);
            alert('Form data has been logged to the console. Check it with F12!');
            form.reset();
            updateItemTypes();
        }

        categorySelect.addEventListener('change', updateItemTypes);
        // REMOVED: Event listener for radio buttons.
        form.addEventListener('submit', handleFormSubmit);

        // Initial setup call for the form
        updateItemTypes();
    }
     document.getElementById("add-product-btn").addEventListener("click", () => {
    window.location.href = "sellerform.html"; // navigate to add product page
  });
});
// Get references to form and seller product list
const productForm = document.getElementById('product-form');
const sellerProductList = document.getElementById('seller-product-list');

productForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent page reload

    // Get form values
    const category = document.getElementById('category-select').value;
    const itemType = document.getElementById('item-type-select').value;
    const title = document.getElementById('listing-title').value;
    const description = document.getElementById('description').value;
    const condition = document.getElementById('condition-field').value;
    const price = document.getElementById('price-field').value;
    const location = document.getElementById('location-select').value;
    const photo = document.getElementById('photo-field').files[0];

    // Create a product card
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    let imgSrc = photo ? URL.createObjectURL(photo) : 'https://via.placeholder.com/200x150';
    
    productCard.innerHTML = `
        <img src="${imgSrc}" alt="Product Image">
        <div class="product-info">
            <h3 class="product-title">${title}</h3>
            <p class="product-category">Category: ${category} / ${itemType}</p>
            <p class="product-description">${description}</p>
            <p class="product-condition">Condition: ${condition}</p>
            <p class="product-price">₹${price}</p>
            <p class="product-location">Location: ${location}</p>
        </div>
    `;

    // Add to seller product list
    sellerProductList.appendChild(productCard);

    // Optionally reset the form
    productForm.reset();
});
