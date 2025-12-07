/**
 * Accessibility helpers for keyboard navigation
 */

/**
 * Handle keyboard events for clickable elements.
 * Triggers the callback when Enter or Space is pressed.
 *
 * @param callback - Function to call on key press
 * @returns Event handler for onKeyDown
 *
 * @example
 * <div onClick={handleClick} onKeyDown={handleKeyDown(handleClick)} tabIndex={0} role="button">
 *   Click me
 * </div>
 */
export const handleKeyDown = (callback: (e?: React.KeyboardEvent | React.MouseEvent) => void) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(e);
    }
  };
};

/**
 * Handle keyboard events specifically for modal overlays.
 * Triggers close on Escape or when Enter/Space pressed on overlay.
 *
 * @param onClose - Function to call to close modal
 * @returns Event handler for onKeyDown
 *
 * @example
 * <div onClick={onClose} onKeyDown={handleModalOverlayKeyDown(onClose)} tabIndex={0}>
 */
export const handleModalOverlayKeyDown = (onClose: () => void) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };
};

/**
 * Props to spread on modal overlay divs for accessibility
 */
export const getModalOverlayProps = (onClose: () => void) => ({
  onClick: onClose,
  onKeyDown: handleModalOverlayKeyDown(onClose),
  tabIndex: 0,
  'aria-modal': 'true' as const,
  role: 'dialog' as const,
});

/**
 * Props to spread on modal content divs (prevent event propagation)
 */
export const getModalContentProps = () => ({
  onClick: (e: React.MouseEvent) => e.stopPropagation(),
  onKeyDown: (e: React.KeyboardEvent) => {
    // Allow Escape to bubble up to overlay for closing
    if (e.key !== 'Escape') {
      e.stopPropagation();
    }
  },
});
