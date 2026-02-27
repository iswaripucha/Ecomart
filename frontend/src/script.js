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
    // Form Logic for both seller.html and sellerform.html
    const form = document.getElementById('product-form');
    if (form) {
        const categorySelect = document.getElementById('category-select');
        const itemTypeSelect = document.getElementById('item-type-select');
        
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

        // Set up category change handler
        categorySelect.addEventListener('change', updateItemTypes);
        
        // Initial setup call for the form
        updateItemTypes();
    }
});
// Form submission is now handled in seller.html
