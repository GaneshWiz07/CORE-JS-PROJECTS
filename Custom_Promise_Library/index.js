// ========================================
// PROMISE TUTORIAL WITH PROMISE.ALL()
// ========================================

console.log("🚀 Starting Promise Tutorial with Promise.all()");

// PART 1: Basic Promise Chain (E-commerce Example)
console.log("\n=== PART 1: Basic Promise Chain ===");
const Cart = ["Shoes", "T-shirt", "Pant", "Jacket"];

createOrder(Cart)
    .then((orderId) => {
        console.log("✅ Order created successfully with ID:", orderId);
    return orderId;
    })
    .then((orderId) => {
    return proceedToPayment(orderId);
    })
    .then((paymentId) => {
        console.log("✅ Payment completed with ID:", paymentId);
        return paymentId;
    })
    .catch((error) => {
        console.log("❌ Error:", error.message);
    })
    .finally(() => {
        console.log("🏁 Order process completed");
    });

// PART 2: Promise.all() Tutorial
console.log("\n=== PART 2: Promise.all() Tutorial ===");

// Example 1: Loading User Dashboard Data (Parallel API calls)
console.log("\n📊 Example 1: Loading User Dashboard Data");
Promise.all([
    fetchUserProfile(123),
    fetchUserOrders(123),
    fetchUserNotifications(123),
    fetchUserRecommendations(123)
])
.then(([profile, orders, notifications, recommendations]) => {
    console.log("✅ Dashboard loaded successfully!");
    console.log("👤 Profile:", profile.name);
    console.log("📦 Orders:", orders.length, "orders");
    console.log("🔔 Notifications:", notifications.length, "unread");
    console.log("💡 Recommendations:", recommendations.length, "items");
})
.catch((error) => {
    console.log("❌ Failed to load dashboard:", error.message);
});

// Example 2: Processing Multiple Orders Simultaneously
console.log("\n📋 Example 2: Processing Multiple Orders");
const multipleCarts = [
    ["Laptop", "Mouse"],
    ["Book", "Pen", "Notebook"],
    ["Phone", "Case"]
];

Promise.all(multipleCarts.map(cart => createOrder(cart)))
    .then((orderIds) => {
        console.log("✅ All orders created:", orderIds);
        // Now process payments for all orders
        return Promise.all(orderIds.map(orderId => proceedToPayment(orderId)));
    })
    .then((paymentIds) => {
        console.log("✅ All payments completed:", paymentIds);
    })
    .catch((error) => {
        console.log("❌ One or more orders failed:", error.message);
    });

// Example 3: File Upload with Validation (Real-world scenario)
console.log("\n📁 Example 3: Multiple File Upload");
const files = ["document1.pdf", "image1.jpg", "spreadsheet1.xlsx"];

Promise.all([
    uploadFile(files[0]),
    uploadFile(files[1]),
    uploadFile(files[2])
])
.then((uploadResults) => {
    console.log("✅ All files uploaded successfully:");
    uploadResults.forEach((result, index) => {
        console.log(`   📄 ${files[index]} -> ${result.url}`);
    });
    
    // Now validate all uploaded files
    return Promise.all(uploadResults.map(result => validateFile(result)));
})
.then((validationResults) => {
    console.log("✅ All files validated:");
    validationResults.forEach((result, index) => {
        console.log(`   ✓ ${files[index]}: ${result.status}`);
    });
})
.catch((error) => {
    console.log("❌ File processing failed:", error.message);
});

// Example 4: Promise.all() vs Sequential Execution Comparison
console.log("\n⚡ Example 4: Performance Comparison");

// Sequential execution (slower)
console.log("🐌 Sequential execution starting...");
const sequentialStart = Date.now();
fetchData("api1")
    .then(() => fetchData("api2"))
    .then(() => fetchData("api3"))
    .then(() => {
        const sequentialEnd = Date.now();
        console.log(`🐌 Sequential completed in: ${sequentialEnd - sequentialStart}ms`);
    });

// Parallel execution with Promise.all() (faster)
console.log("🚀 Parallel execution starting...");
const parallelStart = Date.now();
Promise.all([
    fetchData("api1"),
    fetchData("api2"),
    fetchData("api3")
])
.then(() => {
    const parallelEnd = Date.now();
    console.log(`🚀 Parallel completed in: ${parallelEnd - parallelStart}ms`);
});

// Example 5: Error Handling in Promise.all()
console.log("\n🛡️ Example 5: Error Handling");
Promise.all([
    successfulOperation("Task 1"),
    failingOperation("Task 2"), // This will fail
    successfulOperation("Task 3")
])
.then((results) => {
    console.log("✅ All tasks completed:", results);
})
.catch((error) => {
    console.log("❌ Promise.all failed because:", error.message);
    console.log("💡 Note: Promise.all fails fast - if ANY promise rejects, the whole operation fails");
});

// Example 6: Promise.allSettled() Alternative (handles failures gracefully)
console.log("\n🔄 Example 6: Promise.allSettled() for Graceful Error Handling");
Promise.allSettled([
    successfulOperation("Task 1"),
    failingOperation("Task 2"), // This will fail
    successfulOperation("Task 3")
])
.then((results) => {
    console.log("📊 All tasks completed (success and failures):");
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            console.log(`   ✅ Task ${index + 1}: ${result.value}`);
        } else {
            console.log(`   ❌ Task ${index + 1}: ${result.reason.message}`);
        }
    });
});


function createOrder(Cart){
  return new Promise((resolve, reject) => {
    if(!validateCart(Cart)){
      const err=new Error("Cart is not valid");
      reject(err);
    }
    const orderId=123456;
    if(orderId){
      setTimeout(()=>{
        resolve(orderId);
      },5000);
    }
  });
}


function proceedToPayment(orderId){
    return new Promise((resolve,reject)=>{
        if (!orderId){
            reject(new Error("Invalid order ID for payment"));
        }
        
        // Simulate payment process
        setTimeout(()=>{
            // Simulate payment success/failure
            const paymentSuccess = Math.random() > 0.2; // 80% success rate
            
            if(paymentSuccess){
                console.log("Payment successful");
                const paymentId = "PAY_" + Math.random().toString(36).substr(2, 9);
                resolve(paymentId);
            } else {
                reject(new Error("Payment failed"));
            }
        },2000);
    });
}



function validateCart(Cart){
  return Cart && Cart.length > 0;
}

// ========================================
// SUPPORTING FUNCTIONS FOR PROMISE.ALL() EXAMPLES
// ========================================

// Dashboard Data Functions
function fetchUserProfile(userId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: userId,
                name: "John Doe",
                email: "john@example.com",
                avatar: "https://example.com/avatar.jpg"
            });
        }, Math.random() * 1000 + 500); // 500-1500ms
    });
}

function fetchUserOrders(userId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: "ORD_001", product: "Laptop", status: "delivered" },
                { id: "ORD_002", product: "Mouse", status: "shipped" },
                { id: "ORD_003", product: "Keyboard", status: "processing" }
            ]);
        }, Math.random() * 1000 + 300); // 300-1300ms
    });
}

function fetchUserNotifications(userId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 1, message: "Your order has shipped", read: false },
                { id: 2, message: "New product recommendations", read: false },
                { id: 3, message: "Payment confirmation", read: true }
            ]);
        }, Math.random() * 800 + 200); // 200-1000ms
    });
}

function fetchUserRecommendations(userId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: "REC_001", product: "Wireless Headphones", price: 99.99 },
                { id: "REC_002", product: "Smartphone Case", price: 24.99 },
                { id: "REC_003", product: "Tablet Stand", price: 39.99 }
            ]);
        }, Math.random() * 1200 + 400); // 400-1600ms
    });
}

// File Upload Functions
function uploadFile(filename) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate 90% success rate
            if (Math.random() > 0.1) {
                resolve({
                    filename: filename,
                    url: `https://storage.example.com/${filename}`,
                    size: Math.floor(Math.random() * 5000000), // Random file size
                    uploadedAt: new Date().toISOString()
                });
            } else {
                reject(new Error(`Failed to upload ${filename}`));
            }
        }, Math.random() * 2000 + 500); // 500-2500ms
    });
}

function validateFile(uploadResult) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate 95% validation success
            if (Math.random() > 0.05) {
                resolve({
                    ...uploadResult,
                    status: "valid",
                    scanned: true,
                    validatedAt: new Date().toISOString()
                });
            } else {
                reject(new Error(`File validation failed for ${uploadResult.filename}`));
            }
        }, Math.random() * 1000 + 200); // 200-1200ms
    });
}

// Performance Comparison Functions
function fetchData(apiName) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Data from ${apiName}`);
        }, 1000); // Fixed 1 second delay to show timing difference
    });
}

// Error Handling Example Functions
function successfulOperation(taskName) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`${taskName} completed successfully`);
        }, Math.random() * 1000 + 300);
    });
}

function failingOperation(taskName) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error(`${taskName} failed due to network error`));
        }, Math.random() * 1000 + 300);
    });
}

// ========================================
// PROMISE.ALL() KEY CONCEPTS SUMMARY
// ========================================

console.log(`
📚 PROMISE.ALL() KEY CONCEPTS:

1. ⚡ PARALLEL EXECUTION: All promises run simultaneously, not sequentially
2. 🎯 ALL OR NOTHING: If ANY promise rejects, Promise.all() rejects immediately
3. 📊 ORDERED RESULTS: Results array maintains the same order as input promises
4. 🚀 PERFORMANCE: Much faster than sequential execution for independent operations
5. 🛡️ ERROR HANDLING: Use .catch() to handle failures, or Promise.allSettled() for graceful handling

🔧 COMMON USE CASES:
- Loading multiple API endpoints for a dashboard
- Processing multiple files simultaneously
- Validating multiple form fields
- Fetching user data, settings, and preferences in parallel
- Uploading multiple files at once

⚠️ WHEN NOT TO USE:
- When operations depend on each other (use .then() chaining)
- When you need to handle failures individually (use Promise.allSettled())
- When you want to process results as they complete (use Promise.race() or async iteration)
`);

// Example of Custom Promise.all() Implementation (Educational)
console.log("\n🔧 Bonus: Custom Promise.all() Implementation");

function customPromiseAll(promises) {
    return new Promise((resolve, reject) => {
        if (promises.length === 0) {
            resolve([]);
            return;
        }
        
        const results = new Array(promises.length);
        let completedPromises = 0;
        
        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then((value) => {
                    results[index] = value;
                    completedPromises++;
                    
                    if (completedPromises === promises.length) {
                        resolve(results);
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    });
}

// Test custom implementation
customPromiseAll([
    Promise.resolve("First"),
    Promise.resolve("Second"),
    Promise.resolve("Third")
]).then((results) => {
    console.log("✅ Custom Promise.all() result:", results);
});
