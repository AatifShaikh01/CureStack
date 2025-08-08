class InventoryManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem('inventoryItems')) {
            localStorage.setItem('inventoryItems', JSON.stringify([]));
        }

        if (!localStorage.getItem('stockMovements')) {
            localStorage.setItem('stockMovements', JSON.stringify([]));
        }

        if (!localStorage.getItem('alertSettings')) {
            localStorage.setItem('alertSettings', JSON.stringify({
                lowStockThreshold: 10,
                expirationAlertDays: 30,
                emailAlerts: false,
                alertEmail: ''
            }));
        }

        // Initialize with sample data if empty (for demo purposes)
        const items = this.getInventoryItems();
        if (items.length === 0) {
            const sampleItems = [
                {
                    id: '1',
                    name: 'Aspirin 81mg',
                    sku: 'MED001',
                    category: 'Painkillers',
                    quantity: 150,
                    expirationDate: '2023-12-31',
                    supplier: 'PharmaCorp',
                    location: 'Shelf A-3, Cabinet 2',
                    lowStockThreshold: 50
                },
                {
                    id: '2',
                    name: 'Bandage (Medium)',
                    sku: 'MED002',
                    category: 'First Aid',
                    quantity: 42,
                    expirationDate: '2025-06-30',
                    supplier: 'MediSupplies',
                    location: 'Shelf B-1, Cabinet 1',
                    lowStockThreshold: 30
                },
                {
                    id: '3',
                    name: 'Antibiotic Ointment',
                    sku: 'MED003',
                    category: 'Topical',
                    quantity: 8,
                    expirationDate: '2023-11-15',
                    supplier: 'HealthPlus',
                    location: 'Shelf A-2, Cabinet 3',
                    lowStockThreshold: 15
                },
                {
                    id: '4',
                    name: 'Sterile Gloves (Large)',
                    sku: 'MED004',
                    category: 'Surgical Supplies',
                    quantity: 0,
                    expirationDate: '2024-03-01',
                    supplier: 'SafeMed',
                    location: 'Shelf C-1, Cabinet 2',
                    lowStockThreshold: 20
                },
                {
                    id: '5',
                    name: 'Ibuprofen 200mg',
                    sku: 'MED005',
                    category: 'Painkillers',
                    quantity: 25,
                    expirationDate: '2024-05-20',
                    supplier: 'PharmaCorp',
                    location: 'Shelf A-3, Cabinet 1',
                    lowStockThreshold: 30
                }
            ];
            localStorage.setItem('inventoryItems', JSON.stringify(sampleItems));
        }
    }

    // Inventory Item Methods
    getInventoryItems() {
        return JSON.parse(localStorage.getItem('inventoryItems')) || [];
    }

    saveInventoryItems(items) {
        localStorage.setItem('inventoryItems', JSON.stringify(items));
    }

    getItemById(id) {
        const items = this.getInventoryItems();
        return items.find(item => item.id === id);
    }

    addItem(item) {
        const items = this.getInventoryItems();
        items.push(item);
        this.saveInventoryItems(items);
        return item;
    }

    updateItem(updatedItem) {
        const items = this.getInventoryItems();
        const index = items.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
            items[index] = updatedItem;
            this.saveInventoryItems(items);
            return true;
        }
        return false;
    }

    deleteItem(id) {
        const items = this.getInventoryItems();
        const filteredItems = items.filter(item => item.id !== id);
        this.saveInventoryItems(filteredItems);
        return filteredItems.length !== items.length;
    }

    // Stock Movement Methods
    getStockMovements() {
        return JSON.parse(localStorage.getItem('stockMovements')) || [];
    }

    saveStockMovements(movements) {
        localStorage.setItem('stockMovements', JSON.stringify(movements));
    }

    addStockMovement(movement) {
        const movements = this.getStockMovements();
        movements.push(movement);
        this.saveStockMovements(movements);
        return movement;
    }

    // Alert Settings Methods
    getAlertSettings() {
        return JSON.parse(localStorage.getItem('alertSettings'));
    }

    saveAlertSettings(settings) {
        localStorage.setItem('alertSettings', JSON.stringify(settings));
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getCategories() {
        const items = this.getInventoryItems();
        const categories = new Set(items.map(item => item.category));
        return Array.from(categories);
    }

    // Dashboard Data Methods
    getDashboardStats() {
        const items = this.getInventoryItems();
        const alertSettings = this.getAlertSettings();
        const now = new Date();
        
        const totalItems = items.length;
        const outOfStock = items.filter(item => item.quantity <= 0).length;
        
        const lowStockThreshold = alertSettings.lowStockThreshold;
        const lowStock = items.filter(item => 
            item.quantity > 0 && item.quantity <= item.lowStockThreshold
        ).length;
        
        const expiringSoon = items.filter(item => {
            if (!item.expirationDate) return false;
            const expDate = new Date(item.expirationDate);
            const diffTime = expDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 && diffDays <= alertSettings.expirationAlertDays;
        }).length;
        
        return {
            totalItems,
            outOfStock,
            lowStock,
            expiringSoon
        };
    }

    getLowStockItems() {
        const items = this.getInventoryItems();
        return items.filter(item => 
            item.quantity > 0 && item.quantity <= item.lowStockThreshold
        ).sort((a, b) => a.quantity - b.quantity);
    }

    getExpiringSoonItems() {
        const items = this.getInventoryItems();
        const alertSettings = this.getAlertSettings();
        const now = new Date();
        
        return items.filter(item => {
            if (!item.expirationDate) return false;
            const expDate = new Date(item.expirationDate);
            const diffTime = expDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 && diffDays <= alertSettings.expirationAlertDays;
        }).sort((a, b) => {
            const dateA = new Date(a.expirationDate);
            const dateB = new Date(b.expirationDate);
            return dateA - dateB;
        });
    }

    getOutOfStockItems() {
        const items = this.getInventoryItems();
        return items.filter(item => item.quantity <= 0);
    }

    // New method for selling items
    recordSale(itemId, quantity, saleDetails) {
        const item = this.getItemById(itemId);
        if (!item) return false;
        
        if (item.quantity < quantity) {
            return false; // Not enough stock
        }

        const newQuantity = Math.max(0, item.quantity - quantity);
        const updatedItem = { ...item, quantity: newQuantity };
        
        const success = this.updateItem(updatedItem);
        if (success) {
            const movement = {
                id: this.generateId(),
                itemId,
                itemName: item.name,
                action: 'sell',
                quantity,
                previousQuantity: item.quantity,
                newQuantity,
                timestamp: new Date().toISOString(),
                notes: saleDetails || ''
            };
            this.addStockMovement(movement);
        }
        return success;
    }
}

// Initialize the inventory manager
const inventoryManager = new InventoryManager();

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function getDaysUntilExpiration(expirationDate) {
    if (!expirationDate) return 'N/A';
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 'Expired';
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 3000);
}

// Initialize modals
function initializeModal(modalId, openBtnId = null, closeBtnId = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Open modal if open button exists
    if (openBtnId) {
        const openBtn = document.getElementById(openBtnId);
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        }
    }

    // Close modal when clicking X
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking cancel button if exists
    if (closeBtnId) {
        const cancelBtn = document.getElementById(closeBtnId);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    return modal;
}

// Initialize dropdowns and other UI elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize category dropdowns
    const categoryDropdowns = document.querySelectorAll('select[id$="category"]');
    if (categoryDropdowns.length > 0) {
        const categories = inventoryManager.getCategories();
        categoryDropdowns.forEach(dropdown => {
            // Clear existing options except the first one
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }
            
            // Add categories
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                dropdown.appendChild(option);
            });
        });
    }

    // Initialize email alerts toggle
    const emailAlertsCheckbox = document.getElementById('email-alerts');
    const emailGroup = document.getElementById('email-group');
    if (emailAlertsCheckbox && emailGroup) {
        emailAlertsCheckbox.addEventListener('change', function() {
            emailGroup.style.display = this.checked ? 'block' : 'none';
        });
    }

    // Initialize time period filter
    const timePeriod = document.getElementById('time-period');
    const customRangeGroup = document.getElementById('custom-range-group');
    if (timePeriod && customRangeGroup) {
        timePeriod.addEventListener('change', function() {
            customRangeGroup.style.display = this.value === 'custom' ? 'flex' : 'none';
        });
    }
});