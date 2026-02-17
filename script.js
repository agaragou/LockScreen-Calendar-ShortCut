// Year Progress Wallpaper v32 - Wallpapers, gradients and massive rework and update
// by agaragou
// https://github.com/agaragou/LockScreen-Calendar-ShortCut
const CONFIG = {
  // --- 1. GENERAL & APPEARANCE ---
  monthsToShow: 12,        // 12 = Year, 3 = Quarter, 1 = Month
  monthsPerRow: 3,         // Standard is 3
  monthOffset: 0,          // Start from 0 = Current, -1 = Previous, 1 = Next
  contentScale: 1.0,       // Global Scale Multiplier (>1.0 bigger, <1.0 smaller)
  fixedYear: true,         // If true: 12 months -> Jan..Dec; 6 months -> Jan..Jun or Jul..Dec

  // Day & Dot Settings
  showDayNumbers: false,   // true = numbers, false = dots
  firstDayOfWeek: 1,       // 0 = Sunday, 1 = Monday
  highlightWeekends: true,
  dimPastDays: true,       // If true, past days are 30% opacity
  dayFontSizeMultiplier: 1.1, // Font size for days
  dotSizeMultiplier: 1.1,  // Only applies if showDayNumbers is false

  // --- 2. BACKGROUND SETTINGS ---
  // Custom Wallpaper (Photo from Shortcuts)
  showWallpaper: true,     // Priority 1: Use photo if provided
  overlayOpacity: 0.3,     // Darken photo (0.0 - 1.0)

  // Gradient (Priority 2: Used if no photo or showWallpaper=false)
  useGradient: true,
  gradientColors: ["#0F2027", "#203A43", "#2C5364"], // Example: "Moonlit Asteroid"

  // Container (Card behind calendar for better visibility on wallpaper)
  showContainer: true,
  containerOpacity: 0.80,
  containerRadius: 15,

  // --- 3. LAYOUT & WIDGETS ---
  // Avoid Widget Areas?
  widgetsTop: false,
  topWidgetsPadding: 0.36,    // 0.36 = 36% of screen height
  widgetsBottom: false,
  bottomWidgetsPadding: 0.17, // 0.17 = 17% of screen height

  // --- 4. DATA & CALENDARS ---
  calendarPrefix: "*",
  // specificCalendarNames: ["Work", "Home"], 
  specificCalendarNames: [],

  // Manual Dates ["MM-DD"]
  manualSignificantDates: [],

  // Event Sorting
  sortByName: true, // true = Alphabetical, false = System order

  // --- 5. STATISTICS ---
  showStats: true,
  statsMode: "events", // "progress" or "events" // year progress or # events today

  // --- 6. COLORS ---
  colors: {
    bg: new Color("#000000"),
    pastDay: new Color("#ffffff", 0.95),
    futureDay: new Color("#2c2c2e"),
    today: new Color("#ff3b30"),
    significant: new Color("#FFD60A"),
    text: new Color("#98989d"),
    stats: new Color("#ff9f0a"),
    weekend: new Color("#515155ff")
  },

  // --- 7. INTERNAL RATIOS ---
  ratios: {
    topPadding: 0.335,
    spacing: 30.5,
    radius: 0.3,
    monthGap: 1.9,
    colGap: 1.6
  }
};

// --- 1. AUTO-DETECT SCREEN SIZE ---
const screen = Device.screenSize();
const width = screen.width;
const height = screen.height;

// --- LAYOUT CALCULATIONS ---
let startY = CONFIG.widgetsTop ? (height * CONFIG.topWidgetsPadding) : (height * CONFIG.ratios.topPadding);

// Stats & Calendar Limits
let fontSizeStats = (width * 0.028); // FIXED size, ignored by contentScale
const statsHeight = CONFIG.showStats ? (fontSizeStats * 4) : 0;

let calendarLimitY = CONFIG.widgetsBottom
  ? height * (1 - CONFIG.bottomWidgetsPadding)
  : height - statsHeight;

if (CONFIG.widgetsBottom) startY = height * 0.3; // Specific override if bottom widgets exist

const calendarAvailableHeight = calendarLimitY - startY;

// Calendar sizing (will be auto-shrunk if needed)
let dotSpacing = (width / CONFIG.ratios.spacing) * CONFIG.contentScale;
let dotRadius = (dotSpacing * CONFIG.ratios.radius) * CONFIG.dotSizeMultiplier;
let monthGap = dotSpacing * CONFIG.ratios.monthGap;
let colGap = dotSpacing * CONFIG.ratios.colGap;
let fontSizeMonth = (width * 0.022) * CONFIG.contentScale;
let fontSizeDay = (width * 0.022) * CONFIG.dayFontSizeMultiplier * CONFIG.contentScale;

// 4. SCALE DOWN if exceeding limits
const rows = Math.ceil(CONFIG.monthsToShow / CONFIG.monthsPerRow);
const monthsCols = CONFIG.monthsPerRow;

const singleRowHeightInitial = (6 * dotSpacing) + (fontSizeMonth * 2) + monthGap;
const totalContentHeight = (rows * singleRowHeightInitial);

// Calculate Total Width (Approximation for auto-scale check)
const oneMonthWidth = (6 * dotSpacing) + (dotRadius * 2);
const totalContentWidth = (monthsCols * oneMonthWidth) + ((monthsCols - 1) * colGap);

// Determine limiting factors
const heightScale = (totalContentHeight > calendarAvailableHeight) ? (calendarAvailableHeight / totalContentHeight) : 1;
const safeWidth = width * 0.94; // Keep 3% margin on sides
const widthScale = (totalContentWidth > safeWidth) ? (safeWidth / totalContentWidth) : 1;

const finalAutoScale = Math.min(heightScale, widthScale);

if (finalAutoScale < 1.0) {
  // Apply scale to ALL calendar dimensions, but NOT stats
  dotSpacing *= finalAutoScale;
  dotRadius *= finalAutoScale;
  monthGap *= finalAutoScale;
  colGap *= finalAutoScale;
  fontSizeMonth *= finalAutoScale;
  fontSizeDay *= finalAutoScale;
  // fontSizeStats remains untouched
}

const PADDING_TOP = startY;
const DOT_SPACING = dotSpacing;
const DOT_RADIUS = dotRadius;
const MONTH_GAP = monthGap;
const COL_GAP = colGap;
const SINGLE_ROW_HEIGHT = (6 * DOT_SPACING) + (fontSizeMonth * 2) + MONTH_GAP;

// --- 2. AUTO-SCAN CALENDARS ---
const date = new Date();
const currentYear = date.getFullYear();
const currentMonth = date.getMonth();
const currentDay = date.getDate();

async function fetchAutoCalendars() {
  let calendarsList = [];

  // Calculate range based on monthsToShow
  // We need to cover enough future time
  const futureYears = Math.ceil(CONFIG.monthsToShow / 12);
  const startOfRange = new Date(currentYear, 0, 1);
  const endOfRange = new Date(currentYear + futureYears, 11, 31, 23, 59, 59);

  try {
    const allCalendars = await Calendar.forEvents();

    let targetCalendars;
    if (CONFIG.specificCalendarNames && CONFIG.specificCalendarNames.length > 0) {
      targetCalendars = allCalendars.filter(c => CONFIG.specificCalendarNames.includes(c.title));
      // Sort by order in specificCalendarNames (Priority: First in list = Highest Priority)
      targetCalendars.sort((a, b) => {
        return CONFIG.specificCalendarNames.indexOf(a.title) - CONFIG.specificCalendarNames.indexOf(b.title);
      });
    } else {
      targetCalendars = allCalendars.filter(c => c.title.startsWith(CONFIG.calendarPrefix));
      // Sort by name if enabled (only for prefix mode)
      if (CONFIG.sortByName) {
        targetCalendars.sort((a, b) => a.title.localeCompare(b.title));
      }
    }

    for (let cal of targetCalendars) {
      const events = await CalendarEvent.between(startOfRange, endOfRange, [cal]);

      calendarsList.push({
        name: cal.title,
        color: cal.color, // GET COLOR DIRECTLY FROM IOS
        events: events.map(e => ({
          start: e.startDate,
          end: e.endDate
        }))
      });
    }
  } catch (e) { console.log("Error: " + e.message); }

  return calendarsList;
}

const activeCalendarsData = await fetchAutoCalendars();

// --- BACKGROUND DRAWING ---
let bgImage = null;
if (args.images && args.images.length > 0) bgImage = args.images[0];
else if (args.shortcutParameter) {
  if (args.shortcutParameter.size) bgImage = args.shortcutParameter;
  else if (typeof args.shortcutParameter === "string") {
    let path = args.shortcutParameter.replace("file://", "");
    if (FileManager.local().fileExists(path)) bgImage = FileManager.local().readImage(path);
  }
}

// --- DRAWING SETUP ---
const ctx = new DrawContext();
ctx.size = new Size(width, height);
ctx.respectScreenScale = true;
ctx.opaque = true;

// Check if we should draw the image (Priority 1)
if (CONFIG.showWallpaper && bgImage) {
  // 1. Draw image with Aspect Fill (Crop to fit)
  const imgSize = bgImage.size;
  const imgAspect = imgSize.width / imgSize.height;
  const screenAspect = width / height;

  let drawRect;
  if (imgAspect > screenAspect) {
    // Image is wider than screen: scale to height, center width
    const newWidth = height * imgAspect;
    const xOffset = (newWidth - width) / 2;
    drawRect = new Rect(-xOffset, 0, newWidth, height);
  } else {
    // Image is taller than screen: scale to width, center height
    const newHeight = width / imgAspect;
    const yOffset = (newHeight - height) / 2;
    drawRect = new Rect(0, -yOffset, width, newHeight);
  }
  ctx.drawImageInRect(bgImage, drawRect);

  // 2. Draw Overlay (to make text readable)
  if (CONFIG.overlayOpacity > 0) {
    ctx.setFillColor(new Color("#000000", CONFIG.overlayOpacity));
    ctx.fillRect(new Rect(0, 0, width, height));
  }
} else {
  // Default: Check for Gradient or Solid Color
  if (CONFIG.useGradient && CONFIG.gradientColors && CONFIG.gradientColors.length > 1) {
    // Scriptable's DrawContext doesn't have drawGradient directly, 
    // so we use a WebView with HTML5 Canvas to generate the gradient image reliably.
    // This avoids race conditions with "captureSnapshot".
    const gradientColorsString = CONFIG.gradientColors.map(c => `"${c}"`).join(", ");

    const html = `
      <html>
      <body>
        <canvas id="gradCanvas" width="${width}" height="${height}"></canvas>
        <script>
          const canvas = document.getElementById('gradCanvas');
          const ctx = canvas.getContext('2d');
          const grad = ctx.createLinearGradient(0, 0, ${width}, ${height}); // Diagonal
          const colors = [${gradientColorsString}];
          
          colors.forEach((c, i) => {
            grad.addColorStop(i / (colors.length - 1), c);
          });
          
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, ${width}, ${height});
          
          // Return Base64
          completion(canvas.toDataURL("image/png"));
        </script>
      </body>
      </html>`;

    try {
      const wv = new WebView();
      await wv.loadHTML(html);
      const base64String = await wv.evaluateJavaScript("canvas.toDataURL()");

      // Clean up the base64 string (remove data:image/png;base64,) and load
      const imgData = Data.fromBase64String(base64String.split(",")[1]);
      const gradientImage = Image.fromData(imgData);

      ctx.drawImageInRect(gradientImage, new Rect(0, 0, width, height));
    } catch (e) {
      console.log("Gradient Error: " + e.message);
      ctx.setFillColor(new Color(CONFIG.gradientColors[0]));
      ctx.fillRect(new Rect(0, 0, width, height));
    }
  } else {
    // Solid Color
    ctx.setFillColor(CONFIG.colors.bg);
    ctx.fillRect(new Rect(0, 0, width, height));
  }
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDayColor(year, month, day) {
  const monthStr = (month + 1).toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const dateString = `${monthStr}-${dayStr}`;

  // Calculate absolute day values for comparison (year * 10000 + month * 100 + day)
  const absCurrent = currentYear * 10000 + currentMonth * 100 + currentDay;
  const absTarget = year * 10000 + month * 100 + day;

  const isPast = absTarget < absCurrent;
  const isToday = absTarget === absCurrent;

  // Helper to dim color if needed
  const finalizeColor = (c) => {
    if (CONFIG.dimPastDays && isPast) {
      return new Color(c.hex, 0.3); // 30% opacity for past days
    }
    return c;
  };

  // 1. Priority: Today
  if (isToday) return CONFIG.colors.today;

  // 2. Priority: Manual Dates
  if (CONFIG.manualSignificantDates.includes(dateString)) return finalizeColor(CONFIG.colors.significant);

  const dayStart = new Date(year, month, day, 0, 0, 0);
  const dayEnd = new Date(year, month, day, 23, 59, 59);

  // 3. Priority: Calendars
  for (let calData of activeCalendarsData) {
    for (let event of calData.events) {
      if (event.start <= dayEnd && event.end >= dayStart) {
        return finalizeColor(calData.color);
      }
    }
  }

  // 4. Weekend
  const dayOfWeek = new Date(year, month, day).getDay();
  if (CONFIG.highlightWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return finalizeColor(CONFIG.colors.weekend);
  }

  // 5. Background
  if (isPast) {
    if (CONFIG.dimPastDays) return finalizeColor(CONFIG.colors.futureDay); // "As it was" (dimmed future color)
    return CONFIG.colors.pastDay;
  }
  return CONFIG.colors.futureDay;
}

const monthBlockWidth = (6 * DOT_SPACING) + (DOT_RADIUS * 2);
const totalCalendarWidth = (CONFIG.monthsPerRow * monthBlockWidth) + ((CONFIG.monthsPerRow - 1) * COL_GAP);
const startX = (width - totalCalendarWidth) / 2;

// Smart Static Year Logic
// If fixedYear is ON:
// - 12 months: Force Jan-Dec (0)
// - 6 months: Force Jan-Jun (0) or Jul-Dec (6)
// Otherwise: Start from currentMonth (Dynamic)
let loopBaseMonth = currentMonth;
if (CONFIG.fixedYear) {
  if (CONFIG.monthsToShow === 12) {
    loopBaseMonth = 0;
  } else if (CONFIG.monthsToShow === 6) {
    loopBaseMonth = (currentMonth < 6) ? 0 : 6;
  }
}

// --- DRAW CONTAINER (Optional) ---
if (CONFIG.showContainer) {
  const containerPadding = DOT_SPACING * 0.8;
  const containerX = startX - containerPadding;
  const containerW = totalCalendarWidth + (containerPadding * 2);

  // --- CONTAINER BACKGROUND ---
  // Calculate visual boundaries for symmetric padding
  const totalRows = Math.ceil(CONFIG.monthsToShow / CONFIG.monthsPerRow);

  // Find absolute weeks in last row
  const lastRowStartIndex = (totalRows - 1) * CONFIG.monthsPerRow;
  const lastRowEndIndex = Math.min(lastRowStartIndex + CONFIG.monthsPerRow, CONFIG.monthsToShow);
  let maxWeeksInLastRow = 0;

  for (let idx = lastRowStartIndex; idx < lastRowEndIndex; idx++) {
    let targetMonthIndex = (loopBaseMonth + CONFIG.monthOffset + idx);
    let year = currentYear + Math.floor(targetMonthIndex / 12);
    let month = ((targetMonthIndex % 12) + 12) % 12;

    // Week calculation
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();
    const offset = (firstDay - CONFIG.firstDayOfWeek + 7) % 7;
    let w = Math.ceil((daysInMonth + offset) / 7);
    if (w > maxWeeksInLastRow) maxWeeksInLastRow = w;
  }
  if (maxWeeksInLastRow < 4) maxWeeksInLastRow = 4;

  // Visual Top: Above Header
  const headerVisualOffset = (DOT_SPACING * 1.2);
  const contentTopY = PADDING_TOP - headerVisualOffset;

  // Visual Bottom: Below last row dots
  const lastRowY = PADDING_TOP + ((totalRows - 1) * SINGLE_ROW_HEIGHT);
  const dotsHeight = ((maxWeeksInLastRow - 1) * DOT_SPACING) + (DOT_RADIUS * 1.2);
  const contentBottomY = lastRowY + dotsHeight;

  // Draw
  const containerY = contentTopY - containerPadding;
  const containerH = (contentBottomY - contentTopY) + (containerPadding * 2);

  const path = new Path();
  path.addRoundedRect(new Rect(containerX, containerY, containerW, containerH), CONFIG.containerRadius, CONFIG.containerRadius);
  ctx.setFillColor(new Color("#000000", CONFIG.containerOpacity));
  ctx.addPath(path);
  ctx.fillPath();
}

// Loop for dynamic number of months

for (let i = CONFIG.monthOffset; i < CONFIG.monthOffset + CONFIG.monthsToShow; i++) {
  // Logic to handle month/year overflow
  let targetMonthIndex = (loopBaseMonth + i);

  // Correction for negative indices (if we supported past months properly in the loop)
  // Standard math for modulo with negatives
  targetMonthIndex = ((targetMonthIndex % 12) + 12) % 12;

  let targetYear = currentYear + Math.floor((loopBaseMonth + i) / 12);

  // Adjust i for grid placement if we started with negative offset
  let gridIndex = i - CONFIG.monthOffset;
  const colIndex = gridIndex % CONFIG.monthsPerRow;
  const rowIndex = Math.floor(gridIndex / CONFIG.monthsPerRow);

  const blockX = startX + (colIndex * (monthBlockWidth + COL_GAP));
  const rowHeight = SINGLE_ROW_HEIGHT;
  const blockY = PADDING_TOP + (rowIndex * rowHeight);

  ctx.setTextColor(CONFIG.colors.text);
  ctx.setFont(Font.boldSystemFont(fontSizeMonth));
  ctx.setTextAlignedLeft();

  // Header Text
  let headerText = monthNames[targetMonthIndex];
  // Add year if it's different from start or if it's Jan
  if (targetYear !== currentYear || (targetMonthIndex === 0 && i !== 0)) {
    headerText += ` '${targetYear.toString().slice(-2)}`;
  }

  ctx.drawText(headerText, new Point(blockX - (DOT_SPACING * 0.1), blockY - (DOT_SPACING * 1.2)));

  const daysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  let firstDayWeek = new Date(targetYear, targetMonthIndex, 1).getDay();
  // Calculate empty slots at start of month
  // 0 = Sunday, 1 = Monday, etc.
  let startOffset = (firstDayWeek - CONFIG.firstDayOfWeek + 7) % 7;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayIndex = (startOffset + d - 1);
    const gridX = dayIndex % 7;
    const gridY = Math.floor(dayIndex / 7);
    const dotX = blockX + (gridX * DOT_SPACING);
    const dotY = blockY + (gridY * DOT_SPACING);

    // Pass targetYear to getDayColor to handle year boundaries correctly
    const fillColor = getDayColor(targetYear, targetMonthIndex, d);
    if (CONFIG.showDayNumbers) {
      ctx.setTextColor(fillColor);
      ctx.setFont(Font.boldSystemFont(fontSizeDay * 0.9)); // Slightly smaller for numbers
      ctx.setTextAlignedCenter();
      // Center text in the grid cell
      // Used DOT_SPACING as width/height to center in the cell space
      const textRect = new Rect(dotX - (DOT_SPACING * 0.1), dotY - (DOT_SPACING * 0.15), DOT_SPACING * 1.2, DOT_SPACING);
      ctx.drawTextInRect(d.toString(), textRect);
    } else {
      ctx.setFillColor(fillColor);
      ctx.fillEllipse(new Rect(dotX, dotY, DOT_RADIUS * 2, DOT_RADIUS * 2));
    }
  }
}

// --- STATS ---
if (CONFIG.showStats) {
  // Calculate dynamic stats position based on total rows
  const totalRows = Math.ceil(CONFIG.monthsToShow / CONFIG.monthsPerRow);

  // Position stats - PINNED TO ABSOLUTE BOTTOM
  // We use the full HEIGHT (ignoring widget padding)
  const statsY = height - (fontSizeStats * 3.5); // Fixed at bottom
  const statsRect = new Rect(0, statsY, width, fontSizeStats * 3);

  ctx.setTextAlignedCenter();
  ctx.setFont(Font.boldSystemFont(fontSizeStats));
  ctx.setTextColor(CONFIG.colors.stats);
  if (CONFIG.statsMode === "events") {
    let eventCount = 0;
    const todayStart = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
    const todayEnd = new Date(currentYear, currentMonth, currentDay, 23, 59, 59);

    for (let calData of activeCalendarsData) {
      for (let e of calData.events) {
        if (e.start <= todayEnd && e.end >= todayStart) {
          eventCount++;
        }
      }
    }
    const eventWord = (eventCount === 1) ? "event" : "events";
    ctx.drawTextInRect(`${eventCount} ${eventWord} today`, statsRect);
  } else {
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);
    const totalDays = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24);
    const daysPassed = Math.ceil(Math.abs(date - startOfYear) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.floor(totalDays - daysPassed);
    const percentPassed = Math.floor((daysPassed / totalDays) * 100);
    ctx.drawTextInRect(`${daysLeft} days left  •  ${percentPassed}%`, statsRect);
  }
}

// --- OUTPUT ---
const image = ctx.getImage();
const fm = FileManager.local();
const path = fm.joinPath(fm.temporaryDirectory(), "wallpaper_auto.png");
fm.writeImage(path, image);

Script.setShortcutOutput(path);
Script.complete();
