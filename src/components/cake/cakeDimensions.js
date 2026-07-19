// ---------------------------------------------------------------------------
// cakeDimensions.js
//
// Every size/position constant the cake depends on, in one place with no
// dependency on CakeModel.jsx or any of its sibling decoration components.
// This module exists specifically to break a circular import: CakeModel
// renders <CreamRosettes />, and CreamRosettes needs CAKE_TOP_SURFACE_Y /
// CAKE_TOP_LAYER_RADIUS. If those constants live inside CakeModel.jsx itself,
// loading CakeModel triggers loading CreamRosettes before CakeModel's own
// exports finish initializing — a "Cannot access before initialization"
// error. Putting the shared numbers here, with zero imports from either
// consumer, means both can import from this module directly and the cycle
// never forms.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3. Dimension constants
// ---------------------------------------------------------------------------
export const BOTTOM_LAYER_RADIUS = 1.6;
export const BOTTOM_LAYER_HEIGHT = 1.1;

export const TOP_LAYER_RADIUS = 1.05;
export const TOP_LAYER_HEIGHT = 0.85;

export const CREAM_RING_RADIUS = TOP_LAYER_RADIUS * 1.585;
export const CREAM_RING_HEIGHT = 0.12;

export const STAND_RADIUS = BOTTOM_LAYER_RADIUS * 1.25;
export const STAND_HEIGHT = 0.15;

// ---------------------------------------------------------------------------
// 3a. Stand silhouette — radius ratios (fractions of STAND_RADIUS)
// ---------------------------------------------------------------------------
export const BASE_FOOT_RADIUS_RATIO = 0.9;
export const BASE_BULGE_RADIUS_RATIO = 1.0;
export const BASE_NECK_RADIUS_RATIO = 0.42;
export const LOWER_COLLAR_RADIUS_RATIO = 0.5;
export const COLUMN_WAIST_RADIUS_RATIO = 0.32;
export const UPPER_COLLAR_RADIUS_RATIO = 0.48;
export const PLATE_UNDER_RADIUS_RATIO = 0.44;
export const PLATE_EDGE_RADIUS_RATIO = 1.0;
export const PLATE_CHAMFER_RADIUS_RATIO = 0.92;

export const BASE_BULGE_HEIGHT_RATIO = 0.55;
export const COLLAR_TRANSITION_RATIO = 0.5;
export const PLATE_WALL_HEIGHT_RATIO = 0.45;

// ---------------------------------------------------------------------------
// 3b. Stand silhouette — height fractions of STAND_HEIGHT (sum to exactly 1)
// ---------------------------------------------------------------------------
export const BASE_HEIGHT_FRACTION = 0.32;
export const LOWER_COLLAR_HEIGHT_FRACTION = 0.1;
export const UPPER_COLLAR_HEIGHT_FRACTION = 0.1;
export const PLATE_HEIGHT_FRACTION = 0.18;
export const COLUMN_HEIGHT_FRACTION =
  1 -
  BASE_HEIGHT_FRACTION -
  LOWER_COLLAR_HEIGHT_FRACTION -
  UPPER_COLLAR_HEIGHT_FRACTION -
  PLATE_HEIGHT_FRACTION;

export const BASE_TOP_Y = STAND_HEIGHT * BASE_HEIGHT_FRACTION;
export const LOWER_COLLAR_TOP_Y = BASE_TOP_Y + STAND_HEIGHT * LOWER_COLLAR_HEIGHT_FRACTION;
export const COLUMN_TOP_Y = LOWER_COLLAR_TOP_Y + STAND_HEIGHT * COLUMN_HEIGHT_FRACTION;
export const UPPER_COLLAR_TOP_Y = COLUMN_TOP_Y + STAND_HEIGHT * UPPER_COLLAR_HEIGHT_FRACTION;
export const PLATE_TOP_Y = UPPER_COLLAR_TOP_Y + STAND_HEIGHT * PLATE_HEIGHT_FRACTION;

export const BASE_FOOT_RADIUS = STAND_RADIUS * BASE_FOOT_RADIUS_RATIO;
export const BASE_BULGE_RADIUS = STAND_RADIUS * BASE_BULGE_RADIUS_RATIO;
export const BASE_NECK_RADIUS = STAND_RADIUS * BASE_NECK_RADIUS_RATIO;
export const LOWER_COLLAR_RADIUS = STAND_RADIUS * LOWER_COLLAR_RADIUS_RATIO;
export const COLUMN_WAIST_RADIUS = STAND_RADIUS * COLUMN_WAIST_RADIUS_RATIO;
export const UPPER_COLLAR_RADIUS = STAND_RADIUS * UPPER_COLLAR_RADIUS_RATIO;
export const PLATE_UNDER_RADIUS = STAND_RADIUS * PLATE_UNDER_RADIUS_RATIO;
export const PLATE_EDGE_RADIUS = STAND_RADIUS * PLATE_EDGE_RADIUS_RATIO;
export const PLATE_CHAMFER_RADIUS = PLATE_EDGE_RADIUS * PLATE_CHAMFER_RADIUS_RATIO;

export const STAND_RADIAL_SEGMENTS = 64;

// ---------------------------------------------------------------------------
// 3c. Icing cap — radius ratios (fractions of TOP_LAYER_RADIUS / ICING_RADIUS)
// ---------------------------------------------------------------------------
export const ICING_OVERHANG_RATIO = 1.08;
export const ICING_FLAT_CENTER_RADIUS_RATIO = 0.5;
export const ICING_EDGE_ROUND_MID_RATIO = 0.5;

export const ICING_CAP_HEIGHT_RATIO = 0.22;
export const ICING_EDGE_LIFT_RATIO = 0.35;
export const ICING_SKIRT_DROP_RATIO = 0.3;

export const ICING_RADIUS = TOP_LAYER_RADIUS * ICING_OVERHANG_RATIO;
export const ICING_FLAT_CENTER_RADIUS = ICING_RADIUS * ICING_FLAT_CENTER_RADIUS_RATIO;
export const ICING_CAP_HEIGHT = TOP_LAYER_HEIGHT * ICING_CAP_HEIGHT_RATIO;
export const ICING_EDGE_LIFT_HEIGHT = ICING_CAP_HEIGHT * ICING_EDGE_LIFT_RATIO;
export const ICING_SKIRT_DROP_HEIGHT = TOP_LAYER_HEIGHT * ICING_SKIRT_DROP_RATIO;

export const ICING_RADIAL_SEGMENTS = STAND_RADIAL_SEGMENTS;

// ---------------------------------------------------------------------------
// 3d. Frosting lip
// ---------------------------------------------------------------------------
export const FROSTING_PATH_RADIUS_RATIO = 1.0;
export const FROSTING_PATH_RADIUS = ICING_RADIUS * FROSTING_PATH_RADIUS_RATIO;

export const FROSTING_TUBE_RADIUS_RATIO = 0.4;
export const FROSTING_TUBE_RADIUS = ICING_CAP_HEIGHT * FROSTING_TUBE_RADIUS_RATIO;

export const FROSTING_FLATTEN_RATIO = 0.55;

export const FROSTING_EMBED_RATIO = 0.4;

export const FROSTING_WOBBLE_PRIMARY_FREQUENCY = 5;
export const FROSTING_WOBBLE_SECONDARY_FREQUENCY = 11;
export const FROSTING_WOBBLE_PRIMARY_AMPLITUDE_RATIO = 0.16;
export const FROSTING_WOBBLE_SECONDARY_AMPLITUDE_RATIO = 0.08;
export const FROSTING_WOBBLE_PRIMARY_AMPLITUDE =
  FROSTING_TUBE_RADIUS * FROSTING_WOBBLE_PRIMARY_AMPLITUDE_RATIO;
export const FROSTING_WOBBLE_SECONDARY_AMPLITUDE =
  FROSTING_TUBE_RADIUS * FROSTING_WOBBLE_SECONDARY_AMPLITUDE_RATIO;

export const FROSTING_TUBULAR_SEGMENTS = 128;
export const FROSTING_RADIAL_SEGMENTS = ICING_RADIAL_SEGMENTS;

// ---------------------------------------------------------------------------
// 3e. Cake drips
// ---------------------------------------------------------------------------
export const DRIP_COUNT = 16;
export const DRIP_ANGLE_STEP = (Math.PI * 2) / DRIP_COUNT;

export const DRIP_RADIUS_RATIO = 0.6;
export const DRIP_RADIUS = FROSTING_TUBE_RADIUS * DRIP_RADIUS_RATIO;

export const DRIP_MIN_LENGTH_RATIO = 0.25;
export const DRIP_MAX_LENGTH_RATIO = 0.65;

export const DRIP_LENGTH_FREQUENCY = 2.4;

// Drips originate at the sponge surface radius, tucked just under the icing
// overhang so they read as emerging from beneath the icing skirt.
export const DRIP_ORIGIN_RADIUS = TOP_LAYER_RADIUS;

export const DRIP_BODY_RADIAL_SEGMENTS = 12;

// ---------------------------------------------------------------------------
// 4. Position constants (derived, stacked bottom-up from the stand)
// ---------------------------------------------------------------------------
export const BOTTOM_LAYER_Y = STAND_HEIGHT + BOTTOM_LAYER_HEIGHT / 2;

export const CREAM_RING_Y =
  STAND_HEIGHT + BOTTOM_LAYER_HEIGHT + CREAM_RING_HEIGHT / 2;

export const TOP_LAYER_Y =
  STAND_HEIGHT + BOTTOM_LAYER_HEIGHT + CREAM_RING_HEIGHT + TOP_LAYER_HEIGHT / 2;

export const TOP_SPONGE_SURFACE_Y = TOP_LAYER_Y + TOP_LAYER_HEIGHT / 2;

export const FROSTING_Y_RESOLVED =
  TOP_SPONGE_SURFACE_Y +
  ICING_EDGE_LIFT_HEIGHT -
  FROSTING_TUBE_RADIUS * FROSTING_EMBED_RATIO;

export const DRIP_ORIGIN_Y = TOP_SPONGE_SURFACE_Y - ICING_SKIRT_DROP_HEIGHT;

// ---------------------------------------------------------------------------
// 4a. Decorative piped border positions (depend on position constants above)
// ---------------------------------------------------------------------------
export const PEARL_RADIUS_RATIO = 0.35;
export const PEARL_RADIUS = FROSTING_TUBE_RADIUS * PEARL_RADIUS_RATIO;

export const PEARL_OVERLAP_RATIO = 0.85;

// --- Top border -------------------------------------------------------------
export const TOP_BORDER_RADIUS_RATIO = 1.02;
export const TOP_BORDER_RADIUS = ICING_RADIUS * TOP_BORDER_RADIUS_RATIO;

export const TOP_BORDER_LIFT_RATIO = 0.6;
// Anchored to ICING_EDGE_LIFT_HEIGHT, not ICING_CAP_HEIGHT: in the icing
// profile, radius ICING_RADIUS occurs at ICING_EDGE_LIFT_HEIGHT — the widest
// point of the icing sits there, not at the flat-top apex. FrostingLip
// anchors to the same height for the same radius; the border matches it so
// the pearls rest on the icing edge instead of floating above it.
export const TOP_BORDER_Y =
  TOP_SPONGE_SURFACE_Y + ICING_EDGE_LIFT_HEIGHT + PEARL_RADIUS * TOP_BORDER_LIFT_RATIO;

export const TOP_BORDER_PEARL_COUNT = Math.ceil(
  (Math.PI * 2 * TOP_BORDER_RADIUS) / (PEARL_RADIUS * 2 * PEARL_OVERLAP_RATIO)
);

// --- Bottom border ----------------------------------------------------------
export const BOTTOM_BORDER_RADIUS_RATIO = 1.01;
export const BOTTOM_BORDER_RADIUS = TOP_LAYER_RADIUS * BOTTOM_BORDER_RADIUS_RATIO;

export const BOTTOM_BORDER_DROP_RATIO = 0.4;
export const BOTTOM_BORDER_Y =
  TOP_LAYER_Y - TOP_LAYER_HEIGHT / 2 - PEARL_RADIUS * BOTTOM_BORDER_DROP_RATIO;

export const BOTTOM_BORDER_PEARL_COUNT = Math.ceil(
  (Math.PI * 2 * BOTTOM_BORDER_RADIUS) / (PEARL_RADIUS * 2 * PEARL_OVERLAP_RATIO)
);

// ---------------------------------------------------------------------------
// 5. Public API for future siblings (Candle, Flame, Cherry, Sprinkles, ...)
// ---------------------------------------------------------------------------
export const CAKE_TOP_SURFACE_Y = TOP_SPONGE_SURFACE_Y + ICING_CAP_HEIGHT;
export const CAKE_TOP_LAYER_RADIUS = TOP_LAYER_RADIUS;
export const ICING_FLAT_CENTER_RADIUS_EXPORT = ICING_FLAT_CENTER_RADIUS;