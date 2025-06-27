/**
 * Displays a custom notification message.
 * @param {string} message - The message to display.
 * @param {object} [options] - Configuration for the notification.
 * @param {'success' | 'info' | 'warning' | 'error' | 'confirm'} [options.type='info'] - The type of notification.
 * @param {number} [options.duration=4000] - How long to show (ms). 0 for permanent.
 * @param {Array<object>} [options.buttons] - Array of button objects, e.g., [{text: 'OK', class: 'confirm-btn', action: () => {}}]
 */
export function showNotification(message, options = {}) {
  const { type = "info", duration = 4000, buttons = [] } = options;

  let container = document.getElementById("notificationContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "notificationContainer";
    document.body.appendChild(container);
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const messageElement = document.createElement("p");
  messageElement.className = "notification-message";
  messageElement.textContent = message;
  notification.appendChild(messageElement);

  if (buttons.length > 0) {
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "notification-actions";

    buttons.forEach((buttonInfo) => {
      const button = document.createElement("button");
      button.textContent = buttonInfo.text;
      button.className = `notification-btn ${buttonInfo.class || ""}`;
      button.onclick = (e) => {
        e.stopPropagation();
        if (buttonInfo.action) {
          buttonInfo.action();
        }
        closeNotification(); // Close notification on button click
      };
      actionsContainer.appendChild(button);
    });
    notification.appendChild(actionsContainer);
  }

  // Function to close this specific notification
  const closeNotification = () => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  };

  container.appendChild(notification);
  void notification.offsetWidth; // Trigger reflow
  notification.classList.add("show");

  if (duration > 0) {
    setTimeout(closeNotification, duration);
  }

  // Return the close function so it can be called programmatically
  return closeNotification;
};
