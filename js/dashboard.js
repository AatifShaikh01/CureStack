document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard stats
    updateDashboardStats();
    
    // Load low stock items
    updateLowStockTable();
    
    // Load expiring soon items
    updateExpiringSoonTable();
});

function updateDashboardStats() {
    const stats = inventoryManager.getDashboardStats();
    
    document.getElementById('total-items').textContent = stats.totalItems;
    document.getElementById('out-of-stock').textContent = stats.outOfStock;
    document.getElementById('low-stock').textContent = stats.lowStock;
    document.getElementById('expiring-soon').textContent = stats.expiringSoon;
}

function updateLowStockTable() {
    const lowStockItems = inventoryManager.getLowStockItems();
    const tableBody = document.querySelector('#low-stock-table tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows
    lowStockItems.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.sku}</td>
            <td class="${item.quantity <= 0 ? 'text-danger' : 'text-warning'}">${item.quantity}</td>
            <td>${item.lowStockThreshold}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateExpiringSoonTable() {
    const expiringItems = inventoryManager.getExpiringSoonItems();
    const tableBody = document.querySelector('#expiring-table tbody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows
    expiringItems.forEach(item => {
        const daysLeft = getDaysUntilExpiration(item.expirationDate);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.sku}</td>
            <td>${formatDate(item.expirationDate)}</td>
            <td class="${daysLeft === 'Expired' ? 'text-danger' : 'text-warning'}">
                ${daysLeft} ${daysLeft === 'Expired' ? '' : 'days'}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}