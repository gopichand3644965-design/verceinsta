# FullWB Backend

A simple Express backend for the FullWB ecommerce frontend.

## Setup

1. `cd backend`
2. `npm install`
3. `npm start`

The server listens on `http://localhost:4000` by default.

## API Endpoints

- `GET /api/ping`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders`
- `POST /api/orders`
- `PUT /api/orders/:id/status`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `GET /api/user/settings`
- `PUT /api/user/settings`
- `GET /api/user/addresses`
- `POST /api/user/addresses`
- `DELETE /api/user/addresses/:addressId`
- `GET /api/user/cart`
- `PUT /api/user/cart`
- `DELETE /api/user/cart`
