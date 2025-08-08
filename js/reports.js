document.addEventListener('DOMContentLoaded', function() {
    // Load alert settings
    loadAlertSettings();
    
    // Set up alert settings form
    const alertSettingsForm = document.getElementById('alert-settings-form');
    if (alertSettingsForm) {
        alertSettingsForm.addEventListener('submit', handleAlertSettingsSubmit);
    }
    
    // Set up report generation
    const generateReportBtn = document.getElementById('generate-report');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
});

function loadAlertSettings() {
    const settings = inventoryManager.getAlertSettings();
    
    document.getElementById('low-stock-alert').value = settings.lowStockThreshold;
    document.getElementById('expiration-alert').value = settings.expirationAlertDays;
    document.getElementById('email-alerts').checked = settings.emailAlerts;
    document.getElementById('alert-email').value = settings.alertEmail || '';
    
    // Show/hide email field based on checkbox
    const emailGroup = document.getElementById('email-group');
    if (emailGroup) {
        emailGroup.style.display = settings.emailAlerts ? 'block' : 'none';
    }
}

function handleAlertSettingsSubmit(event) {
    event.preventDefault();
    
    const settings = {
        lowStockThreshold: parseInt(document.getElementById('low-stock-alert').value),
        expirationAlertDays: parseInt(document.getElementById('expiration-alert').value),
        emailAlerts: document.getElementById('email-alerts').checked,
        alertEmail: document.getElementById('email-alerts').checked ? 
                   document.getElementById('alert-email').value : ''
    };
    
    inventoryManager.saveAlertSettings(settings);
    showAlert('Alert settings saved successfully', 'success');
}

function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const timePeriod = document.getElementById('time-period').value;
    
    let startDate, endDate;
    if (timePeriod === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
    } else {
        const now = new Date();
        endDate = now.toISOString().split('T')[0];
        
        if (timePeriod === '7days') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            startDate = sevenDaysAgo.toISOString().split('T')[0];
        } else if (timePeriod === '30days') {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            startDate = thirtyDaysAgo.toISOString().split('T')[0];
        } else {
            startDate = '1970-01-01'; // All time
        }
    }
    
    const table = document.getElementById('report-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    if (reportType === 'inventory-summary') {
        generateInventorySummaryReport(thead, tbody);
    } else if (reportType === 'expiration-report') {
        generateExpirationReport(thead, tbody);
    } else if (reportType === 'stock-movements') {
        generateStockMovementsReport(thead, tbody, startDate, endDate);
    }
}

function generateInventorySummaryReport(thead, tbody) {
    // Set up headers
    thead.innerHTML = `
        <tr>
            <th>Category</th>
            <th>Total Items</th>
            <th>In Stock</th>
            <th>Out of Stock</th>
            <th>Low Stock</th>
        </tr>
    `;
    
    // Get data
    const items = inventoryManager.getInventoryItems();
    const categories = inventoryManager.getCategories();
    const alertSettings = inventoryManager.getAlertSettings();
    
    // Group by category
    const categoryData = {};
    categories.forEach(category => {
        categoryData[category] = {
            total: 0,
            inStock: 0,
            outOfStock: 0,
            lowStock: 0
        };
    });
    
    items.forEach(item => {
        const category = item.category;
        if (!categoryData[category]) {
            categoryData[category] = {
                total: 0,
                inStock: 0,
                outOfStock: 0,
                lowStock: 0
            };
        }
        
        categoryData[category].total++;
        
        if (item.quantity > 0) {
            categoryData[category].inStock++;
            
            if (item.quantity <= item.lowStockThreshold) {
                categoryData[category].lowStock++;
            }
        } else {
            categoryData[category].outOfStock++;
        }
    });
    
    // Add rows
    for (const [category, data] of Object.entries(categoryData)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category}</td>
            <td>${data.total}</td>
            <td>${data.inStock}</td>
            <td>${data.outOfStock}</td>
            <td>${data.lowStock}</td>
        `;
        tbody.appendChild(row);
    }
}

function generateExpirationReport(thead, tbody) {
    // Set up headers
    thead.innerHTML = `
        <tr>
            <th>Item Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Expiration Date</th>
            <th>Days Left</th>
        </tr>
    `;
    
    // Get data
    const items = inventoryManager.getInventoryItems().filter(item => item.expirationDate);
    const alertSettings = inventoryManager.getAlertSettings();
    const now = new Date();
    
    // Sort by expiration date
    items.sort((a, b) => {
        const dateA = new Date(a.expirationDate);
        const dateB = new Date(b.expirationDate);
        return dateA - dateB;
    });
    
    // Add rows
    items.forEach(item => {
        const daysLeft = getDaysUntilExpiration(item.expirationDate);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.sku}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${formatDate(item.expirationDate)}</td>
            <td class="${daysLeft === 'Expired' ? 'text-danger' : (daysLeft <= alertSettings.expirationAlertDays ? 'text-warning' : '')}">
                ${daysLeft} ${daysLeft === 'Expired' ? '' : 'days'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function generateStockMovementsReport(thead, tbody, startDate, endDate) {
    // Set up headers
    thead.innerHTML = `
        <tr>
            <th>Date/Time</th>
            <th>Item</th>
            <th>SKU</th>
            <th>Action</th>
            <th>Quantity</th>
            <th>Previous</th>
            <th>New</th>
            <th>Notes</th>
        </tr>
    `;
    
    // Get data
    const movements = inventoryManager.getStockMovements();
    const items = inventoryManager.getInventoryItems();
    
    // Filter by date range
    const filteredMovements = movements.filter(movement => {
        const movementDate = movement.timestamp.split('T')[0];
        return movementDate >= startDate && movementDate <= endDate;
    });
    
    // Sort by timestamp (newest first)
    filteredMovements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Add rows
    filteredMovements.forEach(movement => {
        const item = items.find(i => i.id === movement.itemId);
        const sku = item ? item.sku : 'N/A';
        
        const actionLabel = movement.action === 'add' ? 'Addition' : 
                          movement.action === 'remove' ? 'Removal' : 
                          movement.action === 'sell' ? 'Sale' : movement.action;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(movement.timestamp)}</td>
            <td>${movement.itemName}</td>
            <td>${sku}</td>
            <td>${actionLabel}</td>
            <td>${movement.quantity}</td>
            <td>${movement.previousQuantity}</td>
            <td>${movement.newQuantity}</td>
            <td>${movement.notes || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString(undefined, options);
}