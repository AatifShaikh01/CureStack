document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals
    const itemModal = initializeModal('item-modal', 'add-item-btn', 'cancel-btn');
    const stockModal = initializeModal('stock-modal', null, 'cancel-stock-btn');
    const sellModal = initializeModal('sell-modal', null, 'cancel-sell-btn');
    
    // Load inventory table
    updateInventoryTable();
    
    // Set up form submission for item add/edit
    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemFormSubmit);
    }
    
    // Set up form submission for stock adjustment
    const stockForm = document.getElementById('stock-form');
    if (stockForm) {
        stockForm.addEventListener('submit', handleStockFormSubmit);
    }
    
    // Set up form submission for sell
    const sellForm = document.getElementById('sell-form');
    if (sellForm) {
        sellForm.addEventListener('submit', handleSellFormSubmit);
    }
    
    // Set up search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', updateInventoryTable);
    }
    
    // Set up category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateInventoryTable);
        
        // Populate category filter
        const categories = inventoryManager.getCategories();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
});

function updateInventoryTable() {
    const items = inventoryManager.getInventoryItems();
    const tableBody = document.querySelector('#inventory-table tbody');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Filter items based on search and category
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                             item.sku.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    // Add new rows
    filteredItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Determine quantity display class
        let quantityClass = '';
        if (item.quantity <= 0) {
            quantityClass = 'text-danger';
        } else if (item.quantity <= item.lowStockThreshold) {
            quantityClass = 'text-warning';
        }
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.sku}</td>
            <td>${item.category}</td>
            <td class="${quantityClass}">${item.quantity}</td>
            <td>${formatDate(item.expirationDate)}</td>
            <td>${item.supplier || 'N/A'}</td>
            <td>${item.location || 'N/A'}</td>
            <td class="actions">
                <button class="btn small primary edit-btn" data-id="${item.id}">Edit</button>
                <button class="btn small secondary stock-btn" data-id="${item.id}">Stock</button>
                <button class="btn small warning sell-btn" data-id="${item.id}">Sell</button>
                <button class="btn small danger delete-btn" data-id="${item.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });
    
    document.querySelectorAll('.stock-btn').forEach(btn => {
        btn.addEventListener('click', handleStockClick);
    });
    
    document.querySelectorAll('.sell-btn').forEach(btn => {
        btn.addEventListener('click', handleSellClick);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });
}

function handleEditClick(event) {
    const itemId = event.target.getAttribute('data-id');
    const item = inventoryManager.getItemById(itemId);
    
    if (!item) return;
    
    // Populate the form
    document.getElementById('modal-title').textContent = 'Edit Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-sku').value = item.sku;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-expiration').value = item.expirationDate || '';
    document.getElementById('item-supplier').value = item.supplier || '';
    document.getElementById('item-location').value = item.location || '';
    document.getElementById('item-threshold').value = item.lowStockThreshold;
    
    // Show the modal
    document.getElementById('item-modal').style.display = 'block';
}

function handleStockClick(event) {
    const itemId = event.target.getAttribute('data-id');
    const item = inventoryManager.getItemById(itemId);
    
    if (!item) return;
    
    // Populate the form
    document.getElementById('stock-item-id').value = item.id;
    document.getElementById('stock-item-name').value = item.name;
    document.getElementById('stock-quantity').value = '';
    document.getElementById('stock-notes').value = '';
    
    // Show the modal
    document.getElementById('stock-modal').style.display = 'block';
}

function handleSellClick(event) {
    const itemId = event.target.getAttribute('data-id');
    const item = inventoryManager.getItemById(itemId);
    
    if (!item) return;
    
    // Populate the form
    document.getElementById('sell-item-id').value = item.id;
    document.getElementById('sell-item-name').value = item.name;
    document.getElementById('sell-quantity').value = '';
    document.getElementById('sell-details').value = '';
    
    // Show the modal
    document.getElementById('sell-modal').style.display = 'block';
}

function handleDeleteClick(event) {
    const itemId = event.target.getAttribute('data-id');
    
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        const success = inventoryManager.deleteItem(itemId);
        if (success) {
            showAlert('Item deleted successfully', 'success');
            updateInventoryTable();
        } else {
            showAlert('Failed to delete item', 'danger');
        }
    }
}

function handleItemFormSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const id = document.getElementById('item-id').value;
    const name = document.getElementById('item-name').value;
    const sku = document.getElementById('item-sku').value;
    const category = document.getElementById('item-category').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);
    const expirationDate = document.getElementById('item-expiration').value;
    const supplier = document.getElementById('item-supplier').value;
    const location = document.getElementById('item-location').value;
    const lowStockThreshold = parseInt(document.getElementById('item-threshold').value);
    
    // Create item object
    const item = {
        id: id || inventoryManager.generateId(),
        name,
        sku,
        category,
        quantity,
        expirationDate: expirationDate || null,
        supplier,
        location,
        lowStockThreshold
    };
    
    // Save the item
    let success;
    if (id) {
        success = inventoryManager.updateItem(item);
    } else {
        inventoryManager.addItem(item);
        success = true;
    }
    
    if (success) {
        showAlert(`Item ${id ? 'updated' : 'added'} successfully`, 'success');
        updateInventoryTable();
        document.getElementById('item-modal').style.display = 'none';
        document.getElementById('item-form').reset();
    } else {
        showAlert('Failed to save item', 'danger');
    }
}

function handleStockFormSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const itemId = document.getElementById('stock-item-id').value;
    const action = document.getElementById('stock-action').value;
    const quantity = parseInt(document.getElementById('stock-quantity').value);
    const notes = document.getElementById('stock-notes').value;
    
    // Get the item
    const item = inventoryManager.getItemById(itemId);
    if (!item) {
        showAlert('Item not found', 'danger');
        return;
    }
    
    // Update quantity based on action
    let newQuantity = item.quantity;
    if (action === 'add') {
        newQuantity += quantity;
    } else if (action === 'remove') {
        newQuantity = Math.max(0, newQuantity - quantity);
    }
    
    // Create stock movement record
    const movement = {
        id: inventoryManager.generateId(),
        itemId,
        itemName: item.name,
        action,
        quantity,
        previousQuantity: item.quantity,
        newQuantity,
        timestamp: new Date().toISOString(),
        notes
    };
    
    // Update the item
    const updatedItem = { ...item, quantity: newQuantity };
    const success = inventoryManager.updateItem(updatedItem);
    
    if (success) {
        inventoryManager.addStockMovement(movement);
        showAlert('Stock updated successfully', 'success');
        updateInventoryTable();
        document.getElementById('stock-modal').style.display = 'none';
        document.getElementById('stock-form').reset();
    } else {
        showAlert('Failed to update stock', 'danger');
    }
}

function handleSellFormSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const itemId = document.getElementById('sell-item-id').value;
    const quantity = parseInt(document.getElementById('sell-quantity').value);
    const saleDetails = document.getElementById('sell-details').value;
    
    // Get the item
    const item = inventoryManager.getItemById(itemId);
    if (!item) {
        showAlert('Item not found', 'danger');
        return;
    }
    
    // Record the sale
    const success = inventoryManager.recordSale(itemId, quantity, saleDetails);
    
    if (success) {
        showAlert('Sale recorded successfully', 'success');
        updateInventoryTable();
        document.getElementById('sell-modal').style.display = 'none';
        document.getElementById('sell-form').reset();
    } else {
        showAlert('Failed to record sale. Insufficient stock.', 'danger');
    }
}