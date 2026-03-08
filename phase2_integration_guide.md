# TradeX Phase 2: Core Trading Features Integration Guide

This document summarizes the steps taken to integrate the core trading features across the TradeX microservices and frontend during Phase 2.

## Overview
Phase 2 focused on replacing mock data in the frontend dashboard with real data by connecting the Next.js frontend to the Spring Boot microservices via the API Gateway. It also introduced Buy/Sell functionality and a Transaction History view.

## 1. Identity Service (Wallet Balance)
**Goal:** Allow the frontend to retrieve the authenticated user's wallet balance.

*   **`UserProfileDto.java`:** Created to transfer user data (id, firstname, lastname, email, role, walletBalance) without exposing sensitive information like passwords.
*   **`UserService.java`:** Added `getUserProfile(Long userId)` to fetch the user from the repository and map it to the DTO.
*   **`UserController.java`:** Added `GET /api/v1/user/me`. 
    *   Uses `@AuthenticationPrincipal UserPrincipal` to extract the `userId` from the JWT token (which is already validated by the `SecurityConfig` and `JwtAuthenticationFilter`).

## 2. Portfolio Service (Stock Holdings)
**Goal:** Allow the frontend to retrieve the user's current stock holdings (quantities and average buy prices).

*   **`PortfolioResponse.java`:** Created to return individual holding records (id, stockId, quantity, avgBuyPrice).
*   **`PortfolioService.java`:** Added `getUserHoldings(Long userId)` to query the `PortfolioRepository` for all holdings belonging to the user.
*   **`PortfolioController.java`:** Added `GET /portfolio/holdings`.
    *   Also uses `@AuthenticationPrincipal UserPrincipal` to extract the `userId` from the JWT token.

## 3. API Gateway Routing
**Goal:** Ensure frontend requests to the new user endpoint are correctly routed to the Identity Service.

*   **`tradex-api-gateway.yml` (Config Server):** 
    *   Added a new route `tradex-identity-user-route`.
    *   Mapped the `Path=/api/v1/user/**` predicate to `lb://tradex-identity-service`.
    *   Applied the `identityCircuitBreaker` filter for resilience.

## 4. Frontend: Dashboard Integration
**Goal:** Replace mock metric data with real data fetched from the backend.

*   **`src/app/dashboard/page.tsx`:**
    *   Updated the `fetchDashboardData` function to use `Promise.all` to concurrently fetch data from:
        1.  `/v1/api/market/all` (Live market prices)
        2.  `/api/v1/user/me` (Wallet balance)
        3.  `/portfolio/holdings` (Stock holdings)
    *   Dynamically calculates the `currentValue` (current price * quantity) and `investedAmount` (avg buy price * quantity) by matching the portfolio's `stockId` against the actual live market data map.

## 5. Frontend: Trading Interface (Buy/Sell)
**Goal:** Enable users to place market orders.

*   **`npm install uuid`:** Installed UUID library to generate unique keys.
*   **`src/app/dashboard/TradeModal.tsx`:** Created a new React component.
    *   Allows selection between "Buy" and "Sell".
    *   Accepts quantity input and calculates the total value based on the live market price.
    *   Sends a `POST` request to `/api/v1/trade/buy` or `/api/v1/trade/sell`.
    *   **Crucial:** Generates a UUID and sends it in the `Idempotency-Key` header. This interacts with the Transact Service's Saga pattern to prevent duplicate charges if the network request is retried.
*   **`src/app/dashboard/page.tsx`:** 
    *   Added "Buy" buttons to the "Top Movers" and "Most Traded" lists to trigger the `TradeModal` state.
    *   Exposed a global `(window as any).refreshDashboard` function so the modal can force a data re-fetch immediately after a successful trade.

## 6. Frontend: Transaction History
**Goal:** Show users a ledger of their past orders.

*   **`src/app/dashboard/TransactionHistory.tsx`:** Created a new component.
    *   Calls `GET /api/v1/trade/orders?page={page}&size={size}` to fetch paginated data from the Transact Service.
    *   Displays a list detailing the Trade Type (Buy/Sell), Stock Symbol (derived by mapping `stockId` with the dashboard's `marketData`), Date, Total Value, and Quantity.
    *   Includes "Previous" and "Next" buttons that interact with the Spring Data `Page` response metadata (`totalPages`).
    *   Overrides the global `refreshDashboard` function to ensure the transaction history also re-fetches to Page 0 whenever a new trade is placed.

## Summary
The dashboard is now a fully integrated interface that securely uses JWT authentication to talk to the API Gateway, which fans out requests to the Identity, Portfolio, Market, and Transact microservices. By combining real-time market data with the user's secure portfolio state, the frontend accurately calculates dynamic returns and seamlessly processes new idempotent orders.

## Phase 3: Wallet Management & Funding
**Goal:** Allow users to instantly top up their wallet balance to execute trades.

*   **`User.java` (Identity Service):** Implemented `creditWallet(BigDecimal amount)` to add funds to the user entity.
*   **`FundsRequest.java` (Identity Service):** Created a DTO to structure the deposit `{ amount }` payload securely.
*   **`UserService.java` & `UserController.java` (Identity Service):** Built `@Transactional` `addFunds` service logic and exposed it at `POST /api/v1/user/funds`. Ensures atomic updates to the repository.
*   **`src/app/dashboard/AddFundsModal.tsx` (Frontend):** Created a dynamic slide-up modal with preset and custom deposit options. Uses `api.post("/api/v1/user/funds")` to instantly credit the user account and refreshes the parent dashboard on success.

## Phase 4: Dedicated Portfolio Analytics
**Goal:** Provide traders with a deep dive into their asset allocation and holding-level performance.

*   **`package.json` (Frontend):** Installed `recharts` for responsive, animated charting.
*   **`src/app/portfolio/page.tsx` (Frontend):** Created a new, dedicated page component.
    *   Concurrently fetches live `/v1/api/market/all` prices and the user's exact `/portfolio/holdings` quantities.
    *   Calculates absolute returns `(Current Value - Invested Amount)` across the entire portfolio.
    *   Renders a dynamically colored `PieChart` visualizing the user's asset allocation by current value.
    *   Displays a comprehensive data table listing exact shares owned, average execution prices, live mark-to-market prices, and individual asset return margins. Integrated dynamic "Buy / Sell" buttons on each row.
*   **`src/components/Navbar.tsx` (Frontend):** Added a top-level navigation link.

## Phase 5: Admin Dashboard & Global Monitoring
**Goal:** Create a secure, restricted portal for administrators to audit platform-wide order flow.

*   **`src/app/admin/layout.tsx` (Frontend):** Built a strict security layout wrapper. It mounts on every `/admin/*` route and intercepts requests. If the authenticated user's JWT `role` is not explicitly `ADMIN`, it forcefully redirects them to the standard dashboard.
*   **`src/app/admin/page.tsx` (Frontend):** Built a global trades ledger.
    *   Communicates securely through the API Gateway to hit the `@PreAuthorize("hasRole('ADMIN')")` protected endpoint: `GET /api/v1/trade/admin/all-trades` on the Transact Service.
    *   Renders a paginated, system-wide data table showing all trades across all users.
    *   Consumes the Spring Data JPA `Page<>` response metadata (`page`, `totalPages`, `totalElements`) to render manual "Next" and "Previous" pagination controls.
*   **`src/components/Navbar.tsx` (Frontend):** Added an "Admin Portal" link that conditionally renders in the top navigation only when the global `authStore` detects `user.role === 'ADMIN'`.
