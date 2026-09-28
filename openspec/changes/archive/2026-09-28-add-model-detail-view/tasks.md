# Tasks

## 1. Modal Markup and Styling

- [x] 1.1 Add `#model-detail-modal` structure (backdrop, dialog, header, body with metrics grid and chart container, close button) in `index.html`
- [x] 1.2 Add CSS styles for modal backdrop, animations, stat cards, and clickable row hover states in `styles.css`

## 2. Modal Controller and Individual Chart Renderer

- [x] 2.1 Implement `openModelDetailModal(modelName)` and `closeModelDetailModal()` in `app.js` with backdrop, button, and Escape key listeners
- [x] 2.2 Wire row click listeners on `tbody tr` to trigger modal opening for the clicked model
- [x] 2.3 Implement extended metrics breakdown and `renderIndividualModelChart(model)` generating native SVG charts inside the modal

## 3. Verification and Acceptance

- [x] 3.1 Verify modal open/close interactions, Escape key listener, and body scroll lock in browser
- [x] 3.2 Verify accuracy of extended metrics and individual SVG charts for multiple models in browser
