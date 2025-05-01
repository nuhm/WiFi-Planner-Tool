# WiFi Access Point Planning Tool

An interactive React-based application designed to help visualize and optimize WiFi Access Point (AP) placement within custom-built floorplans.

## Features

- ⚙️ Add and remove nodes, walls, and access points
- 📐 Snap to grid with 45° and 90° wall placement enforcement
- 📡 Visualize WiFi signal coverage in real time
- 📊 Room detection and automatic fill
- 🧠 Undo/Redo functionality for user actions
- 🧱 Wall splitting on intersection
- 🧭 Zoom and pan canvas view
- 🛠 Custom configuration for wall materials and thickness
- 🔥 Signal strength heatmaps based on propagation loss

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm start
```

This will open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/          # Reusable UI components (e.g. CanvasGrid, Toast, TopBar)
│   └── grid/            # Low-level grid drawing utilities and previews
├── constants/           # Global constants and configuration values
├── helpers/             # Utility functions (e.g. geometry, math)
├── pages/               # Main page-level views (e.g. Workspace, Home)
├── styles/              # Global and scoped CSS files
├── App.js               # Root component
├── index.js             # React DOM entry point
└── ...
```

## Tech Stack

- React
- HTML5 Canvas
- UUID
- CSS Modules

## Deployment

To build for production:

```bash
npm run build
```

Build output will be placed in the `build/` folder.

## License

This project is developed for educational purposes as part of a BSc dissertation.
