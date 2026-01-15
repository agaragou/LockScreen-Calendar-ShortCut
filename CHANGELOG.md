# Changelog

## v30 (Wallpapers, Gradients & Massive Rework)

This is a major overhaul focusing on customization and stability.

### **New Core Features**
- **Enhanced Background Support:**
    - **Custom Wallpapers:** Native support for using photos from Shortcuts as backgrounds (`showWallpaper: true`). Includes `overlayOpacity` to darken images for better text contrast.
    - **Container Card:** New `showContainer` option draws a semi-transparent rounded card behind the calendar, perfect for improving legibility on busy wallpapers. Features symmetrical padding logic for a "slim fit" look.
    - **Gradients:** Added support for CSS-style linear gradients (`useGradient`) as a robust fallback if no wallpaper is provided.
- **Configurability:**
    - **`monthOffset`:** Easily control the starting month (0 = Current, 1 = Next, -1 = Previous).
    - **Reorganized Config:** Settings are now grouped logically (Appearance, Background, Layout, etc.) for easier editing.
    - **Dynamic Sizing:** `contentScale` now applies more intelligently.

### **How to use Wallpapers**
1. In Shortcuts, use "Find Photos" to get a random image.
2. Pass that image into the "Run Script" parameter.
3. Enable `showWallpaper: true` in config.

### **Improvements**
- **Layout:** "Start of Week" logic improved.
- **Visuals:** Refined padding and spacing calculations.
- **Code:** Significant cleanup of comments and unused legacy variables.

---

## v26 (Major Update)

### **New Core Features**
- **Dynamic Layout:**
    - `monthsToShow`: Configure how many months to display (e.g., 1, 3, 6, 12).
    - `monthsPerRow`: Customize grid columns (e.g., 3 columns for standard view, 1 column for a vertical strip).
- **Auto-Scaling Engine:** Smart layout logic that automatically scales fonts and spacing down to fit the screen height, or up to `contentScale` limit. Checks both width and height to prevent overflow.

### **Visual Customization**
- **Day Numbers:** Added `showDayNumbers` (boolean) to switch between abstract dots and actual dates (1, 2, 3...).
- **Weekend Highlighting:** `highlightWeekends` option paints Saturdays/Sundays with a distinct color.
- **"History" Mode:** `dimPastDays` option makes past days semi-transparent (keeping their original event/weekend color) instead of turning them plain white.
- **Global Zoom:** `contentScale` allows increasing the overall size of the calendar.
- **Fine-Tuning:** `dotSizeMultiplier` and `dayFontSizeMultiplier` for precise control over element sizes.
- **Stats Position:** `statsPositionBottom` to pin the footer text to the bottom of the screen.

### **Configuration & Logic**
- **Lock Screen Widget Space:** `widgetsTop` / `widgetsBottom` options (with configurable padding `topWidgetsPadding` / `bottomWidgetsPadding`) to strictly reserve space for iOS Lock Screen widgets.
- **Stats Mode:** Added `statsMode` to switch between "Year Progress" (default) and "Events Today" count.
- **Calendar Priority:** `specificCalendarNames` now respects the array order for color priority (first = highest).
- **Renamed Colors:** `highlightText` is now `stats` for clarity.

### **Improvements**
- **Memory Safety:** Optimized canvas sizing to prevent crashes on high-res devices (especially for Home Screen widgets).
- **Sorting:** Fixed sorting logic for specific calendars to ensure consistent layering of events.

---

## v25.0 (Original)
- Initial release with fixed 12-month layout.
- Basic auto-scale based on width only.
