Under Admin Dashboard -> morepage -> system settings or rename pricing setting

make sure backend and frontend are properly connected

only feilds required:
1- req:name": "GST", "percent": 18, "code": "GST", "inclusive": false (admin must be able to change gst percent)
2- "globalDiscountPercent": 10,(admin must be able to change globalDiscountPercent)
3- "serviceChargePercent": 5,(admin must be able to change serviceChargePercent)
4- Admin must be able to activate the pricing setting

POST {{base_url}}/api/{{rid}}/admin/pricing

{
"taxes": [
{ "name": "GST", "percent": 18, "code": "GST", "inclusive": false },
{ "name": "Service Tax", "percent": 0, "code": "SVCTAX", "inclusive": false }
],
"globalDiscountPercent": 10,
"serviceChargePercent": 5,
"createdBy": "manager",
"reason": "Festive Offer",
"effectiveFrom": "2025-10-15T00:00:00Z",
"activate": true,

"offers": [
{
"code": "FIRST20",
"title": "Welcome Offer",
"description": "20% off on your first order",
"discountType": "percent",
"discountValue": 20,
"minOrderValue": 300,
"maxDiscountValue": 100,
"validFrom": "2025-10-15T00:00:00Z",
"validTill": "2025-12-31T23:59:59Z",
"isActive": true
},
{
"code": "SAVE50",
"title": "Big Savings",
"description": "₹50 off on orders above ₹500",
"discountType": "flat",
"discountValue": 50,
"minOrderValue": 500,
"maxDiscountValue": 50,
"validFrom": "2025-10-15T00:00:00Z",
"isActive": true
},
{
"code": "FAMILY15",
"title": "Family Feast",
"description": "15% off on orders above ₹800",
"discountType": "percent",
"discountValue": 15,
"minOrderValue": 800,
"maxDiscountValue": 150,
"validFrom": "2025-10-15T00:00:00Z",
"isActive": true
}
]
}

res:
{
"admin": {
"\_id": "691c8c61fce5b87e6264c766",
"restaurantId": "dominos-aadarsh-nagar-5635",
"restaurantName": "Dominos Aadarsh Nagar",
"ownerName": "Rahul Singh",
"phone": "9876543210",
"email": "rahul.singh@dominos.com",
"staffAliases": [],
"waiterNames": [
"Pankaj S",
"Rahul"
],
"pricingConfigs": [
{
"version": 1,
"active": false,
"effectiveFrom": "2025-10-15T00:00:00.000Z",
"globalDiscountPercent": 10,
"serviceChargePercent": 5,
"taxes": [
{
"name": "GST",
"percent": 18,
"code": "GST",
"inclusive": false,
"_id": "6920303acc8c0f4ab23f86c4"
},
{
"name": "Service Tax",
"percent": 0,
"code": "SVCTAX",
"inclusive": false,
"_id": "6920303acc8c0f4ab23f86c5"
}
],
"createdBy": "manager",
"reason": "Festive Offer",
"createdAt": "2025-11-21T09:26:18.337Z",
"offers": [
{
"code": "FIRST20",
"title": "Welcome Offer",
"description": "20% off on your first order",
"discountType": "percent",
"discountValue": 20,
"minOrderValue": 300,
"maxDiscountValue": 100,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": "2025-12-31T23:59:59.000Z"
},
{
"code": "SAVE50",
"title": "Big Savings",
"description": "₹50 off on orders above ₹500",
"discountType": "flat",
"discountValue": 50,
"minOrderValue": 500,
"maxDiscountValue": 50,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
},
{
"code": "FAMILY15",
"title": "Family Feast",
"description": "15% off on orders above ₹800",
"discountType": "percent",
"discountValue": 15,
"minOrderValue": 800,
"maxDiscountValue": 150,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
}
],
"\_id": "6920303acc8c0f4ab23f86c3"
},
{
"version": 2,
"active": true,
"effectiveFrom": "2025-10-15T00:00:00.000Z",
"globalDiscountPercent": 10,
"serviceChargePercent": 5,
"taxes": [
{
"name": "GST",
"percent": 18,
"code": "GST",
"inclusive": false,
"_id": "69247d4971f7eb127f5cff1a"
},
{
"name": "Service Tax",
"percent": 0,
"code": "SVCTAX",
"inclusive": false,
"_id": "69247d4971f7eb127f5cff1b"
}
],
"createdBy": "manager",
"reason": "Festive Offer",
"createdAt": "2025-11-24T15:44:09.289Z",
"offers": [
{
"code": "FIRST20",
"title": "Welcome Offer",
"description": "20% off on your first order",
"discountType": "percent",
"discountValue": 20,
"minOrderValue": 300,
"maxDiscountValue": 100,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": "2025-12-31T23:59:59.000Z"
},
{
"code": "SAVE50",
"title": "Big Savings",
"description": "₹50 off on orders above ₹500",
"discountType": "flat",
"discountValue": 50,
"minOrderValue": 500,
"maxDiscountValue": 50,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
},
{
"code": "FAMILY15",
"title": "Family Feast",
"description": "15% off on orders above ₹800",
"discountType": "percent",
"discountValue": 15,
"minOrderValue": 800,
"maxDiscountValue": 150,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
}
],
"\_id": "69247d4971f7eb127f5cff19"
}
],
"subscription": {
"limits": {
"tables": 10,
"staff": 1,
"menuItems": 200
},
"features": {
"advancedBilling": false,
"splitBilling": false,
"multiPaymentModes": false,
"offersAndCoupons": false,
"analyticsBasic": true,
"analyticsAdvanced": false,
"kds": false,
"whatsappAutomation": false,
"automation": false,
"menuScheduling": false,
"variants": false,
"modifiers": false,
"bulkEdit": false,
"dynamicPricing": false,
"dynamicComboPricing": false
},
"plan": "FREE",
"expiry": null,
"createdAt": "2025-11-18T15:10:25.106Z"
},
"createdAt": "2025-11-18T15:10:25.115Z",
"updatedAt": "2025-11-24T15:44:09.295Z",
"\_\_v": 2
}
}

PATCH {{base_url}}/api/{{rid}}/admin/pricing/{{version}}/activate

req :
{}

res:
{
"\_id": "691c8c61fce5b87e6264c766",
"restaurantId": "dominos-aadarsh-nagar-5635",
"restaurantName": "Dominos Aadarsh Nagar",
"ownerName": "Rahul Singh",
"phone": "9876543210",
"email": "rahul.singh@dominos.com",
"staffAliases": [],
"waiterNames": [
"Pankaj S",
"Rahul"
],
"pricingConfigs": [
{
"version": 1,
"active": false,
"effectiveFrom": "2025-10-15T00:00:00.000Z",
"globalDiscountPercent": 10,
"serviceChargePercent": 5,
"taxes": [
{
"name": "GST",
"percent": 18,
"code": "GST",
"inclusive": false,
"_id": "6920303acc8c0f4ab23f86c4"
},
{
"name": "Service Tax",
"percent": 0,
"code": "SVCTAX",
"inclusive": false,
"_id": "6920303acc8c0f4ab23f86c5"
}
],
"createdBy": "manager",
"reason": "Festive Offer",
"createdAt": "2025-11-21T09:26:18.337Z",
"offers": [
{
"code": "FIRST20",
"title": "Welcome Offer",
"description": "20% off on your first order",
"discountType": "percent",
"discountValue": 20,
"minOrderValue": 300,
"maxDiscountValue": 100,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": "2025-12-31T23:59:59.000Z"
},
{
"code": "SAVE50",
"title": "Big Savings",
"description": "₹50 off on orders above ₹500",
"discountType": "flat",
"discountValue": 50,
"minOrderValue": 500,
"maxDiscountValue": 50,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
},
{
"code": "FAMILY15",
"title": "Family Feast",
"description": "15% off on orders above ₹800",
"discountType": "percent",
"discountValue": 15,
"minOrderValue": 800,
"maxDiscountValue": 150,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
}
],
"\_id": "6920303acc8c0f4ab23f86c3"
},
{
"version": 2,
"active": true,
"effectiveFrom": "2025-10-15T00:00:00.000Z",
"globalDiscountPercent": 10,
"serviceChargePercent": 5,
"taxes": [
{
"name": "GST",
"percent": 18,
"code": "GST",
"inclusive": false,
"_id": "69247d4971f7eb127f5cff1a"
},
{
"name": "Service Tax",
"percent": 0,
"code": "SVCTAX",
"inclusive": false,
"_id": "69247d4971f7eb127f5cff1b"
}
],
"createdBy": "manager",
"reason": "Festive Offer",
"createdAt": "2025-11-24T15:44:09.289Z",
"offers": [
{
"code": "FIRST20",
"title": "Welcome Offer",
"description": "20% off on your first order",
"discountType": "percent",
"discountValue": 20,
"minOrderValue": 300,
"maxDiscountValue": 100,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": "2025-12-31T23:59:59.000Z"
},
{
"code": "SAVE50",
"title": "Big Savings",
"description": "₹50 off on orders above ₹500",
"discountType": "flat",
"discountValue": 50,
"minOrderValue": 500,
"maxDiscountValue": 50,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
},
{
"code": "FAMILY15",
"title": "Family Feast",
"description": "15% off on orders above ₹800",
"discountType": "percent",
"discountValue": 15,
"minOrderValue": 800,
"maxDiscountValue": 150,
"isActive": true,
"validFrom": "2025-10-15T00:00:00.000Z",
"validTill": null
}
],
"\_id": "69247d4971f7eb127f5cff19"
}
],
"subscription": {
"limits": {
"tables": 10,
"staff": 1,
"menuItems": 200
},
"features": {
"advancedBilling": false,
"splitBilling": false,
"multiPaymentModes": false,
"offersAndCoupons": false,
"analyticsBasic": true,
"analyticsAdvanced": false,
"kds": false,
"whatsappAutomation": false,
"automation": false,
"menuScheduling": false,
"variants": false,
"modifiers": false,
"bulkEdit": false,
"dynamicPricing": false,
"dynamicComboPricing": false
},
"plan": "FREE",
"expiry": null,
"createdAt": "2025-11-18T15:10:25.106Z"
},
"createdAt": "2025-11-18T15:10:25.115Z",
"updatedAt": "2025-11-24T15:44:45.296Z",
"\_\_v": 2
}
