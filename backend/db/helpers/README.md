# Database Query Helpers

This directory contains query helper functions for interacting with the PostgreSQL database using raw SQL queries.

## Structure

```
backend/db/helpers/
├── queryUtils.js          # Base query utility functions
├── queries/
│   ├── index.js          # Central export for all queries
│   ├── games.js          # Game-related queries
│   ├── users.js          # User-related queries
│   ├── carts.js          # Cart-related queries
│   ├── orders.js         # Order-related queries
│   ├── categories.js     # Category-related queries
│   ├── genres.js         # Genre-related queries
│   ├── reviews.js        # Review-related queries
│   ├── library.js        # Library and wishlist queries
│   └── coupons.js        # Coupon-related queries
└── README.md             # This file
```

## Usage

### Basic Example

```javascript
const { games, users, carts } = require('./db/helpers/queries');
const { connectDB } = require('./db/index');

// Connect to database
await connectDB();

// Get all games
const allGames = await games.getAllGames();

// Get game by ID
const game = await games.getGameById(123456);

// Get user by email
const user = await users.getUserByEmail('user@example.com');

// Get user cart
const cart = await carts.getCartWithItems(userId);
```

### Games Queries

```javascript
const { games } = require('./db/helpers/queries');

// Get all games with pagination
const gamesList = await games.getAllGames({
  limit: 20,
  offset: 0,
  sortBy: 'name',
  order: 'ASC'
});

// Get game with full details
const gameDetails = await games.getGameWithDetails(123456);

// Search games
const searchResults = await games.searchGames('action', {
  limit: 10,
  offset: 0
});

// Get games by genre
const genreGames = await games.getGamesByGenre(1, {
  limit: 20,
  offset: 0
});

// Get games by filter
const filteredGames = await games.getGamesByFilter({
  platform: 'windows',
  minPrice: 0,
  maxPrice: 50,
  hasDiscount: true
}, {
  limit: 20,
  offset: 0,
  sortBy: 'price_final',
  order: 'ASC'
});
```

### Users Queries

```javascript
const { users } = require('./db/helpers/queries');

// Create user
const newUser = await users.createUser({
  email: 'user@example.com',
  username: 'username',
  password_hash: 'hashed_password',
  role: 'user',
  date_of_birth: '2000-01-01',
  country: 'US'
});

// Get user with profile
const userWithProfile = await users.getUserWithProfile(userId);

// Update user
const updatedUser = await users.updateUser(userId, {
  country: 'CA'
});

// Create billing address
const address = await users.createBillingAddress({
  user_id: userId,
  full_name: 'John Doe',
  line1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'US'
});
```

### Carts Queries

```javascript
const { carts } = require('./db/helpers/queries');

// Get or create cart
const cart = await carts.getOrCreateCart(userId);

// Get cart with items
const cartWithItems = await carts.getCartWithItems(userId);

// Add item to cart
await carts.addItemToCart(cart.id, appId);

// Remove item from cart
await carts.removeItemFromCart(cart.id, appId);

// Clear cart
await carts.clearCart(cart.id);
```

### Orders Queries

```javascript
const { orders } = require('./db/helpers/queries');

// Create order from cart
const order = await orders.createOrderFromCart(userId, {
  discount_code: 'SAVE10',
  billing_address_id: addressId
});

// Get order with items
const orderWithItems = await orders.getOrderWithItems(orderId);

// Get user orders
const userOrders = await orders.getUserOrders(userId, {
  limit: 10,
  offset: 0,
  sortBy: 'created_at',
  order: 'DESC'
});

// Update order status
await orders.updateOrderStatus(orderId, 'paid');
```

### Categories and Genres

```javascript
const { categories, genres } = require('./db/helpers/queries');

// Get all categories
const allCategories = await categories.getAllCategories();

// Get categories for a game
const gameCategories = await categories.getCategoriesByGame(appId);

// Get all genres
const allGenres = await genres.getAllGenres();

// Get genres for a game
const gameGenres = await genres.getGenresByGame(appId);
```

### Reviews Queries

```javascript
const { reviews } = require('./db/helpers/queries');

// Create review
const review = await reviews.createReview({
  user_id: userId,
  app_id: appId,
  review_text: 'Great game!',
  is_recommended: true
});

// Get reviews for a game
const gameReviews = await reviews.getReviewsByGame(appId, {
  limit: 10,
  offset: 0
});

// Get review statistics
const stats = await reviews.getReviewStats(appId);
```

### Library and Wishlist

```javascript
const { library } = require('./db/helpers/queries');

// Get user library
const userLibrary = await library.getUserLibrary(userId, {
  limit: 20,
  offset: 0
});

// Add game to library
await library.addToLibrary(userId, appId, orderId);

// Check if in library
const isOwned = await library.isInLibrary(userId, appId);

// Get user wishlist
const wishlist = await library.getUserWishlist(userId, {
  limit: 20,
  offset: 0
});

// Add to wishlist
await library.addToWishlist(userId, appId);

// Remove from wishlist
await library.removeFromWishlist(userId, appId);
```

### Coupons Queries

```javascript
const { coupons } = require('./db/helpers/queries');

// Get coupon by code
const coupon = await coupons.getCouponByCode('SAVE10');

// Check if user has used coupon
const hasUsed = await coupons.hasUserUsedCoupon(userId, couponId);

// Record coupon usage
await coupons.recordCouponUsage(userId, couponId, orderId);

// Calculate discount
const discount = coupons.calculateDiscount(coupon, totalPrice);
```

## Query Utils

The `queryUtils.js` file provides base utility functions:

- `query(queryText, params)` - Execute query and return rows
- `queryOne(queryText, params)` - Execute query and return single row
- `queryCount(queryText, params)` - Execute query and return count
- `transaction(callback)` - Execute transaction
- `buildWhereClause(filters, paramValues, startIndex)` - Build WHERE clause
- `buildOrderClause(sortBy, order)` - Build ORDER BY clause
- `buildPaginationClause(limit, offset)` - Build LIMIT/OFFSET clause

## Transactions

For complex operations that require transactions:

```javascript
const { transaction } = require('./db/helpers/queryUtils');

await transaction(async (client) => {
  // Use client.query() for all queries within transaction
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  // Transaction automatically commits or rolls back on error
});
```

## Error Handling

All query functions throw errors that should be caught:

```javascript
try {
  const game = await games.getGameById(appId);
  if (!game) {
    throw new Error('Game not found');
  }
} catch (error) {
  console.error('Error fetching game:', error);
  // Handle error
}
```

## Notes

- All queries use parameterized queries to prevent SQL injection
- Queries return promises that should be awaited
- Always connect to database before using queries: `await connectDB()`
- Use transactions for operations that require multiple queries
- Check for null results when using `queryOne()` functions

