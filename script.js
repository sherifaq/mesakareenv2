// ==========================================
// المتغيرات لحفظ حالة التطبيق
// ==========================================
let currentCalculatorItems = [];
let dailyLogs = [];
let currentSelectedFood = null; 
let textModalCallback = null;
let confirmModalCallback = null;
let currentCategory = 'all'; // التصنيف الافتراضي للفلترة

// ==========================================
// نظام الحفظ في ذاكرة المتصفح (LocalStorage)
// ==========================================
function saveLogsToStorage() {
    localStorage.setItem('maskareen_logs', JSON.stringify(dailyLogs));
}

function loadLogsFromStorage() {
    const storedLogs = localStorage.getItem('maskareen_logs');
    if (storedLogs) {
        dailyLogs = JSON.parse(storedLogs);
    }
}

// ==========================================
// التهيئة عند تحميل الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    
    // تشغيل القائمة المنسدلة للبحث والتصنيفات
    initSearchAndTabs(); 
    
    // عرض الأطعمة الافتراضي
    renderFoodList(foodDatabase);
    
    // استرجع السجلات وعرضها
    loadLogsFromStorage();
    renderLogsUI();
});

// ==========================================
// 1. نظام التنقل والبحث والقائمة المنسدلة
// ==========================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function initSearchAndTabs() {
    buildCategoryDropdown();
    setupAdvancedSearch();
}

// بناء القائمة المنسدلة للتصنيفات من قاعدة البيانات
function buildCategoryDropdown() {
    const selectElement = document.getElementById('categorySelect');
    if (!selectElement) return;

    // إعادة ضبط القائمة بوضع الخيار الافتراضي "الكل"
    selectElement.innerHTML = '<option value="all">الكل</option>';

    // استخراج التصنيفات الفريدة من الداتا (تجاهل الفراغات والتصنيفات غير المرغوبة)
    const categories = [...new Set(foodDatabase.map(food => food.category))].filter(Boolean);
    
    categories.forEach(category => {
        if(category === "أخرى" || category.toLowerCase() === "nan") return;
        
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        selectElement.appendChild(option);
    });

    // الاستماع لحدث تغيير الاختيار من القائمة المنسدلة
    selectElement.addEventListener('change', (e) => {
        currentCategory = e.target.value;
        filterFoods();
    });
}

function setupAdvancedSearch() {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', () => {
            filterFoods();
        });
    }
}

// دالة الفلترة (تبحث في الاسم، التصنيف، والأسماء البديلة)
function filterFoods() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    const filtered = foodDatabase.filter(food => {
        // فلترة التصنيف
        const matchCategory = (currentCategory === 'all') || (food.category === currentCategory);
        
        // فلترة البحث النصي (في الاسم، الـ aliases، والـ subcategory)
        const nameMatch = food.name.toLowerCase().includes(searchTerm);
        const aliasesStr = food.aliases ? String(food.aliases).toLowerCase() : "";
        const aliasesMatch = aliasesStr.includes(searchTerm);
        const subCatMatch = food.subcategory ? String(food.subcategory).toLowerCase().includes(searchTerm) : false;

        const matchSearch = searchTerm === '' || nameMatch || aliasesMatch || subCatMatch;
        
        return matchCategory && matchSearch;
    });
    
    renderFoodList(filtered);
}

// عرض قائمة الأطعمة
function renderFoodList(foods) {
    const listContainer = document.getElementById('foodList');
    if(!listContainer) return;
    listContainer.innerHTML = ''; 

    if(foods.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">لم يتم العثور على أطعمة تطابق بحثك.</p>';
        return;
    }

    foods.forEach(food => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'food-item';
        
        // تأمين القيم في حالة عدم وجودها
        const p = (food.protein !== undefined) ? food.protein : 0;
        const f = (food.fat !== undefined) ? food.fat : 0;
        const subCat = (food.subcategory && food.subcategory.toLowerCase() !== 'nan') ? `<span style="font-size: 0.7rem; background:#e5e7eb; padding:2px 6px; border-radius:10px; margin-right:5px;">${food.subcategory}</span>` : '';

        itemDiv.innerHTML = `
            <div class="food-info">
                <h3>${food.name}</h3>
                <p>
                    <span style="color:#177a67; font-weight:bold;">كارب: ${food.carbsPer100g}جم</span> | 
                    <span style="color:#b91c1c;">بروتين: ${p}جم</span> | 
                    <span style="color:#b45309;">دهون: ${f}جم</span>
                </p>
                <p style="font-size: 0.75rem; margin-top: 4px; color:#6b7280;">
                    مؤشر السكر (GI): <b>${food.gi}</b> | الحصة المرجعية: ${food.servingSizeDesc}
                    ${subCat}
                </p>
            </div>
            <button class="add-btn" onclick="askForWeightAndAdd(${food.id})">إضافة +</button>
        `;
        listContainer.appendChild(itemDiv);
    });
}

// ==========================================
// 2. نافذة إدخال الوزن (Weight Modal)
// ==========================================
function askForWeightAndAdd(foodId) {
    const food = foodDatabase.find(f => f.id === foodId);
    
    if(food) {
        currentSelectedFood = food; 
        document.getElementById('modalFoodName').innerText = food.name;
        document.getElementById('modalWeightInput').value = "100"; 
        
        document.getElementById('weightModal').classList.add('show');
        
        setTimeout(() => {
            document.getElementById('modalWeightInput').focus();
            document.getElementById('modalWeightInput').select();
        }, 300);
    }
}

function closeWeightModal() {
    document.getElementById('weightModal').classList.remove('show');
    currentSelectedFood = null;
}

function confirmWeightAndAdd() {
    if (!currentSelectedFood) return;

    const weightInput = document.getElementById('modalWeightInput').value;
    const weightInGrams = parseFloat(weightInput);

    if (!isNaN(weightInGrams) && weightInGrams > 0) {
        currentCalculatorItems.push({
            ...currentSelectedFood,
            amountGrams: weightInGrams
        });
        
        updateCalculatorUI();
        closeWeightModal();
    } else {
        alert("يرجى إدخال رقم صحيح وموجب للوزن.");
    }
}

document.getElementById('weightModal').addEventListener('click', function(e) {
    if (e.target === this) closeWeightModal();
});

document.getElementById('modalWeightInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') confirmWeightAndAdd();
});

// ==========================================
// 3. مدير النوافذ المنبثقة العامة (Custom Modals)
// ==========================================
function openTextInputModal(title, desc, initialValue, callback) {
    document.getElementById('textModalTitle').innerText = title;
    document.getElementById('textModalDesc').innerText = desc;
    
    const input = document.getElementById('textModalInput');
    input.value = initialValue || '';
    textModalCallback = callback;
    
    document.getElementById('textInputModal').classList.add('show');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 200);
}

function closeTextInputModal() {
    document.getElementById('textInputModal').classList.remove('show');
    textModalCallback = null;
}

document.getElementById('textModalConfirmBtn').addEventListener('click', () => {
    const value = document.getElementById('textModalInput').value.trim();
    if (value && textModalCallback) {
        const cb = textModalCallback;
        closeTextInputModal();
        cb(value);
    }
});

document.getElementById('textModalInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('textModalConfirmBtn').click();
});

function openConfirmModal(title, desc, isDanger, callback) {
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalDesc').innerText = desc;
    confirmModalCallback = callback;

    const actionBtn = document.getElementById('confirmModalActionBtn');
    if (isDanger) {
        actionBtn.classList.add('btn-danger');
    } else {
        actionBtn.classList.remove('btn-danger');
    }

    document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    confirmModalCallback = null;
}

document.getElementById('confirmModalActionBtn').addEventListener('click', () => {
    if (confirmModalCallback) {
        const cb = confirmModalCallback;
        closeConfirmModal();
        cb();
    }
});

document.getElementById('textInputModal').addEventListener('click', function(e) {
    if (e.target === this) closeTextInputModal();
});

document.getElementById('confirmModal').addEventListener('click', function(e) {
    if (e.target === this) closeConfirmModal();
});

// ==========================================
// 4. الحاسبة (مع نصيحة الحمل الجلايسيمي)
// ==========================================
function updateCalculatorUI() {
    const calcContainer = document.getElementById('calculatorItems');
    let totalCarbs = 0;
    let totalGL = 0;

    if (currentCalculatorItems.length === 0) {
        calcContainer.innerHTML = '<p class="empty-state">لم تقم بإضافة أطعمة للحاسبة بعد.</p>';
    } else {
        calcContainer.innerHTML = '';
        currentCalculatorItems.forEach((item, index) => {
            const actualCarbs = (item.carbsPer100g * item.amountGrams) / 100;
            const actualGL = (actualCarbs * item.gi) / 100;

            totalCarbs += actualCarbs;
            totalGL += actualGL;

            const itemUI = document.createElement('div');
            itemUI.className = 'food-item';
            itemUI.innerHTML = `
                <div class="food-info">
                    <h3>${item.name}</h3>
                    <p>الكمية المدخلة: ${item.amountGrams} جم</p>
                </div>
                <div style="text-align: left;">
                    <p style="font-weight:bold; color:var(--primary-dark);">${actualCarbs.toFixed(1)} جم كارب</p>
                    <button onclick="removeFromCalculator(${index})" style="background:none; border:none; color:red; cursor:pointer; margin-top:5px; font-weight:bold;">حذف 🗑️</button>
                </div>
            `;
            calcContainer.appendChild(itemUI);
        });
    }

    document.getElementById('totalCarbs').innerText = totalCarbs.toFixed(1) + ' جم';
    document.getElementById('totalGL').innerText = totalGL.toFixed(1);
    
    const saveBtn = document.getElementById('saveMealBtn');
    if (currentCalculatorItems.length > 0) {
        saveBtn.style.display = 'flex';
    } else {
        saveBtn.style.display = 'none';
    }

    const adviceBox = document.getElementById('glAdviceBox');
    const adviceText = document.getElementById('glAdviceText');
    const adviceIcon = document.getElementById('glAdviceIcon');

    if (currentCalculatorItems.length > 0 && adviceBox) {
        adviceBox.style.display = 'flex';
        
        if (totalGL <= 10) {
            adviceBox.className = 'gl-advice-box low';
            adviceIcon.innerText = '🟢';
            adviceText.innerHTML = '<strong>حمل جلايسيمي منخفض (GL ≤ 10):</strong> تأثير الوجبة هادئ وبطيء على مستويات سكر الدم.';
        } else if (totalGL <= 19) {
            adviceBox.className = 'gl-advice-box medium';
            adviceIcon.innerText = '🟡';
            adviceText.innerHTML = '<strong>حمل جلايسيمي متوسط (GL 11 - 19):</strong> تأثير متوسط على سكر الدم. يُفضل المراقبة المعتادة بعد الوجبة.';
        } else {
            adviceBox.className = 'gl-advice-box high';
            adviceIcon.innerText = '⚠️';
            adviceText.innerHTML = '<strong>حمل جلايسيمي مرتفع (GL ≥ 20):</strong> قد تؤدي هذه الوجبة إلى ارتفاع سريع أو متأخر في سكر الدم. يُنصح بمراقبة السكر بعد الوجبة (من 2 إلى 4 ساعات).';
        }
    } else if (adviceBox) {
        adviceBox.style.display = 'none';
    }
}

function removeFromCalculator(index) {
    currentCalculatorItems.splice(index, 1);
    updateCalculatorUI();
}

// ==========================================
// 5. سجل الوجبات
// ==========================================
function getFormattedArabicDate() {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ar-SA', options); 
}

function saveMealToLogs(mealName) {
    let mealTotalCarbs = 0;
    let mealTotalGL = 0;
    
    currentCalculatorItems.forEach(item => {
        const actualCarbs = (item.carbsPer100g * item.amountGrams) / 100;
        const actualGL = (actualCarbs * item.gi) / 100;
        mealTotalCarbs += actualCarbs;
        mealTotalGL += actualGL;
    });

    const newMealRecord = {
        id: Date.now(),
        name: mealName,
        dateString: getFormattedArabicDate(),
        items: [...currentCalculatorItems],
        totalCarbs: mealTotalCarbs,
        totalGL: mealTotalGL
    };

    dailyLogs.push(newMealRecord);
    saveLogsToStorage();

    currentCalculatorItems = [];
    updateCalculatorUI();
    renderLogsUI();
    
    document.querySelector('.nav-item[data-target="tab-logs"]').click();
}

function promptSaveMeal() {
    if (currentCalculatorItems.length === 0) return;
    openTextInputModal("حفظ الوجبة في السجل 💾", "أدخل اسماً للوجبة (مثال: الفطور، الغداء، سناكس):", "الفطور", function(mealName) {
        saveMealToLogs(mealName);
    });
}

function renderLogsUI() {
    const logsContainer = document.getElementById('logsContainer');
    const emptyMessage = document.getElementById('emptyLogsMessage');

    if (dailyLogs.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        logsContainer.innerHTML = '';
        if (emptyMessage) logsContainer.appendChild(emptyMessage);
        return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';
    logsContainer.innerHTML = '';

    const reversedLogs = [...dailyLogs].reverse();

    reversedLogs.forEach(meal => {
        const mealCard = document.createElement('div');
        mealCard.className = 'log-meal-card';

        let itemsHTML = '<ul>';
        meal.items.forEach(item => {
            const itemCarbs = ((item.carbsPer100g * item.amountGrams) / 100).toFixed(1);
            itemsHTML += `
                <li>
                    <span>${item.name} (${item.amountGrams}جم)</span>
                    <span>${itemCarbs} كارب</span>
                </li>`;
        });
        itemsHTML += '</ul>';

        mealCard.innerHTML = `
            <div class="log-meal-header">
                <div>
                    <span class="log-meal-title">${meal.name}</span>
                    <span class="date-badge" style="margin-right: 8px;">${meal.dateString}</span>
                </div>
                <div class="log-actions">
                    <button class="action-icon-btn edit" onclick="editMealTitle(${meal.id})" title="تعديل اسم الوجبة">✏️</button>
                    <button class="action-icon-btn delete" onclick="deleteMealFromLogs(${meal.id})" title="حذف الوجبة">🗑️</button>
                </div>
            </div>
            <div class="log-meal-items">
                ${itemsHTML}
            </div>
            <div class="log-meal-footer">
                <span>الإجمالي:</span>
                <span>${meal.totalCarbs.toFixed(1)} جم كارب | GL: ${meal.totalGL.toFixed(1)}</span>
            </div>
            <div class="log-meal-footer-actions">
                <button class="btn-reload-calc" onclick="reloadMealToCalculator(${meal.id})">
                    🔄 استرجاع للحاسبة للتعديل
                </button>
            </div>
        `;
        logsContainer.appendChild(mealCard);
    });
}

function editMealTitle(mealId) {
    const meal = dailyLogs.find(m => m.id === mealId);
    if (!meal) return;
    openTextInputModal("تعديل اسم الوجبة ✏️", "أدخل الاسم الجديد للوجبة:", meal.name, function(newName) {
        meal.name = newName;
        saveLogsToStorage();
        renderLogsUI();
    });
}

function deleteMealFromLogs(mealId) {
    const meal = dailyLogs.find(m => m.id === mealId);
    if (!meal) return;
    openConfirmModal("حذف الوجبة 🗑️", `هل أنت متأكد من حذف وجبة "${meal.name}" من السجل؟`, true, function() {
        dailyLogs = dailyLogs.filter(m => m.id !== mealId);
        saveLogsToStorage();
        renderLogsUI();
    });
}

function reloadMealToCalculator(mealId) {
    const mealIndex = dailyLogs.findIndex(m => m.id === mealId);
    if (mealIndex === -1) return;
    const meal = dailyLogs[mealIndex];
    openConfirmModal("تعديل مكونات الوجبة 🔄", `سيتم نقل عناصر وجبة "${meal.name}" للحاسبة لتعديل الأطعمة والأوزان، وسُتحذف من السجل لحفظها مجدداً. هل ترغب بالاستمرار؟`, false, function() {
        currentCalculatorItems = [...meal.items];
        dailyLogs.splice(mealIndex, 1);
        saveLogsToStorage();
        updateCalculatorUI();
        renderLogsUI();
        document.querySelector('.nav-item[data-target="tab-calculator"]').click();
    });
}