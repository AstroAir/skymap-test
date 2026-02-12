// ============================================================================
// Mount Overlay Constants
// ============================================================================

/** RGBA color for the mount position circle */
export const MOUNT_CIRCLE_COLOR: [number, number, number, number] = [0, 1, 0, 0.25];

/** RGBA border color for the mount position circle */
export const MOUNT_CIRCLE_BORDER: [number, number, number, number] = [1, 1, 1, 1];

/** Size [width, height] for the mount position circle */
export const MOUNT_CIRCLE_SIZE: [number, number] = [0.03, 0.03];

/** Transparent RGBA used to hide the mount circle */
export const MOUNT_CIRCLE_HIDDEN_COLOR: [number, number, number, number] = [0, 0, 0, 0];

/** Zero size used to hide the mount circle */
export const MOUNT_CIRCLE_HIDDEN_SIZE: [number, number] = [0, 0];

/** Z-index for the mount overlay layer in Stellarium */
export const MOUNT_LAYER_Z = 7;
