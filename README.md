# KinderGrow: Baby Development Tracker

![KinderGrow Logo](/public/images/logo.png)

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=for-the-badge&logo=clerk)](https://clerk.dev/)

KinderGrow is a comprehensive baby development tracking application designed to help parents monitor their child's growth, feeding, sleep patterns, and more. With an intuitive interface and powerful features, KinderGrow makes it easy to track your child's milestones and daily activities.

## ✨ Features

- **Multi-child Support**: Track multiple children with individual profiles
- **Comprehensive Tracking**:
   - 🍼 Feeding (breast, formula, solid foods)
   - 😴 Sleep patterns and quality
   - 🧷 Diaper changes
   - 📏 Growth measurements (height, weight)
   - 💊 Medication administration
   - 🌡️ Temperature readings
- **Data Visualization**: Interactive charts and graphs to visualize patterns
- **Activity Timeline**: Chronological view of all recorded events
- **Reports**: Generate detailed reports for healthcare providers
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode**: Easy on the eyes for late-night tracking

## 🚀 Technologies Used

- **Frontend**:
   - Next.js 15 (App Router)
   - TypeScript
   - Tailwind CSS
   - shadcn/ui components
   - Recharts for data visualization
   - Framer Motion for animations
   - Clerk for authentication

- **Backend**:
   - Next.js API Routes
   - MongoDB for database
   - Server Actions for form handling

## 📋 Prerequisites

- Node.js 18.0 or later
- MongoDB database (local instance or Atlas)
- Clerk account for authentication

## 🔧 Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/siracsimsek01/kindergrow
    cd kindergrow
    ```

2. **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3. **Set up environment variables**:
    Create a `.env.local` file in the root directory with the following variables:
    ```
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bG9naWNhbC1idWctNzIuY2xlcmsuYWNjb3VudHMuZGV2JA
      CLERK_SECRET_KEY=sk_test_OGXlZjxJCeFOIB38hRX7zMAXatRMkES5UY9Sz3G6ZG
      MONGODB_URI=mongodb+srv://admin:admin123@cluster0.mlqap.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
      MONGO_DB=KinderGrow
      NEXT_PUBLIC_APP_URL=https://9c54-31-205-198-45.ngrok-free.app
      CLERK_WEBHOOK_SECRET=whsec_cB8gX/2gJRJQHP6LqTn+MyyfecZthCG1
    ```

4. **Run the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm 
    ```

5. **Open your browser**:
    Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Running Tests

```bash
npm run test
# or
yarn test
# or
pnpm test
```

## 🚢 Deployment

The application can be deployed to Vercel, Netlify, or any platform supporting Next.js:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

## 📚 Documentation

For detailed documentation on our API endpoints and component usage, visit the `/docs` directory.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.



