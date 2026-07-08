# secondServe

> **Zero-waste logistics for modern enterprises.**
> 
> 🌐 **Live Demo:** [https://second-serve-ten.vercel.app/](https://second-serve-ten.vercel.app/)

**secondServe** is an enterprise-grade B2B SaaS platform designed to eliminate food waste by connecting high-volume food donors (restaurants, hotels, cafes) directly to local communities and NGOs in real-time. 

By combining geospatial tracking, real-time WebSockets, and AI-driven safety analysis, secondServe ensures that surplus food is rescued safely, efficiently, and with full traceability.

---

## 🚀 The Core Problem & Our Solution
Real-world logistics are messy. When a restaurant has 50 extra meals at closing time, coordinating a pickup traditionally involves frantic phone calls and unverified arrivals. 

**secondServe** solves this by treating food rescue as a high-stakes logistics pipeline:
- **For Donors:** Post surplus food in seconds. The platform automatically extracts dietary and safety data using AI, and pings nearby registered receivers.
- **For Receivers:** View a live map of available food in your radius. Claim items instantly and get turn-by-turn routing to the pickup location.

---

## ✨ Key Features

- **Split-Screen Enterprise UI:** A beautiful, responsive, CTO-approved dashboard featuring an App Shell pattern, persistent sidebars, and fluid drawer overlays.
- **Real-Time Live Map:** Powered by `react-leaflet` and `Socket.IO`. Watch available food markers appear and disappear on the map instantly as they are posted or claimed.
- **Geospatial Intelligence:** Uses MongoDB's powerful `$geoNear` aggregation pipeline to calculate precise distances and only show relevant rescues within the user's selected radius.
- **AI Safety Analysis:** Integrates the Groq API (Llama3) to automatically parse unstructured food descriptions into structured dietary tags and strict food safety guidelines.
- **Resilient State Machine:** Food listings don't just disappear when claimed. They move through a strict, trackable state machine: `active` ➔ `claimed` ➔ `en_route` ➔ `arrived` ➔ `completed` (with edge cases for `issue_reported`).
- **Secure Authentication:** Full JWT-based auth flow with location coordinate capturing.

---

## 🛠 Tech Stack

**Frontend**
- React 18 (Vite)
- Tailwind CSS (Custom enterprise design system)
- React-Leaflet (Maps)
- Socket.IO-client (Real-time events)
- Lucide React (Icons)

**Backend**
- Node.js & Express
- TypeScript
- MongoDB Atlas & Mongoose (Geospatial indexing)
- Socket.IO (Event broadcasting)
- Groq SDK (Llama3 integration)
- JSON Web Tokens (JWT)

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or local instance)
- Groq API Key (for AI features)

### 1. Clone & Install
```bash
git clone https://github.com/Pritii-9/SecondServe.git
cd SecondServe

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=4000
MONGO_URI=mongodb+srv://<your_connection_string>
JWT_SECRET=your_super_secret_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Run the Application
You can run both servers concurrently.

**Start the Backend:**
```bash
cd backend
npm run dev
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🏗 Architecture & Design Philosophy
This project was built with a strict adherence to modern SaaS standards:
1. **Separation of Concerns:** Operational dashboards are strictly separated from administrative settings.
2. **Modal-First Interactions:** Data-entry forms (like creating a listing) are encapsulated in modals to prevent dashboard noise and maintain a "read-heavy" layout.
3. **Graceful Degradation:** If the AI API fails, the platform falls back to generic, safe food handling instructions without breaking the UI.

---

## 🤝 Contributing
Contributions are welcome! Please ensure all PRs follow the strict TypeScript configurations and maintain the existing Tailwind design hierarchy.

## 📄 License
This project is licensed under the MIT License.
