// هذا الملف مخصص فقط لتخزين بيانات الأطعمة والقيم الغذائية
// يمكنك إضافة وتعديل الأطعمة هنا بحرية تامة

const foodDatabase = [
    {
        id: 1,
        name: "تفاح متوسط",
        category: "فواكه",
        carbsPer100g: 14,
        gi: 36, // مؤشر نسبة السكر (Glycemic Index)
        servingSizeDesc: "حبة متوسطة (150 جم)"
    },
    {
        id: 2,
        name: "أرز أبيض مطبوخ",
        category: "نشويات",
        carbsPer100g: 28,
        gi: 73,
        servingSizeDesc: "كوب واحد (158 جم)"
    },
    {
        id: 3,
        name: "خبز أسمر",
        category: "مخبوزات",
        carbsPer100g: 43,
        gi: 53,
        servingSizeDesc: "شريحة واحدة (30 جم)"
    },
    {
        id: 4,
        name: "تمر",
        category: "فواكه",
        carbsPer100g: 75,
        gi: 42,
        servingSizeDesc: "حبة واحدة (7 جم)"
    }
    // انسخ نفس الهيكل لإضافة المزيد من الأطعمة هنا...
];